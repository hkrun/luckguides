import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers'
import { IOrderDetail, createOrderDetailsFromStripe, refundedOrderDetailsFromStripe, subscriptionCancelledFromStripe, createTrialSubscriptionFromStripe } from "@/actions/stripe-billing";
import { setKeyWithExpiry, getKey } from "@/lib/redis-client";
import { PROJECT_ID } from '@/config/config';
import Stripe from 'stripe';

const expirySeconds = 60 * 60 * 1; // 1 hour

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { stripeAccount: process.env.STRIPE_ACCOUNT_ID });

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;



export async function POST(request: NextRequest) {

    try {
        if (!webhookSecret) {
            return new Response("Stripe Webhook Secret not set in .env", {
                status: 500,
            });
        }

        const body = await request.text();
        //const payload = JSON.parse(body);


        const headerPayload = await headers();
        const signature = headerPayload.get('stripe-signature') || '';

        let event = null;

        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                webhookSecret
            );
        } catch (err) {
            return new Response('Invalid signature.', {
                status: 400
            })
        }

        // 项目过滤逻辑 - 只处理本项目的事件
        if (!isEventFromCurrentProject(event, PROJECT_ID)) {
            console.log(`跳过处理其他项目的事件: ${event.type}, 事件ID: ${event.id}`);
            return new Response('Event skipped - not from current project', { status: 200 });
        }

        console.log(`处理本项目事件: ${event.type}, 项目ID: ${PROJECT_ID}`);

        // 防重复处理机制
        const processingKey = `webhook_processed_${event.id}`;

        // 检查是否已经处理过
        const alreadyProcessed = await getKey(processingKey);
        if(alreadyProcessed){
          console.log(`Webhook事件 ${event.id} 已处理过，跳过重复处理`);
          return new Response('Webhook already processed', {
            status: 200
          })
        }

        // 立即标记为正在处理，防止并发处理
        await setKeyWithExpiry(processingKey, Date.now().toString(), expirySeconds);
        console.log(`标记Webhook事件开始处理: ${event.id}`);

        switch (event.type) {
            case 'payment_intent.succeeded':
                console.log('处理支付成功事件');
                await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
                break;
            // case 'charge.succeeded':
            //     console.log('处理订阅付款成功事件');
            //     await handleChargeSuccess(event.data.object as Stripe.Charge);
            //     break;
            case 'invoice.paid':
                console.log('🔄 处理订阅发票支付事件（续费）');
                await handleInvoicePaid(event.data.object as Stripe.Invoice);
                break;
            case 'charge.refunded':
                console.log('处理退款事件');
                await handleRefund(event.data.object as Stripe.Charge);
                break;
            case 'customer.subscription.deleted':
                console.log('处理订阅取消事件');
                await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
                break;
            case 'customer.subscription.created':
                console.log('🎉 处理订阅创建事件');
                await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
                break;
            default:
                console.log('未处理的事件类型:', event.type, '- 已忽略');
                // 对于未处理的事件类型，返回200状态码避免Stripe重复发送
                break;
        }

        console.log(`Webhook事件 ${event.id} 处理完成`);
        return new Response('Webhook processed successfully', { status: 200 });
    } catch (error: unknown) {
        console.error(error);
        return new Response(`Webhook error: ${error}`, {
            status: 400,
        });
    }
}



async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    console.log("=== 处理支付成功事件 ===");
    console.log("paymentIntent:", JSON.stringify(paymentIntent, null, 2));

    // 检查是否是订阅支付
    if (paymentIntent.invoice) {
        console.log('检测到这是订阅支付的PaymentIntent，直接处理积分');
        console.log('发票ID:', paymentIntent.invoice);
        
        // 从发票中获取订阅和价格信息
        let user_id = paymentIntent.metadata?.userId;
        let priceId = paymentIntent.metadata?.priceId;
        
        // 如果 payment intent 中没有 metadata，从发票和订阅中获取
        if (!user_id || !priceId) {
            console.log('从发票中获取订阅和价格信息');
            try {
                const invoice = await stripe.invoices.retrieve(paymentIntent.invoice as string, {
                    expand: ['lines.data.price', 'subscription'],
                });
                
                // 获取价格ID
                if (invoice.lines.data.length > 0 && invoice.lines.data[0].price) {
                    const lineItem = invoice.lines.data[0];
                    if (lineItem.price && typeof lineItem.price !== 'string') {
                        priceId = lineItem.price.id;
                    }
                }
                
                // 获取用户ID
                if (invoice.subscription) {
                    // 检查是否是字符串ID还是扩展的对象
                    let subscriptionId: string;
                    if (typeof invoice.subscription === 'string') {
                        subscriptionId = invoice.subscription;
                    } else {
                        subscriptionId = invoice.subscription.id;
                        // 如果已经是扩展的对象，直接获取metadata
                        user_id = invoice.subscription.metadata?.userId || '';
                    }
                    
                    // 如果还没有获取到用户ID，再次查询订阅
                    if (!user_id) {
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                        user_id = subscription.metadata?.userId || '';
                    }
                }
                
                console.log('从发票获取的信息:', { user_id, priceId });
            } catch (error) {
                console.error('获取发票信息失败:', error);
                return;
            }
        }
        
        const transaction_id = paymentIntent.payment_method as string;
        const invoice = paymentIntent.invoice as string;
        const price = (paymentIntent.amount || 0) / 100;
        const date = new Date(paymentIntent.created * 1000).toISOString();
        
        console.log('订阅支付解析信息:', {
            transaction_id,
            user_id,
            invoice,
            priceId,
            price,
            date
        });
        
        if (!user_id) {
            console.error('订阅支付中未找到用户ID');
            return;
        }
        
        if (!priceId) {
            console.error('订阅支付中未找到价格ID');
            return;
        }
        
        const orderDetails: IOrderDetail = {
            userId: user_id,
            transactionId: transaction_id,
            invoice: invoice,
            priceId: priceId,
            price: price,
            date: date
        };
        
        console.log('订阅支付订单详情:', JSON.stringify(orderDetails, null, 2));
        await createOrderDetailsFromStripe(orderDetails, false, false); // 不是试用，不是续费
        return;
    }

    // 判断是否为订阅支付（通过description判断）
    const isSubscription = paymentIntent.description?.includes('Subscription');
    const paymentType = isSubscription ? '订阅支付' : '一次性支付';
    
    console.log(`=== 确认为${paymentType}，开始处理 ===`);

    const transaction_id = paymentIntent.payment_method as string;
    let user_id = paymentIntent.metadata?.userId;
    const invoice = paymentIntent.invoice as string;
    let priceId = paymentIntent.metadata?.priceId;
    const price = (paymentIntent.amount || 0) / 100;
    const date = new Date(paymentIntent.created * 1000).toISOString();
    
    // 如果是订阅支付但metadata不完整，从subscription中获取
    if ((!user_id || !priceId) && isSubscription && paymentIntent.customer) {
        console.log("从客户订阅中获取metadata");
        try {
            const subscriptions = await stripe.subscriptions.list({
                customer: typeof paymentIntent.customer === 'string' 
                    ? paymentIntent.customer 
                    : paymentIntent.customer.id,
                limit: 1,
                status: 'active'
            });
            
            if (subscriptions.data.length > 0) {
                const subscription = subscriptions.data[0];
                
                if (!user_id) {
                    user_id = subscription.metadata?.userId || '';
                }
                if (!priceId) {
                    priceId = subscription.metadata?.priceId || '';
                }
            }
        } catch (error) {
            console.error('获取订阅信息失败:', error);
        }
    }
    
    console.log(`${paymentType}解析信息:`, {
        transaction_id,
        user_id,
        invoice,
        priceId,
        price,
        date
    });
    
    if (!user_id) {
        console.error(`${paymentType}中未找到用户ID`);
        return;
    }
    
    if (!priceId) {
        console.error(`${paymentType}中未找到价格ID`);
        return;
    }
    
    const orderDetails: IOrderDetail = {
        userId: user_id,
        transactionId: transaction_id,
        invoice: invoice || '',
        priceId: priceId,
        price: price,
        date: date,
        customerId: typeof paymentIntent.customer === 'string' 
            ? paymentIntent.customer 
            : paymentIntent.customer?.id
    };
    
    // 🎯 检查是否是试用订阅的支付，如果是则跳过处理
    // 试用订阅已经在 subscription.created 事件中处理过了
    if (isSubscription && paymentIntent.customer) {
        try {
            const subscriptions = await stripe.subscriptions.list({
                customer: typeof paymentIntent.customer === 'string' 
                    ? paymentIntent.customer 
                    : paymentIntent.customer.id,
                limit: 1,
                status: 'all' // 包括 trialing 状态
            });
            
            if (subscriptions.data.length > 0) {
                const subscription = subscriptions.data[0];
                const isTrialSubscription = subscription.metadata?.isTrial === 'true' ||
                                          subscription.status === 'trialing' ||
                                          subscription.trial_end !== null;
                
                if (isTrialSubscription) {
                    console.log('🎁 检测到试用订阅的支付事件，跳过处理（已在subscription.created中处理）');
                    return;
                }
            }
        } catch (error) {
            console.error('检查试用状态失败:', error);
        }
    }

    console.log(`${paymentType}订单详情:`, JSON.stringify(orderDetails, null, 2));
    await createOrderDetailsFromStripe(orderDetails, false, false); // 不是试用，不是续费
}

// async function handleChargeSuccess(charge: Stripe.Charge) {
//     console.log("=== 处理付款成功事件 ===");

//     if (charge.payment_intent) {
//         try {
//             const paymentIntent = await stripe.paymentIntents.retrieve(
//                 typeof charge.payment_intent === 'string' 
//                     ? charge.payment_intent 
//                     : charge.payment_intent.id
//             );
//             await handlePaymentSuccess(paymentIntent);
//         } catch (error) {
//             console.error('获取payment_intent失败:', error);
//         }
//     } else {
//         console.log('charge事件无关联payment_intent');
//     }
// }

async function handleRefund(charge: Stripe.Charge) {
    //console.log(charge);
    const transaction_id = charge.payment_method as string; // stripe transaction id
    const user_id = charge.metadata.userId; // login user id
    const invoice = charge.invoice as string; // stripe invoice id
    const priceId = charge.metadata.priceId; // price id
    const price = (charge.amount || 0) / 100; // price
    const date = new Date(charge.created * 1000).toISOString();
    const orderDetails: IOrderDetail = {
        userId: user_id,
        transactionId: transaction_id,
        invoice: invoice,
        priceId: priceId,
        price: price,
        date: date
    };
    await refundedOrderDetailsFromStripe(orderDetails);
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    const subscriptionId = subscription.id; // subscription id
    await subscriptionCancelledFromStripe(subscriptionId);
}

// 🔄 处理订阅发票支付事件（续费）
async function handleInvoicePaid(invoice: Stripe.Invoice) {
    console.log("=== 处理订阅发票支付事件（自动续费）===");

    // 检查是否是订阅相关的发票
    const invoiceAny = invoice as any; // 类型断言以访问parent字段

    // 获取subscription ID - 可能在顶层或parent中
    let subscriptionId: string | null = null;
    let subscriptionMetadata: Record<string, string> = {};

    if (invoice.subscription) {
        subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription.id;
    } else if (invoiceAny.parent?.subscription_details?.subscription) {
        subscriptionId = invoiceAny.parent.subscription_details.subscription;
        subscriptionMetadata = invoiceAny.parent.subscription_details.metadata || {};
    }

    if (!subscriptionId) {
        console.log('这不是订阅发票，跳过处理');
        return;
    }

    console.log('处理订阅续费，subscription ID:', subscriptionId, '计费原因:', invoice.billing_reason);

    try {
        // 获取订阅详情
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // 检查是否是试用期订阅的首次发票
        const isTrial = subscription.status === 'trialing' || subscription.trial_end !== null;
        const isFirstInvoice = invoice.billing_reason === 'subscription_create';

        if (isTrial && isFirstInvoice) {
            console.log('跳过试用期订阅的首次发票，积分已在subscription.created事件中处理');
            return;
        }

        // 从订阅metadata或parent metadata中获取用户信息
        let userId = subscription.metadata?.userId || subscriptionMetadata.userId;
        let priceId = subscription.metadata?.priceId || subscriptionMetadata.priceId;
        let projectId = subscription.metadata?.projectId || subscriptionMetadata.projectId;

        // 检查项目标识
        if (!checkProjectIdInMetadata({ projectId }, PROJECT_ID)) {
            console.log(`跳过处理其他项目的订阅续费: ${subscription.id}`);
            return;
        }

        if (!userId || !priceId) {
            console.error('订阅中缺少必要信息:', { userId, priceId });
            return;
        }

        console.log('处理订阅续费:', { userId, priceId, amount: (invoice.amount_paid || 0) / 100 });

        // 创建续费订单记录
        const orderDetails: IOrderDetail = {
            userId: userId,
            transactionId: invoice.payment_intent as string || `renewal_${invoice.id}`,
            invoice: invoice.id,
            priceId: priceId,
            price: (invoice.amount_paid || 0) / 100,
            date: new Date(invoice.created * 1000).toISOString(),
            customerId: typeof invoice.customer === 'string'
                ? invoice.customer
                : invoice.customer?.id,
            subscriptionId: subscriptionId
        };

        console.log('创建续费订单记录');
        await createOrderDetailsFromStripe(orderDetails, false, true); // isRenewal = true

        console.log('订阅续费处理完成');
    } catch (error) {
        console.error('处理订阅续费失败:', error);
    }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
    console.log("=== 处理订阅创建事件 ===");

    // 检查是否是试用期订阅
    const isTrial = subscription.metadata?.isTrial === 'true';
    const user_id = subscription.metadata?.userId;
    const priceId = subscription.metadata?.priceId;

    if (!user_id) {
        console.error('订阅创建事件中未找到用户ID');
        return;
    }

    if (!priceId) {
        console.error('订阅创建事件中未找到价格ID');
        return;
    }

    if (isTrial) {
        console.log('检测到试用期订阅，立即为用户添加积分');

        const orderDetails: IOrderDetail = {
            userId: user_id,
            transactionId: subscription.id,
            invoice: '',
            priceId: priceId,
            price: 0, // 试用期价格为0
            date: new Date(subscription.created * 1000).toISOString(),
            customerId: subscription.customer as string,
            subscriptionId: subscription.id // 直接传递订阅ID
        };

        console.log('创建试用期订阅记录，用户:', user_id);
        await createOrderDetailsFromStripe(orderDetails, true, false); // 试用期，不是续费
    } else {
        console.log('非试用期订阅，等待支付完成后处理积分');
    }
}


/**
 * 检查事件是否来自当前项目
 * @param event Stripe事件对象
 * @param projectId 当前项目标识
 * @returns 是否为当前项目的事件
 */
function isEventFromCurrentProject(event: Stripe.Event, projectId: string): boolean {
    try {
        // 根据不同的事件类型检查项目标识
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                return checkProjectIdInMetadata(paymentIntent.metadata, projectId);
            }
            case 'invoice.paid': {
                // 对于invoice.paid事件，尝试从发票中获取项目标识
                const invoice = event.data.object as Stripe.Invoice;
                
                // 首先检查invoice的metadata
                if (invoice.metadata && checkProjectIdInMetadata(invoice.metadata, projectId)) {
                    return true;
                }
                
                // 如果invoice没有projectId，暂时允许通过，在handleInvoicePaid中会检查订阅的metadata
                // 这是因为invoice.paid事件的项目标识通常在关联的订阅中
                console.log('invoice.paid事件暂时通过初步过滤，将在处理函数中进一步检查');
                return true;
            }
            case 'charge.refunded': {
                const charge = event.data.object as Stripe.Charge;
                return checkProjectIdInMetadata(charge.metadata, projectId);
            }
            case 'customer.subscription.created': {
                const subscription = event.data.object as Stripe.Subscription;
                return checkProjectIdInMetadata(subscription.metadata, projectId);
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                return checkProjectIdInMetadata(subscription.metadata, projectId);
            }
            default:
                // 对于未知事件类型，默认不处理
                console.log(`未知事件类型: ${event.type}，默认跳过处理`);
                return false;
        }
    } catch (error) {
        console.error('检查项目标识时出错:', error);
        // 出错时为了安全起见，跳过处理
        return false;
    }
}

/**
 * 检查metadata中是否包含正确的项目标识
 * @param metadata Stripe对象的metadata
 * @param projectId 当前项目标识
 * @returns 是否匹配当前项目
 */
function checkProjectIdInMetadata(metadata: Stripe.Metadata | null, projectId: string): boolean {
    if (!metadata) {
        console.log('metadata为空，可能是旧数据或其他项目的事件');
        return false;
    }

    const eventProjectId = metadata.projectId;
    if (!eventProjectId) {
        console.log('metadata中没有projectId字段，可能是旧数据或其他项目的事件');
        return false;
    }

    const isMatch = eventProjectId === projectId;
    console.log(`项目ID匹配检查: 事件项目ID=${eventProjectId}, 当前项目ID=${projectId}, 匹配=${isMatch}`);
    return isMatch;
}

export async function GET(request: NextRequest) {
    return new Response("", { status: 200 });
}
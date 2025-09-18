import { addUserCredit, updateUserCreditByClerkId, addSubscription, updateSubscription, addTrialSubscription, updateUserCreditsOnly, addRenewalSubscription } from "@/actions/credits";
import {findUserCreditsByUserId} from "@/actions/user";
import { getProductInfoFromInvoice, getProductInfoFromPrice, cancelSubscription } from "@/lib/stripe-client";
import { IUserCredit } from '@/types/user-credit';

// 价格ID → 内部订阅/套餐类型编码
// 101~199: 一次性套餐；201~299: 个人订阅档位；301~399: 商业版；4: 免费试用
const stripe_subscription_type_map = new Map<string,number>([
    // 一次性套餐（non-recurring）
    ['price_1S5cgnDx3cvsYDBQa8waZ5Dz', 101], // 一次性 基础包
    ['price_1S5ch2Dx3cvsYDBQcy4YbwIJ', 102], // 一次性 专业包
    ['price_1S5cjQDx3cvsYDBQGTGkToKH', 103], // 一次性 高级包

    // 个人订阅（recurring - 月度）
    ['price_1S5cf4Dx3cvsYDBQX4pLFyUq', 201], // 订阅 基础版
    ['price_1S5cffDx3cvsYDBQXG5t2SkW', 202], // 订阅 高级版
    ['price_1S5cgZDx3cvsYDBQ1Yu1cL1U', 203], // 订阅 专业版（个人最高档）

    // 个人订阅（recurring - 年度）
    ['price_1S7YYKDx3cvsYDBQyTkiM3vL', 201], // 年度订阅 基础版
    ['price_1S7YYfDx3cvsYDBQQLkCNcTv', 202], // 年度订阅 高级版
    ['price_1S7YYtDx3cvsYDBQWIHn7l8k', 203], // 年度订阅 专业版

    // 商业版（recurring）
    ['price_1S5h1BDx3cvsYDBQwP6f9qGk', 301], // 商业版订阅（月度）
    ['price_1S7YZGDx3cvsYDBQpy1DfL9S', 301], // 商业版订阅（年度）
]);

// 价格ID → 友好产品名（用于记录）
const price_name_map = new Map<string,string>([
    // 一次性套餐
    ['price_1S5cgnDx3cvsYDBQa8waZ5Dz', 'LuckGuides 基础包（一次性）'],
    ['price_1S5ch2Dx3cvsYDBQcy4YbwIJ', 'LuckGuides 专业包（一次性）'],
    ['price_1S5cjQDx3cvsYDBQGTGkToKH', 'LuckGuides 高级包（一次性）'],

    // 个人订阅（月度）
    ['price_1S5cf4Dx3cvsYDBQX4pLFyUq', 'LuckGuides 基础版（月度订阅）'],
    ['price_1S5cffDx3cvsYDBQXG5t2SkW', 'LuckGuides 高级版（月度订阅）'],
    ['price_1S5cgZDx3cvsYDBQ1Yu1cL1U', 'LuckGuides 专业版（月度订阅）'],

    // 个人订阅（年度）
    ['price_1S7YYKDx3cvsYDBQyTkiM3vL', 'LuckGuides 基础版（年度订阅）'],
    ['price_1S7YYfDx3cvsYDBQQLkCNcTv', 'LuckGuides 高级版（年度订阅）'],
    ['price_1S7YYtDx3cvsYDBQWIHn7l8k', 'LuckGuides 专业版（年度订阅）'],

    // 商业版
    ['price_1S5h1BDx3cvsYDBQwP6f9qGk', 'LuckGuides 商业版（月度订阅）'],
    ['price_1S7YZGDx3cvsYDBQpy1DfL9S', 'LuckGuides 商业版（年度订阅）'],
]);

// 价格ID → 赠送积分数量（一次性为一次发放；订阅为每次支付发放周期额度）
const price_credits_map = new Map<string, number>([
    // 一次性套餐
    ['price_1S5cgnDx3cvsYDBQa8waZ5Dz', 1500],   // 基础包 25 分钟
    ['price_1S5ch2Dx3cvsYDBQcy4YbwIJ', 3600],   // 高级包 60 分钟
    ['price_1S5cjQDx3cvsYDBQGTGkToKH', 5400],  // 专业包 90 分钟

    // 个人订阅（月度 - 每期发放）
    ['price_1S5cf4Dx3cvsYDBQX4pLFyUq', 3000],    // 基础版 50 分钟/月
    ['price_1S5cffDx3cvsYDBQXG5t2SkW', 7200],   // 高级版 120 分钟/月
    ['price_1S5cgZDx3cvsYDBQ1Yu1cL1U', 10800],  // 专业版 180 分钟/月

    // 个人订阅（年度 - 每期发放年度额度）
    ['price_1S7YYKDx3cvsYDBQyTkiM3vL', 36000],   // 基础版 600 分钟/年 (50*12)
    ['price_1S7YYfDx3cvsYDBQQLkCNcTv', 86400],   // 高级版 1440 分钟/年 (120*12)
    ['price_1S7YYtDx3cvsYDBQWIHn7l8k', 129600],  // 专业版 2160 分钟/年 (180*12)

    // 商业版（月度 - 每期发放）
    ['price_1S5h1BDx3cvsYDBQwP6f9qGk', 40000], // 商业版 666 分钟/月（近似无限）

    // 商业版（年度 - 每期发放年度额度）
    ['price_1S7YZGDx3cvsYDBQpy1DfL9S', 480000], // 商业版 8000 分钟/年（近似无限）
]);

// 试用额度（统一发放）
const TRIAL_CREDITS = 300;


export async function createOrderDetailsFromStripe (orderDetails: IOrderDetail, isTrial: boolean = false, isRenewal: boolean = false) {
    console.log('=== 开始处理 Stripe 支付成功 ===');
    console.log('订单详情:', JSON.stringify(orderDetails, null, 2));
    console.log('处理标记:', { isTrial, isRenewal });

    // 🎁 如果是试用订阅，调用专门的试用处理函数
    if (isTrial) {
        console.log('🎁 检测到试用订阅，调用试用处理函数');
        return await createTrialSubscriptionFromStripe(orderDetails);
    }

    const product = await getProductInfo(orderDetails);

    if(!product){
        console.error('获取产品信息失败');
        return;
    }
    console.log('产品信息:', JSON.stringify(product, null, 2));
    
    let subscriptionType = stripe_subscription_type_map.get(product.priceId as string);
    if(!subscriptionType){
        console.error('价格ID映射未找到:', product.priceId);
        console.log('可用的价格映射:', Array.from(stripe_subscription_type_map.entries()));
        return;
    }
    console.log('订阅类型:', subscriptionType);
    
    let credit_desc = '';
    let credit_type = '';
    let isSubscription = false;
    
    if (product.subscriptionId) {
        // 💰 根据续费状态设置不同的描述
        credit_desc = (isRenewal ? 'subscription renewal: ' : 'subscription: ') + product.priceName + ', ' + product.priceId;
        credit_type = '1';
        isSubscription = true;
        console.log(isRenewal ? '识别为订阅续费' : '识别为订阅支付');
    } else {
        credit_desc = 'one time: ' + product.priceName + ', ' + product.priceId;
        credit_type = '2';
        console.log('识别为一次性支付');
    }
    
    const user_id = orderDetails.userId ?? product.userId;
    console.log('用户ID:', user_id);
    
    if (!user_id) {
        console.error('用户ID为空，无法处理支付');
        return;
    }
    
    // 🎯 根据价格ID设置明确的产品名称
    let productName = price_name_map.get(product.priceId || '') || product.priceName || 'LuckGuides 订阅/套餐';
    
    // 如果是续费，添加续费标识
    if (isRenewal) {
        productName = `${productName} (Renewal)`;
    }

    const creditAmount = price_credits_map.get(product.priceId || '') ?? 0;

    const credit: IUserCredit = {
        user_id: user_id,
        order_number: orderDetails.transactionId,
        credit_amount: creditAmount, // 存储本次应发放的积分数量
        credit_type: credit_type,
        credit_transaction_type: '1',
        credit_desc: credit_desc,
        order_price: orderDetails.price,
        order_date: orderDetails.date,
        product_name: productName
    }
    console.log('积分记录:', JSON.stringify(credit, null, 2));
    
    try {
        const creditResult = await addUserCredit(credit);
        console.log('积分记录添加结果:', creditResult);
        
        if (creditResult === 0) {
            console.log('积分记录添加失败或为重复订单，跳过余额更新');
            return;
        }
        
        const balanceResult = await updateUserCreditsOnly(creditAmount, user_id);
        console.log('用户积分余额更新结果:', balanceResult, '发放积分:', creditAmount);
        
        if (balanceResult === 0) {
            console.error('用户积分余额更新失败');
        }
        
        if (isSubscription && product.subscriptionId) {
            credit.subscriptionId = product.subscriptionId;
            
            // 🧠 统一判断是否为“新订阅/升级”：若存在本地最近活跃订阅且 subscriptionId 不同，则视为升级/切换
            let isUpgradeOrNew = !isRenewal; // 默认按传入标志
            try {
                const { getSubscriptionByUserId } = await import('@/actions/user-order');
                const lastSub = await getSubscriptionByUserId(user_id);
                if (lastSub?.subscription_id && lastSub.order_type === '1' && lastSub.subscription_id !== product.subscriptionId) {
                    isUpgradeOrNew = true;
                    // 先取消旧订阅（Stripe + 本地）
                    const { updateSubscriptionByOrderId } = await import('@/actions/user-order');
                    console.log('升级/切换：取消旧订阅 →', lastSub.subscription_id);
                    await updateSubscriptionByOrderId(lastSub.subscription_id);
                }
            } catch (e) {
                console.warn('检查/取消旧订阅时出现问题：', e);
            }

            if (isUpgradeOrNew) {
                // 🆕 新购或升级：写入一条新的订阅记录
                console.log('🆕 处理新订阅记录');
                // 🎯 传递价格ID用于订阅类型判断
                const subscriptionResult = await addSubscription(credit, orderDetails.priceId);
                console.log('新订阅记录添加结果:', subscriptionResult);
                if (subscriptionResult === 0) {
                    console.error('新订阅记录添加失败');
                }
            } else {
                // 🔄 续费或试用转正：追加续费记录
                console.log('🔄 处理续费订阅记录（含试用转正式）');
                // 🎯 传递价格ID用于订阅类型判断
                const subscriptionResult = await addRenewalSubscription(credit, orderDetails.priceId);
                console.log('续费订阅记录添加结果:', subscriptionResult);
                if (subscriptionResult === 0) {
                    console.error('续费订阅记录添加失败');
                }
            }
        }
        
        console.log('=== Stripe 支付处理完成 ===');
    } catch (error) {
        console.error('支付处理过程中出错:', error);
        throw error;
    }
}

export async function refundedOrderDetailsFromStripe (orderDetails: IOrderDetail) {


    const product = await getProductInfo(orderDetails);
    
    if(!product){
        return;
    }

    const variant_id = product.priceId;

    let subscriptionType = stripe_subscription_type_map.get(variant_id);
    if(!subscriptionType){
        return;
    }

    const variant_name = product.priceName;

    const user_id = orderDetails.userId??product.userId;
    
    const credit:IUserCredit ={
        user_id: user_id,
        order_number: orderDetails.transactionId,
        credit_amount: subscriptionType, // 存储订阅类型
        credit_type: '3',
        credit_transaction_type: '3',
        credit_desc: 'refund: '+variant_name+', '+variant_id,
        order_price: orderDetails.price,
        order_date: orderDetails.date
    }
    const currentCredit = await findUserCreditsByUserId(user_id);
    await addUserCredit(credit);
    await updateUserCreditByClerkId(subscriptionType,user_id,currentCredit);
}

export async function subscriptionCancelledFromStripe (subscriptionId: string) {
    await updateSubscription(subscriptionId);
}

async function getProductInfo(orderDetails: IOrderDetail){
    console.log('=== getProductInfo 输入参数 ===');
    console.log('invoice:', orderDetails.invoice);
    console.log('priceId:', orderDetails.priceId);
    console.log('customerId:', orderDetails.customerId);
    
    // 如果有发票ID（订阅支付或一次性支付的发票），优先使用发票获取产品信息
    if(orderDetails.invoice){
        console.log('使用发票ID获取产品信息');
        return await getProductInfoFromInvoice(orderDetails.invoice);
    }

    // 如果没有发票ID但有价格ID，使用价格ID获取产品信息（传递customerId用于订阅查找）
    if(orderDetails.priceId){
        console.log('使用价格ID获取产品信息');
        return await getProductInfoFromPrice(orderDetails.priceId, orderDetails.customerId);
    }

    console.log('既没有发票ID也没有价格ID，无法获取产品信息');
    return undefined;
}

export async function cancelSubscriptionById( subscriptionId: string ){
    return await cancelSubscription(subscriptionId);
}


export interface IOrderDetail {
    userId: string;
    transactionId: string;
    invoice: string;
    priceId: string;
    price: number;
    date: string;
    customerId?: string;
    subscriptionId?: string;
}

// 🆕 处理试用订阅创建（立即给积分）
export async function createTrialSubscriptionFromStripe(orderDetails: IOrderDetail) {
    console.log('=== 开始处理试用订阅创建 ===');
    console.log('试用订阅详情:', JSON.stringify(orderDetails, null, 2));

    const user_id = orderDetails.userId;
    
    if (!user_id) {
        console.error('用户ID为空，无法处理试用订阅');
        return;
    }
    
    // 🎁 试用期特殊处理：统一赠送固定积分
    const trialCredits = TRIAL_CREDITS;
    console.log('试用赠送积分:', trialCredits);

    // 🆕 根据价格ID确定产品信息
    let productName = 'Free Trial';
    let productDesc = 'trial subscription: 3-day free trial';

    if (orderDetails.priceId === 'price_1S5cf4Dx3cvsYDBQX4pLFyUq') {
        // 基础版试用（月度）
        productName = 'LuckGuides 基础版 - 3天免费试用（月度）';
        productDesc = 'trial subscription: LuckGuides Basic 3-day free trial (monthly)';
    } else if (orderDetails.priceId === 'price_1S5cffDx3cvsYDBQXG5t2SkW') {
        // 高级版试用（月度）
        productName = 'LuckGuides 高级版 - 3天免费试用（月度）';
        productDesc = 'trial subscription: LuckGuides Premium 3-day free trial (monthly)';
    } else if (orderDetails.priceId === 'price_1S5cgZDx3cvsYDBQ1Yu1cL1U') {
        // 专业版试用（月度）
        productName = 'LuckGuides 专业版 - 3天免费试用（月度）';
        productDesc = 'trial subscription: LuckGuides Professional 3-day free trial (monthly)';
    } else if (orderDetails.priceId === 'price_1S7YYKDx3cvsYDBQyTkiM3vL') {
        // 基础版试用（年度）
        productName = 'LuckGuides 基础版 - 3天免费试用（年度）';
        productDesc = 'trial subscription: LuckGuides Basic 3-day free trial (annual)';
    } else if (orderDetails.priceId === 'price_1S7YYfDx3cvsYDBQQLkCNcTv') {
        // 高级版试用（年度）
        productName = 'LuckGuides 高级版 - 3天免费试用（年度）';
        productDesc = 'trial subscription: LuckGuides Premium 3-day free trial (annual)';
    } else if (orderDetails.priceId === 'price_1S7YYtDx3cvsYDBQWIHn7l8k') {
        // 专业版试用（年度）
        productName = 'LuckGuides 专业版 - 3天免费试用（年度）';
        productDesc = 'trial subscription: LuckGuides Professional 3-day free trial (annual)';
    }

    console.log(`试用产品信息: ${productName} (${productDesc})`);

    const credit: IUserCredit = {
        user_id: user_id,
        order_number: orderDetails.transactionId,
        credit_amount: trialCredits, // 存储试用赠送的积分
        credit_type: '1', // 订阅积分
        credit_transaction_type: '1', // 获得积分
        credit_desc: productDesc, // 🆕 使用具体的产品描述
        order_price: orderDetails.price, // 0
        order_date: orderDetails.date,
        product_name: productName // 🆕 使用具体的产品名称
    };
    
    console.log('创建试用积分记录:', JSON.stringify(credit, null, 2));
    
    try {
        // ✅ 添加积分记录
        await addUserCredit(credit);
        
        // ✅ 更新用户积分余额（不添加重复记录）
        await updateUserCreditsOnly(trialCredits, user_id);

        // ✅ 创建试用订阅记录
        await addTrialSubscription(credit, orderDetails.subscriptionId || orderDetails.transactionId, orderDetails.priceId);

        console.log(`✅ 试用订阅创建成功，用户 ${user_id} 获得试用积分 ${trialCredits}`);
    } catch (error) {
        console.error('试用订阅创建失败:', error);
        throw error;
    }
}
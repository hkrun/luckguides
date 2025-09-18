import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PROJECT_ID } from '@/config/config';
import { hasUsedFreeTrial } from '@/actions/user-order';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!,
    {
        stripeAccount: process.env.STRIPE_ACCOUNT_ID
    });

export async function POST(req: Request) {

    try {

        const { priceId, userId, type, customerEmail, locale, language } = await req.json();
        
        console.log('=== Stripe API 调试信息 ===');
        console.log('接收到的参数:', { priceId, userId, type, customerEmail, locale, language });
        
        if (!customerEmail) {
            console.error('customerEmail 参数为空');
            return NextResponse.json({ error: '用户邮箱不存在' }, { status: 400 });
        }
        
        // 语言映射表
        const localeMap: { [key: string]: string } = {
            'zh': 'zh',
            'en': 'en',
            'de': 'de',
            'es': 'es',
            'fr': 'fr',
            'ja': 'ja',
            'ko': 'ko'
        };

        // 获取Stripe支持的语言代码
        const stripeLocale = localeMap[locale] || 'en';

        // 根据语言设置自定义文本
        const customMessages: { [key: string]: string } = {
            'zh': '邮箱已自动填充并锁定，以确保支付与您的账户关联',
            'en': 'Email is automatically filled and locked to ensure payment is associated with your account',
            'de': 'E-Mail wird automatisch ausgefüllt und gesperrt, um sicherzustellen, dass die Zahlung mit Ihrem Konto verknüpft ist',
            'es': 'El correo electrónico se completa y bloquea automáticamente para garantizar que el pago esté asociado con su cuenta',
            'fr': 'L\'e-mail est automatiquement rempli et verrouillé pour garantir que le paiement est associé à votre compte',
            'ja': 'メールアドレスは自動的に入力され、ロックされ、お支払いがお客様のアカウントに関連付けられることを保証します',
            'ko': '이메일이 자동으로 채워지고 잠겨서 결제가 귀하의 계정과 연결되도록 보장합니다'
        };

        const param: Stripe.Checkout.SessionCreateParams = {
            ui_mode: 'embedded',
            locale: stripeLocale as Stripe.Checkout.SessionCreateParams.Locale,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            // redirect_on_completion: 'if_required',
            redirect_on_completion: 'never',
            automatic_tax: {enabled: true},
            client_reference_id: userId,
            // return_url:`${req.headers.get("origin")}/return?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                userId: userId,
                priceId: priceId,
                projectId: PROJECT_ID
            },
            customer_email: customerEmail,
            custom_text: {
                submit: {
                    message: customMessages[locale] || customMessages['en'],
                },
            },
        }

        if(type === "1"){
            // 一次性付款
            param.mode = 'payment';
            param.payment_intent_data = {
                metadata: {
                    userId: userId,
                    priceId: priceId,
                    projectId: PROJECT_ID
                }
            };
        } else if(type === "3") {
            // 🆕 免费试用订阅
            console.log('🎁 处理免费试用订阅请求');
            
            // 🚫 防重复检查
            const hasUsedTrial = await hasUsedFreeTrial();
            if (hasUsedTrial) {
                console.log('❌ 用户已使用过免费试用');
                return NextResponse.json({ 
                    error: '您已使用过免费试用，无法再次申请' 
                }, { status: 400 });
            }
            
            console.log('✅ 用户未使用过试用，创建试用订阅');
            param.mode = 'subscription';
            param.subscription_data = {
                trial_period_days: 3, // 🎯 3天试用期
                metadata: {
                    userId: userId,
                    priceId: priceId,
                    projectId: PROJECT_ID,
                    isTrial: 'true', // 🏷️ 试用标识
                    language: language || locale || 'zh' // 多语言支持
                }
            };
        } else {
            // 常规订阅
            param.mode = 'subscription';
            param.subscription_data = {
                metadata: {
                    userId: userId,
                    priceId: priceId,
                    projectId: PROJECT_ID
                }
            };
        }
        
        console.log('创建 Stripe 会话参数:', {
            customer_email: param.customer_email,
            mode: param.mode,
            locale: stripeLocale,
            userId: userId
        });
        
        const session = await stripe.checkout.sessions.create(param);
        
        console.log('Stripe 会话创建成功:', session.id);

        return NextResponse.json({ clientSecret: session.client_secret });
    } catch (error) {
        console.log("payment error", error)
        return NextResponse.json({ error: 'payment error' }, { status: 500 });
    }
}
"use client"

import { useSession, signIn } from "next-auth/react"
import { useState, useEffect, useRef } from 'react'
import CheckoutForm from './checkout-stripe'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import styles from '@/styles/pricing/dialog.module.css'
import { Product } from '@/types/locales/pricing';
import { useToast } from "@/hooks/use-toast"
import { LoginDialog } from "@/components/auth/LoginDialog";
import { hasUsedFreeTrial, hasValidSubscription } from '@/actions/user-order';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pricing } from '@/types/locales/pricing';

interface Props {
    btnlabel: string;
    lang: string;
    mode: "payment" | "recurring";
    paymentTips: string;
    product: Product;
    currency: string;
    authErrorTitle?: string;
    authErrorDesc?: string;
    authTexts?: any;
    paymentTexts?: any;
    // 🆕 试用相关属性
    isFreeTrial?: boolean;
    // 🆕 国际化文本
    i18nPricing?: Pricing;
    // 🆕 是否为热门计划
    isPopular?: boolean;
    // 🆕 版本类型：用于区分不同版本的按钮逻辑
    planType?: 'basic' | 'premium' | 'professional' | 'elite' | 'oneTimeBasic' | 'oneTimePremium' | 'oneTimeProfessional' | 'oneTimeElite' | 'business';
}

export function PaymentButton({ btnlabel, lang, mode, product, currency, paymentTips, authErrorTitle, authErrorDesc, authTexts, paymentTexts, isFreeTrial = false, i18nPricing, isPopular = false, planType = 'basic' }: Props) {
    const { data: session } = useSession()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [hasUsedTrialState, setHasUsedTrialState] = useState(false)
    const [showTrialUsedAlert, setShowTrialUsedAlert] = useState(false)
    const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false)
    const [subscriptionInfo, setSubscriptionInfo] = useState<{
        subscriptionType?: string;
        status?: string;
        expiryDate?: string;
        isActive?: boolean;
    }>({})
    const { toast } = useToast()

    // 🆕 动态按钮文本：根据计划类型和试用状态决定显示内容
    const getButtonLabel = () => {
        // 商业版不提供免费试用，始终显示立即订阅
        if (planType === 'business') {
            return i18nPricing?.subscription?.subscribeNow || "立即订阅";
        }
        // 如果是单次购买，直接使用配置中的按钮文本
        if (planType?.startsWith('oneTime')) {
            return btnlabel;
        }

        // 订阅版本根据试用状态动态显示
        if (hasUsedTrialState) {
            // 如果已使用试用，显示立即订阅
            return i18nPricing?.subscription?.subscribeNow || "立即订阅";
        }
        // 否则显示开始免费试用
        return i18nPricing?.trial?.startFreeTrial || "开始免费试用";
    };

    // 🔍 预检查：用户登录后立即检查是否已使用试用（仅订阅版本需要检查）
    useEffect(() => {
        async function checkSubscription() {
            if (session?.user && !planType?.startsWith('oneTime')) {
                try {
                    console.log('[PricingButton]', planType, 'session ready, check trial');
                    const hasUsedTrial = await hasUsedFreeTrial();
                    setHasUsedTrialState(hasUsedTrial);
                } catch (error) {
                    console.error('Error checking trial status:', error);
                }
            }
        }
        checkSubscription();
    }, [session?.user?.id, planType]); // 仅订阅版本检查试用状态

    // —— 登录后自动恢复未登录时用户点击的价格项（确保页面已完全加载） ——
    const autoTriggeredRef = useRef(false)
    useEffect(() => {
        if (!session?.user || autoTriggeredRef.current) return;
        let cleanup: (() => void) | undefined
        try {
            let raw = sessionStorage.getItem('pendingPricingIntent');
            if (!raw) {
                // 尝试从 localStorage 兜底迁移（防止某些跳转流程导致 sessionStorage 丢失）
                raw = localStorage.getItem('pendingPricingIntent') || '';
                if (raw) {
                    try { sessionStorage.setItem('pendingPricingIntent', raw); localStorage.removeItem('pendingPricingIntent'); } catch {}
                }
            }
            // 再兜底：从 URL 查询参数 intent 读取
            if (!raw && typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const qsIntent = params.get('intent');
                if (qsIntent) {
                    raw = JSON.stringify({ planType: qsIntent, lang });
                    try { sessionStorage.setItem('pendingPricingIntent', raw); } catch {}
                    // 清理地址栏的 intent，避免重复触发
                    try {
                        params.delete('intent');
                        const newUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
                        window.history.replaceState({}, '', newUrl);
                    } catch {}
                }
            }
            if (!raw) { console.log('[PricingButton]', planType, 'no pending intent'); return; }
            const intent = JSON.parse(raw);
            if (!(intent && intent.planType === planType && intent.lang === lang)) return;

            const triggerOpen = () => {
                if (autoTriggeredRef.current) return;
                autoTriggeredRef.current = true;
                console.log('[PricingButton]', planType, 'auto trigger open');
                try { sessionStorage.removeItem('pendingPricingIntent'); } catch {}
                try { localStorage.removeItem('pendingPricingIntent'); } catch {}
                // 给 UI 一点时间完成首屏渲染，避免被并发渲染挤掉
                setTimeout(() => {
                    console.log('[PricingButton]', planType, 'call onClickHandler() after delay');
                    onClickHandler();
                }, 350);
            };

            if (document.readyState === 'complete') {
                console.log('[PricingButton]', planType, 'document ready complete → trigger');
                triggerOpen();
            } else {
                const onLoad = () => {
                    console.log('[PricingButton]', planType, 'window load → trigger');
                    triggerOpen();
                    window.removeEventListener('load', onLoad);
                };
                window.addEventListener('load', onLoad);
                cleanup = () => window.removeEventListener('load', onLoad)
            }
        } catch (e) {
            // ignore parse error
        }
        return cleanup
    }, [session?.user, planType, lang]);

    // 🔍 点击检查：防止重复订阅
    async function onClickHandler() {
        if (!session?.user) {
            // 如果未登录，显示登录提示并打开登录对话框
            toast({
                title: authErrorTitle || "请先登录",
                description: authErrorDesc || "请登录后再进行订阅操作",
                variant: "destructive",
            });

            // 打开登录对话框
            setIsLoginModalOpen(true);
            // 记录用户的点击意图，登录后自动恢复
            try {
                const payload = JSON.stringify({ planType, lang, ts: Date.now() });
                console.log('[PricingButton]', planType, 'store pending intent and open login modal', payload);
                sessionStorage.setItem('pendingPricingIntent', payload);
                localStorage.setItem('pendingPricingIntent', payload);
            } catch (e) {}
            return
        }

        // 如果是单次购买，直接打开支付对话框，跳过订阅和试用检查
        if (planType?.startsWith('oneTime')) {
            setIsOpen(true);
            return;
        }

        // 🔍 检查订阅状态（仅对订阅类型）
        try {
            const subscriptionStatus = await hasValidSubscription();

            // 仅阻止重复订阅同等级；允许升级（basic -> premium/professional，premium -> professional）。
            if (subscriptionStatus.hasValidSubscription && subscriptionStatus.planType) {
                // 定义等级比较
                const rank: Record<string, number> = { basic: 1, premium: 2, professional: 3, business: 10 };
                const current = subscriptionStatus.planType as 'basic' | 'premium' | 'professional' | 'business';
                const target = planType as 'basic' | 'premium' | 'professional' | 'business' | undefined;
                const currentRank = rank[current] ?? 0;
                const targetRank = target ? (rank[target] ?? 0) : 0;

                // 同级或降级：拦截并提示；升级：放行
                if (target && targetRank <= currentRank) {
                    setSubscriptionInfo(subscriptionStatus);
                    setShowSubscriptionAlert(true);
                    return;
                }
            }
        } catch (error) {
            console.error('Error checking subscription status:', error);
            toast({
                title: i18nPricing?.subscription?.checkFailed || "检查失败",
                description: i18nPricing?.subscription?.checkFailedDesc || "无法检查订阅状态，请稍后重试",
                variant: "destructive",
            });
            return;
        }

        // 🎁 免费试用特殊处理：商业版不提供试用；其他订阅版本按试用状态处理
        if (planType !== 'business' && !hasUsedTrialState) {
            try {
                const hasUsedTrial = await hasUsedFreeTrial();
                if (hasUsedTrial) {
                    setHasUsedTrialState(true);
                    // 不显示警告，直接进入正常订阅流程
                } else {
                    // 用户未使用过试用，可以开始试用
                    setIsOpen(true);
                    return;
                }
            } catch (error) {
                console.error('Error checking trial status:', error);
                toast({
                    title: i18nPricing?.trial?.checkFailed || "检查失败",
                    description: i18nPricing?.trial?.checkFailedDesc || "无法验证试用状态，请稍后重试",
                    variant: "destructive",
                });
                return;
            }
        }

        setIsOpen(true) // 打开支付对话框
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className={`sm:max-w-[1024px] border-primary-gold/30 ${styles.lightDialog}`}>
                    <DialogHeader className="flex flex-row items-start justify-between">
                        <DialogTitle className="flex-1">   
                            <span className="text-sm font-semibold text-primary-gold break-words">
                                {paymentTips}
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    {isOpen && <CheckoutForm priceId={product.priceId!}
                    className={styles.lightDialog} mode={mode} locale={lang} paymentTexts={paymentTexts}
                    isFreeTrial={planType === 'business' ? false : (!planType?.startsWith('oneTime') && !hasUsedTrialState)}/>}
                </DialogContent>
            </Dialog>

            <button
                onClick={onClickHandler}
                className={`block w-full py-4 px-6 text-center font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] ${
                    isPopular
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg"
                }`}
            >
                {getButtonLabel()}
            </button>

            <LoginDialog
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                lang={lang}
                i18n={authTexts || {
                    auth: {
                        login: {
                            title: "登录",
                            googleButton: "使用Google登录",
                            orDivider: "或",
                            emailLabel: "邮箱",
                            emailPlaceholder: "请输入邮箱",
                            passwordLabel: "密码",
                            passwordPlaceholder: "请输入密码",
                            loginButton: "登录",
                            registerLink: "注册",
                            registerButton: "立即注册",
                            forgotPassword: "忘记密码？"
                        },
                        register: {
                            title: "注册",
                            googleButton: "使用Google注册",
                            orDivider: "或",
                            emailLabel: "邮箱",
                            emailPlaceholder: "请输入邮箱",
                            passwordLabel: "密码",
                            passwordPlaceholder: "请输入密码",
                            firstNameLabel: "名字",
                            firstNamePlaceholder: "请输入名字",
                            lastNameLabel: "姓氏",
                            lastNamePlaceholder: "请输入姓氏",
                            registerButton: "注册",
                            loginLink: "登录",
                            loginButton: "立即登录"
                        },
                        errors: {
                            emailRequired: "邮箱必填",
                            emailInvalid: "邮箱格式不正确",
                            passwordRequired: "密码必填",
                            passwordLength: "密码至少6位",
                            firstNameRequired: "名字必填",
                            lastNameRequired: "姓氏必填",
                            loginFailed: "登录失败",
                            registerFailed: "注册失败",
                            googleLoginFailed: "Google登录失败",
                            networkError: "网络错误",
                            userNotFound: "用户不存在",
                            invalidCredentials: "用户名或密码错误",
                            accountDisabled: "账户已禁用"
                        },
                        success: {
                            welcomeBack: "欢迎回来！"
                        }
                    }
                }}
            />

            {/* 🚨 试用已使用警告对话框 */}
            <AlertDialog open={showTrialUsedAlert} onOpenChange={setShowTrialUsedAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{i18nPricing?.trial?.alreadyUsedTitle || "试用已使用"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {i18nPricing?.trial?.alreadyUsedMessage || "您已经使用过3天免费试用，每个用户只能使用一次免费试用。\n您可以选择其他订阅计划继续使用我们的服务。"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowTrialUsedAlert(false)}>
                            {i18nPricing?.trial?.alreadyUsedButton || "我知道了"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 🚨 已有订阅警告对话框 */}
            <AlertDialog open={showSubscriptionAlert} onOpenChange={setShowSubscriptionAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{i18nPricing?.subscription?.duplicateTitle || "不可重复订阅"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {subscriptionInfo.isActive
                                ? (i18nPricing?.subscription?.duplicateActiveMessage || "您当前已有有效的{subscriptionType}订阅，无需重复订阅。")
                                    .replace('{subscriptionType}', getSubscriptionTypeName(subscriptionInfo.subscriptionType, i18nPricing))
                                : (i18nPricing?.subscription?.duplicateCanceledMessage || "您已取消续费，但订阅仍在有效期内（到期时间：{expiryDate}），无法重复订阅。")
                                    .replace('{expiryDate}', formatExpiryDate(subscriptionInfo.expiryDate))
                            }
                            {subscriptionInfo.expiryDate && subscriptionInfo.isActive && (
                                `\n\n${(i18nPricing?.subscription?.expiryTime || "到期时间：{expiryDate}").replace('{expiryDate}', formatExpiryDate(subscriptionInfo.expiryDate))}`
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => setShowSubscriptionAlert(false)}
                            className="bg-deep-green text-cream hover:bg-deep-green/90"
                        >
                            {i18nPricing?.subscription?.duplicateButton || "我知道了"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// 辅助函数：获取订阅类型名称
function getSubscriptionTypeName(subscriptionType?: string, i18nPricing?: Pricing): string {
    const types = i18nPricing?.subscription?.subscriptionTypes;

    switch (subscriptionType) {
        case 'trial':
            return types?.trial || '试用';
        case 'monthly':
            return types?.monthly || '月度';
        case 'quarterly':
            return types?.quarterly || '季度';
        case 'annual':
            return types?.annual || '年度';
        default:
            return types?.unknown || '未知';
    }
}

// 辅助函数：格式化到期日期
function formatExpiryDate(expiryDate?: string): string {
    if (!expiryDate) return '';

    try {
        const date = new Date(expiryDate);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return expiryDate;
    }
}
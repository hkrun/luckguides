'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { findSubscriptionByUserId } from '@/actions/user-order';
import { SubscriptionLocal, ToastLocal } from "@/types/locales/billing";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast"

interface Subscription {
    orderId: string;
    credits: string;
    price: string;
    date: string;
    renewalDate: string;
    // 🆕 新增字段
    subscriptionType: string;
    subscriptionStatus: string;
    trialStart?: string;
    trialEnd?: string;
    isTrialActive?: boolean;
    isActive: boolean; // 🆕 是否为活跃订阅
}

interface ManageSubscriptionDialogProps {
    i18n?: SubscriptionLocal;
    toastLocal: ToastLocal;
    onClose: () => void;
    open: boolean;
    lang?: string; // 添加语言参数
}

export function ManageSubscriptionDialog({ i18n, toastLocal, onClose, open, lang = 'en' }: ManageSubscriptionDialogProps) {
    const router = useRouter();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; orderId: string }>({
        show: false,
        orderId: ''
    });
    const [cancellingOrderId, setCancellingOrderId] = useState<string>('');
    const [isConfirming, setIsConfirming] = useState(false);
    const { toast } = useToast()

    // 🎯 获取订阅类型的显示名称
    const getSubscriptionTypeName = (subscriptionType: string) => {
        const type = subscriptionType || 'monthly';
        return i18n?.subscriptionTypes?.[type as keyof typeof i18n.subscriptionTypes] || type;
    };

    // 🎯 获取价格单位
    const getPricingUnit = (subscriptionType: string) => {
        const type = subscriptionType || 'monthly';
        return i18n?.pricingUnits?.[type as keyof typeof i18n.pricingUnits] || 'month';
    };

    // 🎯 清理价格显示，确保格式正确
    const formatPrice = (price: string | number) => {
        const priceStr = String(price);
        // 移除可能存在的美元符号，然后统一添加
        const cleanPrice = priceStr.replace(/^\$/, '');
        return `$${cleanPrice}`;
    };

    // 🎯 计算正确的续订日期
    const calculateRenewalDate = (subscription: Subscription) => {
        if (subscription.subscriptionType === 'trial' && subscription.trialEnd) {
            return new Date(subscription.trialEnd).toLocaleDateString();
        }
        return new Date(subscription.renewalDate).toLocaleDateString();
    };

    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                const data = await findSubscriptionByUserId();
                // 🎯 只显示最新的一条订阅记录
                const latestSubscription = data && data.length > 0 ? [data[0]] : [];
                setSubscriptions(latestSubscription);
            } catch (error) {
                console.error('Failed to fetch subscription data:', error);
                toast({
                    title: toastLocal.error?.title,
                    description: toastLocal?.error?.cancelSubscription,
                    variant: "destructive",
                    duration: 3000,
                    position: "top-center",
                  })
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            fetchSubscriptions();
        }
    }, [open]);

    const handleCancelClick = (orderId: string) => {
        setCancellingOrderId(orderId);
        setConfirmDialog({ show: true, orderId });
    };

    const handleConfirmCancel = async () => {
        setIsConfirming(true);
        try {
            const subscriptionId = confirmDialog.orderId;
            const response = await fetch('/api/subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ subscriptionId }),
            });

            if (response.status === 200) {
                // 🎯 更新订阅状态而不是移除记录
                setSubscriptions(prev => prev.map(sub =>
                    sub.orderId === confirmDialog.orderId
                        ? { ...sub, isActive: false, subscriptionStatus: 'canceled' }
                        : sub
                ));
                toast({
                    title: toastLocal.success?.title,
                    description: toastLocal.success?.cancelSubscription,
                    duration: 3000,
                    position: "top-center",
                  })
            } else {
                toast({
                    title: toastLocal.error?.title,
                    description: toastLocal.error?.cancelSubscription,
                    variant: "destructive",
                    duration: 3000,
                    position: "top-center",
                  })
            }
        } catch (error) {
            console.error('Failed to cancel subscription:', error);
            toast({
                title: toastLocal.error?.title,
                description: toastLocal.error?.cancelSubscription,
                variant: "destructive",
                duration: 3000,
                position: "top-center",
              })
        } finally {
            setIsConfirming(false);
            setCancellingOrderId('');
            setConfirmDialog({ show: false, orderId: '' });
        }
    };

    const cancelHandle = () => {
        setIsConfirming(false);
        setCancellingOrderId('');
        setConfirmDialog({ show: false, orderId: '' });
    }

    const handleNavigateToBilling = () => {
        onClose(); // 关闭对话框
        // 根据当前语言构建正确的路由
        const billingPath = lang === 'en' ? '/billing' : `/${lang}/billing`;
        router.push(billingPath);
    };

    // 🔧 强制清理 Radix Dialog 残留元素
    const forceCleanup = () => {
        // 延迟执行确保 Radix UI 的清理逻辑先执行
        setTimeout(() => {
            // 清理可能残留的 Dialog 相关元素
            const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
            overlays.forEach(overlay => overlay.remove());

            const contents = document.querySelectorAll('[data-radix-dialog-content]');
            contents.forEach(content => content.remove());

            // 重置可能被修改的 body 样式
            document.body.style.overflow = '';
            document.body.style.pointerEvents = '';
            document.documentElement.style.overflow = '';
            document.documentElement.style.pointerEvents = '';
        }, 100);
    };
    return (
        <>
            <Dialog open={open} onOpenChange={(open) => {
                if (!open) {
                    onClose();
                    forceCleanup();
                }
            }}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                            {i18n?.description}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            {i18n?.clickHint}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="border border-primary-gold/20 dark:border-primary-gold/30 rounded-lg p-6 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {i18n?.title}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {i18n?.clickHint}
                        </p>
                        <Separator className="my-4 bg-primary-gold/20 dark:bg-primary-gold/30" />
                        
                        <div className="grid grid-rows-1 md:grid-cols-1 gap-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center w-full py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-gold border-t-transparent"></div>
                                    <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
                                </div>
                            ) : subscriptions.length > 0 ? (
                                subscriptions.map((subs, index) => (
                                    <div key={index} className="space-y-4 py-4 border-b border-primary-gold/20 dark:border-primary-gold/30 last:border-b-0">
                                        {/* 可点击的订阅信息区域 */}
                                        <div
                                            onClick={handleNavigateToBilling}
                                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-4 -m-4 transition-colors duration-200 group"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-gold transition-colors">
                                                    {getSubscriptionTypeName(subs.subscriptionType)}
                                                </h4>
                                                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary-gold transition-colors" />
                                            </div>
                                            <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <dt className="text-sm text-gray-500 dark:text-gray-400">{i18n?.currentPlan?.billingCycle}</dt>
                                                    <dd className="text-base font-medium text-gray-900 dark:text-white">
                                                        {formatPrice(subs.price)} / {getPricingUnit(subs.subscriptionType)}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm text-gray-500 dark:text-gray-400">{i18n?.currentPlan?.subscriptionStart}</dt>
                                                    <dd className="text-base font-medium text-gray-900 dark:text-white">
                                                        {new Date(subs.date).toLocaleString()}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                        {subs.isActive ? i18n?.currentPlan?.nextRenewal : i18n?.currentPlan?.expiryTime}
                                                    </dt>
                                                    <dd className="text-base font-medium text-gray-900 dark:text-white">
                                                        {calculateRenewalDate(subs)}
                                                    </dd>
                                                </div>

                                                {/* 🎯 为已取消订阅显示状态 */}
                                                {!subs.isActive && (
                                                    <div>
                                                        <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                            {i18n?.currentPlan?.status}
                                                        </dt>
                                                        <dd className="text-base font-medium text-red-600 dark:text-red-400">
                                                            {i18n?.currentPlan?.statusCancelled}
                                                        </dd>
                                                    </div>
                                                )}
                                            </dl>
                                        </div>
                                        {/* 🎯 只为活跃订阅显示取消按钮 */}
                                        <div className="pt-2">
                                            {subs.isActive && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // 阻止事件冒泡
                                                        handleCancelClick(subs.orderId);
                                                    }}
                                                    disabled={cancellingOrderId === subs.orderId}
                                                    className="flex items-center"
                                                >
                                                    {cancellingOrderId === subs.orderId ? (
                                                        <>
                                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                                            {i18n?.currentPlan?.cancelButton}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X className="h-4 w-4 mr-2" />
                                                            {i18n?.currentPlan?.cancelButton}
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex justify-center items-center py-8">
                                    <p className="text-gray-700 dark:text-gray-400">{i18n?.currentPlan?.noSubscriptions}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
    
            {confirmDialog.show && (
                <Dialog open={confirmDialog.show} onOpenChange={(open) => !open && cancelHandle()}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                {i18n?.cancelDialog?.title}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                {i18n?.cancelDialog?.description}
                            </DialogDescription>
                        </DialogHeader>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            {i18n?.cancelDialog?.description}
                        </p>
                        <div className="flex justify-end space-x-4">
                            <Button
                                variant="outline"
                                onClick={cancelHandle}
                                disabled={isConfirming}
                                className="border-primary-gold/20 dark:border-primary-gold/30"
                            >
                                {i18n?.cancelDialog?.cancelButton}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmCancel}
                                disabled={isConfirming}
                                className="flex items-center"
                            >
                                {isConfirming && (
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                )}
                                {i18n?.cancelDialog?.confirmButton}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
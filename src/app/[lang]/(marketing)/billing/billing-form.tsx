'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react";
import { findSubscriptionByUserId, findOrderByUserId } from '@/actions/user-order';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

import { Billing } from "@/types/locales/billing";
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

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

interface Transaction {
  orderId: string;
  credits: string;
  price: string;
  date: string;
  type: string;
  status: string;
  productName?: string; // 🆕 产品名称字段
}

export function BillingForm({ i18n }: { i18n: Billing }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string>('');
  const { toast } = useToast()
  const { data: session, status } = useSession();

  // 🎯 获取订阅类型的显示名称
  const getSubscriptionTypeName = (subscriptionType: string) => {
    const type = subscriptionType || 'monthly';
    return i18n?.subscription?.subscriptionTypes?.[type as keyof typeof i18n.subscription.subscriptionTypes] || type;
  };

  // 🎯 获取价格单位
  const getPricingUnit = (subscriptionType: string) => {
    const type = subscriptionType || 'monthly';
    return i18n?.subscription?.pricingUnits?.[type as keyof typeof i18n.subscription.pricingUnits] || 'month';
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

  // 🎯 获取产品名称显示
  const getProductDisplayName = (transaction: Transaction) => {
    // 🏆 优先使用数据库中的 product_name
    if (transaction.productName) {
      // 如果是英文名称，转换为多语言
      const nameMap: Record<string, string> = {
        'Free Trial': getSubscriptionTypeName('trial'),
        'Monthly Plan': getSubscriptionTypeName('monthly'),
        'Quarterly Plan': getSubscriptionTypeName('quarterly'),
        'Annual Plan': getSubscriptionTypeName('annual'),
        'Monthly Plan (Renewal)': `${getSubscriptionTypeName('monthly')} (${i18n.transaction.renewal || 'Renewal'})`,
        'Quarterly Plan (Renewal)': `${getSubscriptionTypeName('quarterly')} (${i18n.transaction.renewal || 'Renewal'})`,
        'Annual Plan (Renewal)': `${getSubscriptionTypeName('annual')} (${i18n.transaction.renewal || 'Renewal'})`,
      };
      return nameMap[transaction.productName] || transaction.productName;
    }
    
    // 🔄 对于现有记录，根据积分数量推断订阅类型
    if (transaction.type === 'subscription' && transaction.credits) {
      const credits = parseInt(transaction.credits);
      if (credits === 100) {
        return getSubscriptionTypeName('trial');
      } else if (credits === 80) {
        return getSubscriptionTypeName('monthly');
      } else if (credits === 250) {
        return getSubscriptionTypeName('quarterly');
      } else if (credits === 1000) {
        return getSubscriptionTypeName('annual');
      }
    }
    
    // 📦 后备方案：显示积分
    return `${transaction.credits} ${i18n.transaction.unit}`;
  };

  useEffect(() => {
    const loadData = async () => {
      if (status === 'loading') {
        return;
      }

      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const [subsData, transData] = await Promise.all([
          findSubscriptionByUserId(),
          findOrderByUserId()
        ]);

        // 🎯 只显示最新的一条订阅记录
        const latestSubscription = subsData && subsData.length > 0 ? [subsData[0]] : [];
        setSubscriptions(latestSubscription);

        // 🎯 购买记录只显示来自 nf_credits 表的交易记录，避免重复
        // nf_subscription 表的记录主要用于订阅管理，不应在购买记录中重复显示
        const allTransactions = [...(transData || [])]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setTransactions(allTransactions);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: i18n.toast.error.title,
          description: i18n.toast.error.loadData,
          variant: "destructive",
          duration: 3000,
          position: "top-center",
        })
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session?.user, status]);

  const handleCancelSubscription = async (subscriptionId: string) => {
    setCancellingOrderId(subscriptionId);
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });

      if (response.ok) {
        // 🎯 更新订阅状态而不是移除记录
        setSubscriptions(prev => prev.map(sub =>
          sub.orderId === subscriptionId
            ? { ...sub, isActive: false, subscriptionStatus: 'canceled' }
            : sub
        ));
        toast({
          title: i18n.toast.success.title,
          description: i18n.toast.success.cancelSubscription,
          duration: 3000,
          position: "top-center",
        })
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      toast({
        title: i18n.toast.error.title,
        description: i18n.toast.error.cancelSubscription,
        variant: "destructive",
        duration: 3000,
        position: "top-center",
      })
    } finally {
      setCancellingOrderId('');
    }
  };




  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-gold border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Subscriptions Section */}
      <Card className="border-primary-gold/20">
        <CardHeader className='px-4 md:px-6'>
          <CardTitle>{i18n.subscription.title}</CardTitle>
          <CardDescription>{i18n.subscription.description}</CardDescription>
        </CardHeader>
        <div className='px-4 md:px-6'>
          <Separator className='bg-primary-gold/20' />
        </div>

        {subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 px-3 py-6 md:p-6">
            {subscriptions.map((sub, index) => (
              <div key={index} className="border border-primary-gold/20 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    {getSubscriptionTypeName(sub.subscriptionType)}
                  </h3>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-sm">{i18n.subscription.currentPlan.billingCycle}</span>
                      <span className="text-xl font-semibold">{formatPrice(sub.price)} / {getPricingUnit(sub.subscriptionType)}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-sm">{i18n.subscription.currentPlan.subscriptionStart}</span>
                      <span className="text-base">{new Date(sub.date).toLocaleString()}</span>
                    </div>

                    {/* 🎯 根据订阅状态显示不同的续订信息 */}
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-sm">
                        {sub.isActive ? i18n.subscription.currentPlan.nextRenewal : i18n.subscription.currentPlan.expiryTime}
                      </span>
                      <span className="text-base">
                        {calculateRenewalDate(sub)}
                      </span>
                    </div>

                    {/* 🎯 为已取消订阅显示状态 */}
                    {!sub.isActive && (
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-sm">
                          {i18n.subscription.currentPlan.status}
                        </span>
                        <span className="text-base text-red-600 font-medium">
                          {i18n.subscription.currentPlan.statusCancelled}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 🎯 只为活跃订阅显示取消按钮 */}
                {sub.isActive ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full mt-4"
                        disabled={cancellingOrderId === sub.orderId}
                      >
                        {cancellingOrderId === sub.orderId ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        ) : null}
                        {i18n.subscription.currentPlan.cancelButton}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{i18n.subscription.cancelDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {i18n.subscription.cancelDialog.description}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{i18n.subscription.cancelDialog.cancelButton}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancelSubscription(sub.orderId)}
                        >
                          {i18n.subscription.cancelDialog.confirmButton}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <div className="w-full mt-4 p-3 bg-gray-100 rounded-lg text-center text-muted-foreground">
                    {i18n.subscription.currentPlan.statusCancelled}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">{i18n.subscription.currentPlan.noSubscriptions}</p>
          </CardContent>
        )}
      </Card>

      {/* Transactions Section */}
      <Card className="border-primary-gold/20">
        <CardHeader>
          <CardTitle>{i18n.transaction.title}</CardTitle>
          <CardDescription>{i18n.transaction.description}</CardDescription>
        </CardHeader>
        <div className='px-4 md:px-6'>
          <div className="border-t border-primary-gold/20">
            <div className="divide-y divide-primary-gold/20">
              {transactions.length > 0 ? (
                transactions.map((trans, index) => (
                  <div key={index}
                    className="flex flex-wrap items-center gap-y-4 py-6"
                  >
                    {/* Product Name */}
                    <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
                      <dt className="text-sm text-muted-foreground">
                        {i18n.transaction.productName}
                      </dt>
                      <dd className="mt-1.5 font-medium">
                        {getProductDisplayName(trans)}
                      </dd>
                    </dl>

                    {/* Price */}
                    <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
                      <dt className="text-sm text-muted-foreground">
                        {i18n.transaction.price}
                      </dt>
                      <dd className="mt-1.5 font-medium">
                        {formatPrice(trans.price)}
                      </dd>
                    </dl>

                    {/* Date */}
                    <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
                      <dt className="text-sm text-muted-foreground">
                        {i18n.transaction.date}
                      </dt>
                      <dd className="mt-1.5 font-medium">
                        {new Date(trans.date).toLocaleString()}
                      </dd>
                    </dl>

                    {/* Status */}
                    <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
                      <dt className="text-sm text-muted-foreground">
                        {i18n.transaction.status}
                      </dt>
                      <dd className="mt-1.5">
                        <span className={cn(
                          "px-2 py-1 text-sm font-medium rounded-full",
                          trans.status.toLowerCase() === 'completed' && "bg-green-100 text-green-700",
                          trans.status.toLowerCase() === 'failed' && "bg-red-100 text-red-700",
                          trans.status.toLowerCase() === 'pending' && "bg-yellow-100 text-yellow-700"
                        )}>
                          {trans.status}
                        </span>
                      </dd>
                    </dl>
                  </div>
                ))
              ) : (
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">{i18n.transaction.noTransactions}</p>
                </CardContent>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
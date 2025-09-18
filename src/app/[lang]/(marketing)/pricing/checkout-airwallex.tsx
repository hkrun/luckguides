'use client';

import React, { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { findUserCreditsByUserId } from "@/actions/user";
import { type Locale } from '@/i18n-config';
import { AirwallexCheckoutProvider, AirwallexOptions } from '@/components/payment/airwallex-provider'
import { AirwallexCheckout } from '@/components/payment/airwallex-checkout'
import { Product } from '@/types/locales/pricing';
interface CheckoutProps {
  lang: Locale;
  className?: string;
  product: Product;
  currency: string;
  mode: "payment" | "recurring";
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export default function CheckoutForm({ lang, product, currency, mode, className = "" }: CheckoutProps) {

  const { data: session } = useSession();
  // const [isUpdatingCredits, setIsUpdatingCredits] = useState(false); // 已隐藏积分更新提示


  async function handlePaymentSuccess() {
    console.log('支付成功，开始更新积分');
    // setIsUpdatingCredits(true); // 已隐藏积分更新提示

    try {
      // 延迟重试机制，确保 webhook 有时间处理
      const maxRetries = 3;
      const initialDelay = 3000; // 3秒初始延迟
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          console.log(`第 ${i + 1} 次尝试更新积分...`);
          
          // 延迟等待（逐渐增加延迟时间）
          const delay = initialDelay + (i * 2000); // 3s, 5s, 7s
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // 获取最新积分
          const credits = await findUserCreditsByUserId(session?.user?.id, true);
          console.log(`第 ${i + 1} 次获取积分结果:`, credits);

          // 如果积分大于原来的值，说明 webhook 已经处理完成
          if (credits > (session?.user?.credits || 0)) {
            console.log('检测到积分已更新，停止重试');
            await updateCredits();
            // 支付成功后跳转到首页
            window.location.href = `/${lang}`;
            return;
          }
        } catch (error) {
          console.error(`第 ${i + 1} 次尝试失败:`, error);
        }
        
        // 最后一次尝试
        if (i === maxRetries - 1) {
          console.log('达到最大重试次数，执行最终更新');
          await updateCredits();
          // 支付成功后跳转到首页
          window.location.href = `/${lang}`;
        }
      }
    } finally {
      // setIsUpdatingCredits(false); // 已隐藏积分更新提示
    }
  }



  const fetchClientSecret = useCallback(() => {
    if (!session?.user?.email) {
      console.error('用户邮箱不存在');
      return Promise.reject(new Error('用户邮箱不存在'));
    }

    const url = `${appUrl}/${lang}/pricing`
    if(product){
      product.url = url;
    }
    // Create a Payment Intent
    return fetch("/api/airwallex", {
      method: "POST",
      body: JSON.stringify({
        first_name: session?.user?.firstName || session?.user?.name?.split(' ')[0] || '',
        last_name: session?.user?.lastName || session?.user?.name?.split(' ')[1] || '',
        email: session?.user?.email,
        product: product,
        currency: currency
      }),
    })
      .then((res) => res.json())
      .then((data) => ({
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId
      }));
  }, [session, product, currency, lang]);

  const options:AirwallexOptions = {
    fetchClientSecret,
    intent: {
      env: "demo",
      mode: mode,
    },
    customer: {
      customerId: session?.user?.id,
      email: session?.user?.email,
      name: session?.user?.name || `${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim()
    },
    order: {
      currency: currency,
    },
    onComplete: handlePaymentSuccess,
  };

  async function updateCredits() {
    const credits = await findUserCreditsByUserId(session?.user?.id, true); // 强制刷新
    console.log('支付成功后获取到的积分:', credits);

    // 触发全局状态刷新
    window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits } }));
  }



  return (
    <>
    <AirwallexCheckoutProvider options={options}>
      <AirwallexCheckout className={`p-4 w-full h-full overflow-auto max-h-[90vh] ${className}`} />
    </AirwallexCheckoutProvider>
      
      {/* 积分更新状态提示 - 已隐藏 */}
      {/* {isUpdatingCredits && (
        <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
          <span className="text-sm">正在更新积分...</span>
        </div>
      )} */}
    </>
  );
}
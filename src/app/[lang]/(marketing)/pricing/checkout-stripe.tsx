import React, { useCallback, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useSession } from 'next-auth/react';
import { findUserCreditsByUserId } from "@/actions/user";

import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';


interface CheckoutProps{
  priceId:string;
  mode:string;
  className?: string;
  locale?: string;
  paymentTexts?: any;
  // 🆕 试用标识
  isFreeTrial?: boolean;
}
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutForm({priceId,mode,className,locale = 'en',paymentTexts, isFreeTrial = false}:CheckoutProps) {

  const { data: session } = useSession();
  const [isReady, setIsReady] = useState(false);
  // const [isUpdatingCredits, setIsUpdatingCredits] = useState(false); // 已隐藏积分更新提示
  const [currentCredits, setCurrentCredits] = useState<number>(0);

  // 等待用户认证状态完全加载
  useEffect(() => {
    if (session?.user?.id && session?.user?.email) {
      // 用户认证状态已就绪
      setIsReady(true);
      // 初始加载积分
      loadCredits();
    } else {
      // 等待用户认证状态加载
      setIsReady(false);
    }
  }, [session]);

  const loadCredits = async () => {
    if (session?.user?.id) {
      const credits = await findUserCreditsByUserId(session.user.id, true);
      setCurrentCredits(credits);
    }
  };

  async function handlePaymentSuccess(){
    // 支付成功，开始更新积分
    // setIsUpdatingCredits(true); // 已隐藏积分更新提示
    
    try {
      // 延迟重试机制，确保 webhook 有时间处理
      const maxRetries = 3;
      const initialDelay = 3000; // 3秒初始延迟
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          // 尝试更新积分
          
          // 延迟等待（逐渐增加延迟时间）
          const delay = initialDelay + (i * 2000); // 3s, 5s, 7s
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // 获取最新积分
          const credits = await findUserCreditsByUserId(session?.user?.id, true);
          // 获取积分结果
          
          // 如果积分大于原来的值，说明 webhook 已经处理完成
          if (credits > currentCredits) {
            // 检测到积分已更新，停止重试
            await updateCredits();
            // 支付成功后跳转到首页换脸区域
            window.location.href = `/${locale}#workflow`;
            return;
          }
        } catch (error) {
          console.error(`积分更新失败 (${i + 1}/${maxRetries}):`, error);
        }
        
        // 最后一次尝试
        if (i === maxRetries - 1) {
          // 达到最大重试次数，执行最终更新
          await updateCredits();
          // 支付成功后跳转到首页换脸区域
          window.location.href = `/${locale}#workflow`;
        }
      }
    } finally {
      // setIsUpdatingCredits(false); // 已隐藏积分更新提示
    }
  }



  const fetchClientSecret = useCallback(() => {
    
    if (!session?.user?.id) {
      console.error('用户ID不存在，请先登录');
      return Promise.reject(new Error('用户ID不存在，请先登录'));
    }
    
    if (!session?.user?.email) {
      console.error('用户邮箱不存在');
      return Promise.reject(new Error('用户邮箱不存在'));
    }
    
    // 开始创建 Stripe 结账会话
    // Create a Checkout Session
    return fetch("/api/stripe", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: priceId,
        userId: session.user.id,
        // 🎯 试用逻辑：试用为type="3"，其他按原逻辑
        type: isFreeTrial ? "3" : (mode === "payment" ? "1" : "2"),
        customerEmail: session.user.email,
        locale: locale,
        language: locale // 添加language字段支持多语言
      }),
    })
      .then((res) => {
        // Stripe API 响应状态检查
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Stripe API 响应数据处理
        if (data.error) {
          throw new Error(data.error);
        }
        return data.clientSecret;
      })
      .catch((error) => {
        console.error('创建 Stripe 会话失败:', error);
        throw error;
      });
  }, [session?.user?.id, session?.user?.email, priceId, mode, locale, isReady]);

  const options = {
    fetchClientSecret,
    onComplete: handlePaymentSuccess
  };

  async function updateCredits() {
    const credits = await findUserCreditsByUserId(session?.user?.id, true); // 强制刷新
    // 支付成功后获取到的积分
    setCurrentCredits(credits);
    
    // 触发全局状态刷新
    window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits } }));
  }

  // 如果用户认证状态未就绪，显示加载状态
  if (!isReady) {
    return (
      <div className="w-full h-[600px] md:h-full md:min-w-[992px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{paymentTexts?.loading?.title || '正在加载支付信息...'}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {paymentTexts?.loading?.userId || '用户ID'}: {session?.user?.id || (paymentTexts?.loading?.loadingText || '加载中...')}
          </p>
          <p className="text-sm text-muted-foreground">
            {paymentTexts?.loading?.email || '邮箱'}: {session?.user?.email || (paymentTexts?.loading?.loadingText || '加载中...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={options}
    >
      <EmbeddedCheckout className={`w-full h-[600px] md:h-full md:min-w-[992px] overflow-auto`}/>
    </EmbeddedCheckoutProvider>
      
      {/* 积分更新状态提示 - 已隐藏 */}
      {/* {isUpdatingCredits && (
        <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
          <span className="text-sm">{paymentTexts?.updating?.title || '正在更新积分...'}</span>
        </div>
      )} */}
    </>
  )
}
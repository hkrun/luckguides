'use client';

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { useAirwallex } from './airwallex-provider';


interface AirwallexCheckoutProps {
    className?: string;
}

export function AirwallexCheckout({ className }: AirwallexCheckoutProps) {
    const { options } = useAirwallex();

    useEffect(() => {
        const mount = async () => {
            try {
                const { createElement } = await import('@airwallex/components-sdk');
                const { clientSecret, paymentIntentId } = await options.fetchClientSecret();
                
                // 创建自定义样式，使邮箱字段只读
                const customStyle = {
                    popupWidth: 400,
                    popupHeight: 550,
                    // 添加自定义CSS，将邮箱输入框设置为只读
                    custom: {
                        'input[type="email"]': {
                            backgroundColor: '#f3f4f6',
                            cursor: 'not-allowed',
                            opacity: '0.7'
                        }
                    }
                };
                
                const dropIn = await createElement('dropIn', {
                    intent_id: paymentIntentId,
                    client_secret: clientSecret,
                    customer_id: options.customer?.customerId,
                    currency: options.order?.currency || 'USD',
                    mode: options.intent?.mode,
                    requiredBillingContactFields: options.intent?.requiredBillingContactFields,
                    style: customStyle,
                    // 添加预填充信息
                    defaultBillingInfo: {
                        email: options.customer?.email || '',
                        name: options.customer?.name || '',
                    },
                    // 设置事件监听器，确保邮箱字段保持只读状态
                    onReady: () => {
                        // 使用DOM操作设置邮箱字段为只读
                        setTimeout(() => {
                            const emailInputs = document.querySelectorAll('input[type="email"]');
                            emailInputs.forEach(input => {
                                if (input instanceof HTMLInputElement) {
                                    input.readOnly = true;
                                    input.setAttribute('title', '邮箱字段不可修改，确保支付与您的账户关联');
                                }
                            });
                        }, 500);
                    }
                });
                
                dropIn.mount('airwallex-payment-container');
            } catch (error) {
                console.error('Error mounting Airwallex:', error);
                if (options.onError) {
                    options.onError(error);
                }
            }
        };

        mount();

        return () => {
            // 清理工作
        };
    }, [options]);

    return (
        <Card className={`${className || ''}`}>
            <div
                id="airwallex-payment-container"
                className="h-full w-full min-h-[300px]"
            />
        </Card>
    );
}
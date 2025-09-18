import { NextResponse } from 'next/server';
import { updateSubscriptionByOrderId } from "@/actions/user-order";

export async function POST(request: Request) {
    try {
        const { subscriptionId } = await request.json();
        
        if (!subscriptionId) {
            return NextResponse.json(
                { error: 'Subscription ID is required', code: 'MISSING_SUBSCRIPTION_ID' },
                { status: 400 }
            );
        }

        console.log(`API: 开始处理订阅取消请求: ${subscriptionId}`);
        const result = await updateSubscriptionByOrderId(subscriptionId);
        
        if (result) {
            console.log(`API: 订阅取消成功: ${subscriptionId}`);
            return NextResponse.json({ 
                result: true,
                message: 'Subscription cancelled successfully',
                subscriptionId: subscriptionId
            }, { status: 200 });
        } else {
            console.warn(`API: 订阅取消失败，数据库中可能不存在此订阅: ${subscriptionId}`);
            return NextResponse.json(
                { 
                    error: 'Subscription not found or already cancelled', 
                    code: 'SUBSCRIPTION_NOT_FOUND',
                    subscriptionId: subscriptionId
                },
                { status: 404 }
            );
        }
    } catch (error: any) {
        console.error("API: 取消订阅时出现错误", error);
        
        // 🎯 根据错误类型提供更具体的错误信息
        let errorMessage = 'Failed to cancel subscription';
        let errorCode = 'UNKNOWN_ERROR';
        
        if (error.type === 'StripeInvalidRequestError') {
            if (error.code === 'resource_missing') {
                errorMessage = 'Subscription not found in payment system, but local status updated';
                errorCode = 'STRIPE_SUBSCRIPTION_NOT_FOUND';
            }
        }
        
        return NextResponse.json(
            { 
                error: errorMessage,
                code: errorCode,
                details: error.message
            },
            { status: 500 }
        );
    }
}
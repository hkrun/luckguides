'use server'
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/postgres-client';
import { UserOrder, UserSubscription, TrialCheckResult } from '@/types/order';
import { cancelSubscriptionById } from "@/actions/stripe-billing";

export async function findOrderByUserId(): Promise<UserOrder[]> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return [];
        }

        const { rows } = await sql`
            SELECT 
                order_number,
                credit_amount,
                order_price,
                order_date,
                credit_type,
                created_at,
                product_name
            FROM nf_credits where credit_type in ('1','2','3') and user_id = ${user.userId}`;

        return rows.map(row => ({
            orderId: row.order_number,
            credits: row.credit_amount,
            price: row.order_price,
            date: row.order_date || row.created_at,
            type: row.credit_type === '1' ? 'subscription' :
                row.credit_type === '2' ? 'one-time' : '',
            status: row.credit_type === '1' || row.credit_type === '2' ? 'completed' :
                row.credit_type === '3' ? 'refunded' : '',
            productName: row.product_name // 🆕 包含产品名称
        }));

    } catch (error) {
        console.error('Failed to get user orders:', error);
        return [];
    }
}

export async function findSubscriptionByUserId(): Promise<UserSubscription[]> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return [];
        }

        const { rows } = await sql`
        SELECT 
            subscription_id,
            credit_amount,
            order_price,
            order_date,
            subscription_type,
            subscription_status,
            trial_start,
            trial_end,
            order_type
        FROM nf_subscription 
        WHERE user_id = ${user.userId} 
        ORDER BY order_date DESC`;

        return rows.map(row => {
            // 🎯 根据 order_type 确定真实的订阅状态
            const isActive = row.order_type === '1';
            const actualStatus = isActive ? (row.subscription_status || 'active') : 'canceled';

            // 📅 计算续订/到期时间
            let renewalDate = '';
            const orderDate = new Date(row.order_date);
            const today = new Date();
            const daysSinceOrder = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

            // 根据订阅类型判断续订周期
            let periodDays = 30; // 默认月度
            if (row.subscription_type === 'trial') {
                periodDays = 3; // 试用期3天
            } else if (row.subscription_type === 'quarterly') {
                periodDays = 90; // 季度
            } else if (row.subscription_type === 'annual') {
                periodDays = 365; // 年度
            }

            if (isActive) {
                // 活跃订阅：计算下次续订时间
                const periodsElapsed = Math.floor(daysSinceOrder / periodDays);
                const nextRenewalDate = new Date(orderDate);
                nextRenewalDate.setDate(orderDate.getDate() + ((periodsElapsed + 1) * periodDays));
                renewalDate = nextRenewalDate.toISOString();
            } else {
                // 已取消订阅：计算当前周期的到期时间
                const periodsElapsed = Math.floor(daysSinceOrder / periodDays);
                const currentPeriodEndDate = new Date(orderDate);
                currentPeriodEndDate.setDate(orderDate.getDate() + ((periodsElapsed + 1) * periodDays));
                renewalDate = currentPeriodEndDate.toISOString();
            }

            return {
                orderId: row.subscription_id,
                credits: row.credit_amount,
                price: row.order_price,
                date: row.order_date,
                renewalDate: renewalDate,
                // 🆕 订阅状态字段
                subscriptionType: row.subscription_type || 'monthly',
                subscriptionStatus: actualStatus,
                trialStart: row.trial_start,
                trialEnd: row.trial_end,
                isTrialActive: row.subscription_type === 'trial' && actualStatus === 'trialing' && 
                              row.trial_end && new Date(row.trial_end) > new Date(),
                // 🆕 新增字段：是否为活跃订阅
                isActive: isActive
            };
        });

    } catch (error) {
        console.error('Failed to get user subscriptions:', error);
        return [];
    }
}

// 获取所有订阅记录用于购买记录显示
export async function findAllSubscriptionsByUserId(): Promise<UserOrder[]> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return [];
        }

        const { rows } = await sql`
        SELECT
            subscription_id,
            credit_amount,
            order_price,
            order_date,
            order_type
        FROM nf_subscription where user_id = ${user.userId} ORDER BY order_date DESC`;

        return rows.map(row => ({
            orderId: row.subscription_id,
            credits: row.credit_amount,
            price: row.order_price,
            date: row.order_date,
            type: 'subscription',
            status: row.order_type === '1' ? 'completed' : 'cancelled'
        }));

    } catch (error) {
        console.error('Failed to get all user subscriptions:', error);
        return [];
    }
}

export async function updateSubscriptionByOrderId(subscriptionId: string) {
    console.log(`=== 开始取消订阅: ${subscriptionId} ===`);
    
    try {
        // 🎯 步骤1：尝试取消Stripe订阅
        console.log('步骤1：尝试取消Stripe订阅');
        const stripeResult = await cancelSubscriptionById(subscriptionId);
        console.log('Stripe取消结果:', stripeResult);
        
        // 🎯 步骤2：无论Stripe操作成功与否，都更新本地数据库状态
        console.log('步骤2：更新本地数据库订阅状态');
        const { updateSubscription } = await import('@/actions/credits');
        const dbResult = await updateSubscription(subscriptionId);
        console.log('数据库更新结果:', dbResult);
        
        // 🎯 只要本地数据库更新成功，就认为取消成功
        const success = dbResult > 0;
        console.log(`=== 订阅取消完成: ${subscriptionId}, 成功: ${success} ===`);
        
        return success;
        
    } catch (error) {
        console.error(`取消订阅失败: ${subscriptionId}`, error);
        
        // 🎯 即使出错，也尝试更新本地数据库状态
        try {
            console.log('出错时尝试更新本地数据库状态');
            const { updateSubscription } = await import('@/actions/credits');
            const dbResult = await updateSubscription(subscriptionId);
            console.log('错误处理中的数据库更新结果:', dbResult);
            
            // 如果本地数据库更新成功，仍然可以认为"取消成功"
            return dbResult > 0;
        } catch (dbError) {
            console.error('本地数据库更新也失败:', dbError);
            return false;
        }
    }
}

export async function getSubscriptionByUserId(userId: string) {
    try {
        const { rows } = await sql`
            SELECT 
                subscription_id,
                order_type
            FROM nf_subscription 
            WHERE user_id = ${userId} 
            ORDER BY order_date DESC 
            LIMIT 1`;

        if (rows.length > 0) {
            return rows[0];
        }
        return null;
    } catch (error) {
        console.error('Failed to get user subscription by userId:', error);
        return null;
    }
}

// 兼容性函数（将会被弃用）
export async function getSubscriptionByClerkId(clerkId: string) {
    console.warn('getSubscriptionByClerkId is deprecated, use getSubscriptionByUserId instead');
    return getSubscriptionByUserId(clerkId);
}

// 检查当前用户是否有有效订阅
export async function checkUserSubscription(): Promise<boolean> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return false;
        }

        const { rows } = await sql`
            SELECT COUNT(*) as count
            FROM nf_subscription 
            WHERE user_id = ${user.userId} AND order_type = '1'
        `;
        
        return rows[0]?.count > 0;
    } catch (error) {
        console.error('Failed to check user subscription:', error);
        return false;
    }
}

// 🆕 检查用户是否已经使用过免费试用（任何版本）
export async function hasUsedFreeTrial(): Promise<boolean> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return false;
        }

        // 检查用户是否使用过任何版本的试用（基础版、专业版、商业版）
        const { rows } = await sql`
            SELECT subscription_id, plan_type
            FROM nf_subscription
            WHERE subscription_type = 'trial'
              AND user_id = ${user.userId}
              AND plan_type IN ('basic', 'professional', 'business')
            LIMIT 1
        `;

        return rows.length > 0; // 有记录表示已使用过试用
    } catch (error) {
        console.error('Error checking free trial usage:', error);
        return false;
    }
}

// 🆕 获取用户试用状态详情
export async function getTrialStatus(): Promise<TrialCheckResult> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { hasUsedTrial: false, currentTrialStatus: 'none' };
        }

        // 查询用户的试用记录（任何版本）
        const { rows } = await sql`
            SELECT
                subscription_id,
                subscription_status,
                trial_start,
                trial_end,
                created_at,
                plan_type
            FROM nf_subscription
            WHERE subscription_type = 'trial'
              AND user_id = ${user.userId}
              AND plan_type IN ('basic', 'professional', 'business')
            ORDER BY created_at DESC
            LIMIT 1
        `;

        if (rows.length === 0) {
            return { hasUsedTrial: false, currentTrialStatus: 'none' };
        }

        const trial = rows[0];
        const now = new Date();
        const trialEnd = trial.trial_end ? new Date(trial.trial_end) : null;

        let currentTrialStatus: 'trialing' | 'expired' | 'none' = 'none';
        
        if (trial.subscription_status === 'trialing' && trialEnd && trialEnd > now) {
            currentTrialStatus = 'trialing';
        } else if (trialEnd && trialEnd <= now) {
            currentTrialStatus = 'expired';
        }

        return {
            hasUsedTrial: true,
            currentTrialStatus,
            trialEndDate: trial.trial_end,
            planType: trial.plan_type, // 🆕 返回试用的计划类型
        };
    } catch (error) {
        console.error('Error getting trial status:', error);
        return { hasUsedTrial: false, currentTrialStatus: 'none' };
    }
}

// 🆕 检查用户是否有活跃的试用订阅（任何版本）
export async function hasActiveFreeTrial(): Promise<boolean> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return false;
        }

        const { rows } = await sql`
            SELECT subscription_id
            FROM nf_subscription
            WHERE subscription_type = 'trial'
              AND subscription_status = 'trialing'
              AND user_id = ${user.userId}
              AND trial_end > NOW()
              AND plan_type IN ('basic', 'professional', 'business')
            LIMIT 1
        `;

        return rows.length > 0;
    } catch (error) {
        console.error('Error checking active free trial:', error);
        return false;
    }
}

// 🆕 检查用户是否有任何有效的订阅（包括已取消但未到期的）
export async function hasValidSubscription(): Promise<{
    hasValidSubscription: boolean;
    subscriptionType?: string;
    status?: string;
    expiryDate?: string;
    isActive?: boolean;
    planType?: 'basic' | 'premium' | 'professional' | 'business';
    planPrice?: number;
}> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { hasValidSubscription: false };
        }

        const { rows } = await sql`
            SELECT
                subscription_type,
                subscription_status,
                order_type,
                order_date,
                trial_end,
                plan_type,
                order_price
            FROM nf_subscription
            WHERE user_id = ${user.userId}
            ORDER BY order_date DESC
            LIMIT 1
        `;

        if (rows.length === 0) {
            return { hasValidSubscription: false };
        }

        const subscription = rows[0];
        const isActive = subscription.order_type === '1';
        const now = new Date();

        // 计算到期时间
        let expiryDate = '';
        let isWithinValidPeriod = false;

        if (subscription.subscription_type === 'trial') {
            // 试用期使用 trial_end
            if (subscription.trial_end) {
                expiryDate = subscription.trial_end;
                const expiryDateTime = new Date(expiryDate);
                isWithinValidPeriod = expiryDateTime > now;
            }
        } else {
            // 付费订阅计算周期
            const orderDate = new Date(subscription.order_date);
            let periodDays = 30; // 默认月度

            if (subscription.subscription_type === 'quarterly') {
                periodDays = 90;
            } else if (subscription.subscription_type === 'annual') {
                periodDays = 365;
            }

            const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
            const periodsElapsed = Math.floor(daysSinceOrder / periodDays);
            const currentPeriodEndDate = new Date(orderDate);
            currentPeriodEndDate.setDate(orderDate.getDate() + ((periodsElapsed + 1) * periodDays));
            expiryDate = currentPeriodEndDate.toISOString();

            const expiryDateTime = new Date(expiryDate);
            isWithinValidPeriod = expiryDateTime > now;
        }

        // 只有活跃订阅才认为是有效订阅，已取消的订阅即使仍在有效期内也不阻止重新订阅
        const hasValidSubscription = isActive;

        // 规范化当前档位（兼容未知/旧值），必要时用价格映射
        let normalizedPlan: 'basic' | 'premium' | 'professional' | 'business' | undefined = subscription.plan_type;
        const priceNumeric = parseFloat(subscription.order_price?.toString() || '0');
        if (!normalizedPlan || !['basic','premium','professional','business'].includes(normalizedPlan)) {
            if (priceNumeric === 9.99) normalizedPlan = 'basic';
            else if (priceNumeric === 19.99) normalizedPlan = 'premium';
            else if (priceNumeric === 29.99) normalizedPlan = 'professional';
            else if (priceNumeric === 49.99) normalizedPlan = 'business';
        }

        return {
            hasValidSubscription,
            subscriptionType: subscription.subscription_type,
            status: isActive ? subscription.subscription_status : 'canceled',
            expiryDate,
            isActive,
            planType: normalizedPlan,
            planPrice: priceNumeric
        };
    } catch (error) {
        console.error('Error checking valid subscription:', error);
        return { hasValidSubscription: false };
    }
}

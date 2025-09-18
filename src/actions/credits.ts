'use server';
import { sql, db } from '@/lib/postgres-client';
import { getKey, setKeyWithExpiry } from '@/lib/redis-client';
import { cache } from 'react'
import { getCurrentUser } from '@/lib/auth';
import { findUserCreditsByUserId } from '@/actions/user';
import { IUserCredit } from '@/types/user-credit';

const expirySeconds = 60 * 60 * 1; // 1 hour
const prefix = 'credit_';

export async function findUserCreditByUserId(id: string) {
    const { rowCount } = await sql`SELECT * FROM nf_credits WHERE user_id = ${id}`;
    return rowCount;
}

export const addUserCredit = cache(async (data: IUserCredit): Promise<number> => {
    try {
        const result = await sql`INSERT INTO nf_credits 
            (user_id, order_number, order_price, credit_amount, credit_type, credit_transaction_type, credit_desc, order_date, product_name) 
            VALUES (
                ${data.user_id},
                ${data.order_number},
                ${data.order_price},
                ${data.credit_amount},
                ${data.credit_type},
                ${data.credit_transaction_type},
                ${data.credit_desc},
                ${data.order_date},
                ${data.product_name || ''}
            )`;
        const rowCount = result.rowCount;
        return rowCount !== null && rowCount !== undefined ? rowCount : 0;
    } catch (error) {
        console.error('Error adding user credit:', error);
        return 0;
    }
});

export async function updateUserCredits(userId: string, newCredits: number): Promise<boolean> {
    try {
        const { rowCount } = await sql`UPDATE nf_users SET credits = ${newCredits} WHERE user_id = ${userId}`;
        
        // 清除缓存
        const key = prefix + userId;
        await setKeyWithExpiry(key, String(newCredits), expirySeconds);
        
        return rowCount !== null && rowCount !== undefined && rowCount > 0;
        // return rowCount > 0;
    } catch (error) {
        console.error('Error updating user credits:', error);
        return false;
    }
}

export async function deductUserCredits(userId: string, amount: number, description: string): Promise<boolean> {
    try {
        // 获取当前积分
        const currentCredits = await findUserCreditsByUserId(userId);
        
        if (currentCredits < amount) {
            return false; // 积分不足
        }
        
        // 扣减积分
        const newCredits = currentCredits - amount;
        const updateSuccess = await updateUserCredits(userId, newCredits);
        
        if (updateSuccess) {
            // 记录积分扣减
            await addUserCredit({
                user_id: userId,
                order_number: `deduct_${userId}_${Date.now()}`,
                order_price: 0,
                credit_amount: amount,
                credit_type: '4', // 扣减积分
                credit_transaction_type: '0', // 消费积分
                credit_desc: description,
                order_date: new Date().toISOString(),
                product_name: '积分消费'
            });
        }
        
        return updateSuccess;
    } catch (error) {
        console.error('Error deducting user credits:', error);
        return false;
    }
}

export async function countMemberCreditsByUserId(userId?: string): Promise<number> {
    try {
        let targetUserId = userId;
        
        if (!targetUserId) {
            const user = await getCurrentUser();
            if (!user) return 0;
            targetUserId = user.userId;
        }
        
        const { rows } = await sql`
            SELECT SUM(credit_amount) as total_credits 
            FROM nf_credits 
            WHERE user_id = ${targetUserId} 
            AND credit_type = '1' 
            AND credit_transaction_type = '1'
        `;
        
        return parseInt(rows[0]?.total_credits || '0');
    } catch (error) {
        console.error('Error counting member credits:', error);
        return 0;
    }
}

// 兼容性函数（将会被弃用）
export async function findUserCreditByClerkId(id: string) {
    console.warn('findUserCreditByClerkId is deprecated, use findUserCreditByUserId instead');
    return findUserCreditByUserId(id);
}

export async function countMemberCreditsByClerkId(clerkId?: string): Promise<number> {
    console.warn('countMemberCreditsByClerkId is deprecated, use countMemberCreditsByUserId instead');
    return countMemberCreditsByUserId(clerkId);
}

// 兼容性函数（将会被弃用）
export async function findUserClerkIdByOrderNumber(order_number: string) {
    console.warn('findUserClerkIdByOrderNumber is deprecated');
    const { rows } = await sql`SELECT user_id FROM nf_credits WHERE order_number = ${order_number}`;
    return rows[0]?.user_id;
}

export async function addSubscription(data: IUserCredit, priceId?: string) {
    try {
        const { rows } = await sql`
        SELECT subscription_id FROM nf_subscription
        WHERE subscription_id = ${data.subscriptionId}`;

        if (rows.length > 0) {
            return 0;
        }

        // 根据价格和描述确定计划类型（新档位：basic 9.99 / premium 19.99 / professional 29.99 / business 49.99）
        let planType = 'basic'; // 默认值
        const price = parseFloat(data.order_price?.toString() || '0');
        const desc = (data.credit_desc || '').toLowerCase();

        if (price === 49.99 || desc.includes('business') || desc.includes('商业版')) {
            planType = 'business';
        } else if (price === 29.99 || desc.includes('professional') || desc.includes('专业版')) {
            planType = 'professional';
        } else if (price === 19.99 || desc.includes('premium') || desc.includes('高级版')) {
            planType = 'premium';
        } else if (price === 9.99 || desc.includes('basic') || desc.includes('基础版')) {
            planType = 'basic';
        }

        // 🎯 根据价格ID判断订阅类型（月度/年度）
        let subscriptionType = 'monthly'; // 默认月度
        
        // 年度订阅的价格ID列表
        const annualPriceIds = [
            'price_1S7YYKDx3cvsYDBQyTkiM3vL', // 基础版年度
            'price_1S7YYfDx3cvsYDBQQLkCNcTv', // 高级版年度
            'price_1S7YYtDx3cvsYDBQWIHn7l8k', // 专业版年度
            'price_1S7YZGDx3cvsYDBQpy1DfL9S'  // 商业版年度
        ];
        
        if (priceId && annualPriceIds.includes(priceId)) {
            subscriptionType = 'annual';
        }

        console.log(`设置订阅计划类型: ${planType}, 订阅类型: ${subscriptionType} (价格: ${price}, 描述: ${data.credit_desc}, 价格ID: ${priceId})`);

        const { rowCount } = await sql`INSERT INTO nf_subscription
        (user_id,order_number,subscription_id,order_price,credit_amount,order_type,order_desc,order_date,subscription_type,subscription_status,plan_type)
        VALUES (
            ${data.user_id},
            ${data.order_number},
            ${data.subscriptionId},
            ${data.order_price},
            ${data.credit_amount},
            '1',
            ${data.credit_desc},
            ${data.order_date},
            ${subscriptionType}, -- 🎯 根据价格ID设置正确的订阅类型
            'active',   -- 🎯 明确设置为 active
            ${planType} -- 🎯 设置正确的计划类型
        )`;
        return rowCount || 0;
    } catch (error) {
        console.error('Error adding subscription:', error);
    }
    return 0;
}

// 🆕 添加试用订阅记录
export async function addTrialSubscription(data: IUserCredit, subscriptionId: string, priceId?: string) {
    try {
        // 检查是否已经存在该订阅
        const { rows } = await sql`
        SELECT subscription_id FROM nf_subscription 
        WHERE subscription_id = ${subscriptionId}`;

        if (rows.length > 0) {
            console.log('试用订阅已存在，跳过创建');
            return 0;
        }

        // 根据价格和描述确定计划类型（支持所有版本的试用）
        let planType = 'basic'; // 默认值
        const price = parseFloat(data.order_price?.toString() || '0');
        const desc = (data.credit_desc || '').toLowerCase();

        if (price === 49.99 || desc.includes('business') || desc.includes('商业版')) {
            planType = 'business';
        } else if (price === 29.99 || desc.includes('professional') || desc.includes('专业版')) {
            planType = 'professional';
        } else if (price === 19.99 || desc.includes('premium') || desc.includes('高级版')) {
            planType = 'premium';
        } else if (price === 9.99 || desc.includes('basic') || desc.includes('基础版')) {
            planType = 'basic';
        }

        // 🎯 根据价格ID判断试用订阅类型（月度/年度）
        let subscriptionType = 'trial'; // 默认试用类型
        
        // 年度订阅的价格ID列表
        const annualPriceIds = [
            'price_1S7YYKDx3cvsYDBQyTkiM3vL', // 基础版年度
            'price_1S7YYfDx3cvsYDBQQLkCNcTv', // 高级版年度
            'price_1S7YYtDx3cvsYDBQWIHn7l8k', // 专业版年度
            'price_1S7YZGDx3cvsYDBQpy1DfL9S'  // 商业版年度
        ];
        
        if (priceId && annualPriceIds.includes(priceId)) {
            subscriptionType = 'annual'; // 年度试用订阅
        }

        console.log(`设置试用订阅计划类型: ${planType}, 订阅类型: ${subscriptionType} (价格: ${price}, 描述: ${data.credit_desc}, 价格ID: ${priceId})`);

        // 计算试用期开始和结束时间
        const now = new Date();
        const trialStart = now.toISOString();
        const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3天后

        const { rowCount } = await sql`INSERT INTO nf_subscription
        (user_id, order_number, subscription_id, order_price, credit_amount, order_type, order_desc, order_date,
         subscription_type, subscription_status, trial_start, trial_end, plan_type)
        VALUES (
            ${data.user_id},
            ${data.order_number},
            ${subscriptionId},
            ${data.order_price},
            ${data.credit_amount},
            '1', -- 活跃订阅
            ${data.credit_desc},
            ${data.order_date},
            ${subscriptionType}, -- 🎯 根据价格ID设置正确的订阅类型（annual 或 trial）
            'trialing', -- 🎯 试用中状态
            ${trialStart}, -- 🎯 试用开始时间
            ${trialEnd}, -- 🎯 试用结束时间
            ${planType} -- 🎯 支持所有版本的试用
        )`;
        
        console.log(`✅ 试用订阅记录创建成功: ${subscriptionId}, 试用期: ${trialStart} 至 ${trialEnd}`);
        return rowCount || 0;
    } catch (error) {
        console.error('Error adding trial subscription:', error);
        throw error;
    }
}

export async function deleteUserCreditByUserId(userId: string) {
    const { rowCount } = await sql`DELETE FROM nf_credits WHERE user_id = ${userId}`;
    return rowCount || 0;
}

export async function addUserCreditBalance(credit: number, userId: string) {
    try {
        const success = await updateUserCredits(userId, await findUserCreditsByUserId(userId) + credit);
        if (success) {
            // 记录积分增加
            await addUserCredit({
                user_id: userId,
                order_number: `add_${userId}_${Date.now()}`,
                order_price: 0,
                credit_amount: credit,
                credit_type: '5', // 系统添加积分
                credit_transaction_type: '1', // 获得积分
                credit_desc: '系统添加积分',
                order_date: new Date().toISOString(),
                product_name: '积分充值'
            });
        }
        return success ? 1 : 0;
    } catch (error) {
        console.error('Error adding user credit balance:', error);
        return 0;
    }
}

/**
 * 只更新用户积分余额，不添加积分记录
 * 用于已经有积分记录的场景，避免重复记录
 */
export async function updateUserCreditsOnly(credit: number, userId: string) {
    try {
        const currentCredits = await findUserCreditsByUserId(userId);
        const success = await updateUserCredits(userId, currentCredits + credit);
        console.log(`✅ 用户 ${userId} 积分余额更新：${currentCredits} + ${credit} = ${currentCredits + credit}`);
        return success ? 1 : 0;
    } catch (error) {
        console.error('Error updating user credits only:', error);
        return 0;
    }
}



/**
 * 🔄 添加续费订阅记录
 * 专门处理续费场景，即使 subscription_id 相同也会添加新记录
 */
export async function addRenewalSubscription(data: IUserCredit, priceId?: string) {
    try {
        console.log('=== 添加续费订阅记录 ===');
        console.log('续费数据:', JSON.stringify(data, null, 2));
        
        // 🎯 不修改试用记录，保持历史完整性
        // 试用记录应该永远保持 subscription_type='trial' 状态

        // 根据价格和描述确定计划类型（续费路径）
        let planType = 'basic'; // 默认值
        const price = parseFloat(data.order_price?.toString() || '0');
        const desc = (data.credit_desc || '').toLowerCase();

        if (price === 49.99 || desc.includes('business') || desc.includes('商业版')) {
            planType = 'business';
        } else if (price === 29.99 || desc.includes('professional') || desc.includes('专业版')) {
            planType = 'professional';
        } else if (price === 19.99 || desc.includes('premium') || desc.includes('高级版')) {
            planType = 'premium';
        } else if (price === 9.99 || desc.includes('basic') || desc.includes('基础版')) {
            planType = 'basic';
        }

        // 🎯 根据价格ID判断续费订阅类型（月度/年度）
        let subscriptionType = 'monthly'; // 默认月度
        
        // 年度订阅的价格ID列表
        const annualPriceIds = [
            'price_1S7YYKDx3cvsYDBQyTkiM3vL', // 基础版年度
            'price_1S7YYfDx3cvsYDBQQLkCNcTv', // 高级版年度
            'price_1S7YYtDx3cvsYDBQWIHn7l8k', // 专业版年度
            'price_1S7YZGDx3cvsYDBQpy1DfL9S'  // 商业版年度
        ];
        
        if (priceId && annualPriceIds.includes(priceId)) {
            subscriptionType = 'annual';
        }

        console.log(`设置续费订阅计划类型: ${planType}, 订阅类型: ${subscriptionType} (价格: ${price}, 描述: ${data.credit_desc}, 价格ID: ${priceId})`);

        const { rowCount } = await sql`INSERT INTO nf_subscription
        (user_id, order_number, subscription_id, order_price, credit_amount, order_type, order_desc, order_date,
         subscription_type, subscription_status, plan_type)
        VALUES (
            ${data.user_id},
            ${data.order_number},
            ${data.subscriptionId},
            ${data.order_price},
            ${data.credit_amount},
            '1',
            ${data.credit_desc},
            ${data.order_date},
            ${subscriptionType}, -- 🎯 根据价格ID设置正确的订阅类型
            'active',  -- 🎯 活跃状态
            ${planType} -- 🎯 设置正确的计划类型
        )`;
        
        console.log(`✅ 续费订阅记录添加成功: ${data.subscriptionId}, 订单号: ${data.order_number}`);
        return rowCount || 0;
    } catch (error) {
        console.error('Error adding renewal subscription:', error);
        throw error;
    }
}

export async function refundCredit(refund_credit: number, userId: string, taskId: string) {
    try {
        const success = await addUserCreditBalance(refund_credit, userId);
        if (success) {
            await addUserCredit({
                user_id: userId,
                credit_amount: refund_credit,
                credit_type: '3', // 退款积分
                credit_transaction_type: '1', // 获得积分
                credit_desc: `refund ${refund_credit} credit for task ${taskId}`,
                order_price: 0,
                order_number: `refund_${userId}_${Date.now()}`,
                order_date: new Date().toISOString(),
                product_name: '退款'
            });
        }
    } catch (e) {
        console.error("refund credit error:", e)
    }
}

export async function updateSubscription(subscriptionId: string) {
    try {
        // 🎯 只更新最新的活跃订阅记录，不影响历史记录
        // PostgreSQL UPDATE不支持直接的ORDER BY LIMIT，需要使用子查询
        const { rowCount } = await sql`
        UPDATE nf_subscription 
        SET order_type = '0', 
            subscription_status = 'canceled'
        WHERE id IN (
            SELECT id 
            FROM nf_subscription 
            WHERE subscription_id = ${subscriptionId} 
            AND order_type = '1' 
            AND subscription_status IN ('active', 'trialing')
            ORDER BY order_date DESC 
            LIMIT 1
        )`;
        
        console.log(`✅ 订阅取消：${subscriptionId}, 影响记录数: ${rowCount}`);
        return rowCount || 0;
    } catch (e) {
        console.error("subscription cancel error:", e);
        return 0;
    }
}

// 兼容性函数（将会被弃用）
export async function deleteUserCreditByClerkId(clerkId: string) {
    console.warn('deleteUserCreditByClerkId is deprecated, use deleteUserCreditByUserId instead');
    return deleteUserCreditByUserId(clerkId);
}

export async function addUserCreditBalance_Legacy(credit: number, clerkId: string) {
    console.warn('addUserCreditBalance with clerkId is deprecated, use addUserCreditBalance with userId instead');
    return addUserCreditBalance(credit, clerkId);
}

export async function deductUserCreditBalance(credit: number, userId: string) {
    console.warn('deductUserCreditBalance is deprecated, use deductUserCredits instead');
    return deductUserCredits(userId, credit, '系统扣减积分');
}

export async function updateUserCreditByClerkId(credit: number, userId: string, currentCredit?: number) {
    console.warn('updateUserCreditByClerkId is deprecated, use deductUserCredits instead');
    return deductUserCredits(userId, credit, '系统扣减积分');
}
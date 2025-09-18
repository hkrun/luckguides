'use server';
import { sql } from '@/lib/postgres-client';
import { getKey, setKeyWithExpiry } from '@/lib/redis-client';
import { getCurrentUser } from '@/lib/auth';

const prefix = 'credit_';
const expirySeconds = 60 * 60 * 1; // 1 hour

export async function findUserByUserId(id: string) {
    const { rowCount } = await sql`SELECT user_id FROM nf_users WHERE user_id = ${id} and status='1'`;
    return rowCount;
}

export async function findUserCreditsByUserId(userId?: string, forceRefresh: boolean = false): Promise<number> {
    let credits = 0;
    let targetUserId = userId;
    
    if (!targetUserId) {
        const user = await getCurrentUser();
        if (!user) return credits;
        targetUserId = user.userId;
    }

    const key = prefix + targetUserId;
    
    // 如果不是强制刷新，先尝试从缓存获取
    if (!forceRefresh) {
    credits = Number(await getKey(key));
    if (credits && credits > 0) {
        return credits;
        }
    }
    
    // 从数据库获取最新积分
    const { rowCount, rows } = await sql`SELECT credits FROM nf_users WHERE user_id = ${targetUserId} and status='1'`;
    if (rowCount && rowCount > 0) {
        credits = rows[0].credits;
        // 更新缓存
        await setKeyWithExpiry(key, String(credits), expirySeconds);
    } else {
        credits = 0;
    }
    return credits;
}

export async function updateUserByUserId(userId: string, data: any) {
    const { rows } = await sql`UPDATE nf_users SET 
        username=${data.username},
        email_address=${data.email_address},
        first_name=${data.first_name},
        last_name=${data.last_name},
        gender=${data.gender}
        WHERE user_id=${userId}`;
    return rows;
}

export async function deleteUserByUserId(userId: string) {
    // 软删除：将状态设置为0而不是真正删除
    const { rows } = await sql`UPDATE nf_users SET status='0' WHERE user_id=${userId}`;
    return rows;
}

// 为了兼容性保留的函数（将会被弃用）
export async function findUserByClerkId(id: string) {
    console.warn('findUserByClerkId is deprecated, use findUserByUserId instead');
    return findUserByUserId(id);
}

export async function findUserCreditsByClerkId(clerkId?: string): Promise<number> {
    console.warn('findUserCreditsByClerkId is deprecated, use findUserCreditsByUserId instead');
    return findUserCreditsByUserId(clerkId);
}

export async function updateUserByClerkId(data: any) {
    console.warn('updateUserByClerkId is deprecated, use updateUserByUserId instead');
    return updateUserByUserId(data.id, data);
}

export async function deleteUserByClerkId(data: any) {
    console.warn('deleteUserByClerkId is deprecated, use deleteUserByUserId instead');
    return deleteUserByUserId(data.id);
}

export async function addUser(data: any) {
    console.warn('addUser is deprecated, user creation should be handled through auth API');
    return null;
}

// getCurrentUser函数已移至 @/lib/auth，请使用那里的实现
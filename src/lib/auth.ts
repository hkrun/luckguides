import bcrypt from 'bcryptjs';
import { sql } from '@/lib/postgres-client';

// 用户接口定义
export interface User {
  id: number;
  userId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  credits: number;
  status: string;
  emailVerified: boolean;
  isAdmin: boolean;
  hasMember: boolean;
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// 密码验证
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 根据邮箱查找用户
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const { rows } = await sql`
      SELECT 
        id,
        user_id as "userId",
        email_address as email,
        username,
        first_name as "firstName",
        last_name as "lastName",
        credits,
        status,
        email_verified as "emailVerified",
        password_hash as "passwordHash"
      FROM nf_users 
      WHERE email_address = ${email}
    `;

    if (rows.length === 0) return null;

    const user = rows[0];
    return {
      ...user,
      isAdmin: user.userId === process.env.APP_ROLE_ADMIN,
      hasMember: false // 需要单独查询订阅状态
    } as User;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

// 创建新用户（仅用于注册，不设置认证状态）
export async function createUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
}): Promise<User | null> {
  const { email, password, firstName, lastName, username } = userData;
  
  try {
    // 检查邮箱是否已存在
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // 加密密码
    const passwordHash = await hashPassword(password);
    
    // 生成用户ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建用户
    const welcomeCredits = 0; // 新用户不再赠送积分
    
    const { rows } = await sql`
      INSERT INTO nf_users (
        user_id, email_address, password_hash, first_name, last_name, username, credits
      ) VALUES (
        ${userId}, ${email}, ${passwordHash}, ${firstName}, ${lastName}, 
        ${username || `${firstName}${lastName}`}, ${welcomeCredits}
      )
      RETURNING 
        id,
        user_id as "userId",
        email_address as email,
        username,
        first_name as "firstName",
        last_name as "lastName",
        credits,
        status,
        email_verified as "emailVerified"
    `;

    if (rows.length === 0) return null;

    const user = rows[0];
    
    // 不再添加欢迎积分记录（新用户不赠送积分）

    return {
      ...user,
      isAdmin: user.userId === process.env.APP_ROLE_ADMIN,
      hasMember: false // 新用户默认无会员资格
    } as User;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
} 

// NextAuth 相关函数
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 获取当前登录用户信息（用于 server actions）
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return null;
    }

    const userId = session.user.id;

    // 从数据库查询最新用户数据
    const { rows } = await sql`
      SELECT 
        id,
        user_id as "userId",
        email_address as email,
        username,
        first_name as "firstName",
        last_name as "lastName",
        credits,
        status,
        email_verified as "emailVerified"
      FROM nf_users 
      WHERE user_id = ${userId} AND status = '1'
    `;

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    
    return {
      ...user,
      isAdmin: user.userId === process.env.APP_ROLE_ADMIN,
      hasMember: false // 需要单独查询订阅状态
    } as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
} 
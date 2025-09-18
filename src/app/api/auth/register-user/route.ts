import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('emailInvalid'),
  password: z.string().min(6, 'passwordLength'),
  firstName: z.string().min(1, 'firstNameRequired'),
  lastName: z.string().min(1, 'lastNameRequired'),
  username: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证输入数据
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'invalidInput', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, username } = validation.data;

    // 创建新用户（不设置任何认证状态）
    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      username,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'emailExists' },
        { status: 400 }
      );
    }

    // 只返回成功信息，不设置任何认证cookie或token
    return NextResponse.json({
      success: true,
      message: 'User created successfully. Please sign in.',
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    
    if ((error as Error).message === 'Email already exists') {
      return NextResponse.json(
        { error: 'emailExists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'networkError' },
      { status: 500 }
    );
  }
} 
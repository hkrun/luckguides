import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/types/airwallex';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // 获取 NextAuth session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.userId as string;

    return NextResponse.json({ 
      message: 'Airwallex API endpoint', 
      userId: userId
    });
  } catch (error) {
    console.error('Error in Airwallex API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 获取 NextAuth session token
    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.userId) {
      return NextResponse.json(
        { error: '用户未认证' },
        { status: 401 }
      );
    }

    const userId = token.userId as string;

    // 解析请求数据
    const body = await request.json();
    const { amount, currency, product } = body;

    if (!amount || !currency) {
      return NextResponse.json(
        { error: '缺少必要的支付参数' },
        { status: 400 }
      );
    }

    // 这里实现Airwallex支付逻辑
    // const paymentIntent = await createAirwallexPaymentIntent({
    //   amount,
    //   currency,
    //   customerId: user.userId,
    //   product
    // });

    // 模拟支付创建结果
    const result = {
      paymentIntentId: `pi_${Date.now()}`,
      clientSecret: `pi_${Date.now()}_secret`,
      amount,
      currency,
      status: 'requires_payment_method'
    };

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Airwallex支付API错误:', error);
    return NextResponse.json(
      { error: '支付创建失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// Create payment intent
async function createPaymentIntent(token: string, 
    userId: string, first_name:string, last_name:string, 
    email:string, product:Product ) {
    const response = await fetch(`${process.env.AIRWALLEX_API}/api/v1/pa/payment_intents/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 79,
        currency: "USD",
        request_id: `request_${Date.now()}`, // Unique request ID
        customer: {
          additional_info: {
            registration_date: new Date().toISOString().split('T')[0], // 当前日期，格式：YYYY-MM-DD
          },
          first_name: first_name, 
          last_name: last_name, 
          merchant_customer_id: userId, // 生成唯一客户ID
          email: email,
          phone_number: ""
        },
        order: {
          products: [product]
        },
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}`,
      }),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create payment intent: ${JSON.stringify(error)}`);
    }
    return response.json();
  }

// Airwallex authentication function
async function getAirwallexToken(revalidate: number = 600) {
    const response = await fetch(`${process.env.AIRWALLEX_API}/api/v1/authentication/login`, {
      method: 'POST',
      cache: "force-cache",
      next: { revalidate: revalidate || 600 },
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AIRWALLEX_API_KEY || '',
        'x-client-id': process.env.AIRWALLEX_CLIENT_ID || ''
      },
    });
    // const text = await response.text();
    // console.log(text);
    if (!response.ok) {
      throw new Error('Failed to authenticate with Airwallex');
    }
  
    const data = await response.json();
    return data.token;
  }
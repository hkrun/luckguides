import { NextRequest, NextResponse } from 'next/server';
import { findUserCreditsByUserId } from '@/actions/user';
export async function POST(request: NextRequest) {

    const credits = await findUserCreditsByUserId();

    return NextResponse.json(credits,{ status: 200 });
}
export interface Order {
    orderId: string;
    fullName: string;
    email: string;
    product: string;
    amount: number;
    type: string;
    status: string;
    date: string;
}


export interface UserOrder {
    orderId: string;
    credits: string;
    price: string;
    date: string;
    type: string;
    status: string;
    productName?: string; // 🆕 产品名称字段
}

export interface UserSubscription {
    orderId: string;
    credits: string;
    price: string;
    date: string;
    renewalDate: string;
    // 🆕 试用订阅相关字段
    subscriptionType: 'trial' | 'monthly' | 'quarterly' | 'annual';
    subscriptionStatus: 'trialing' | 'active' | 'canceled';
    trialStart?: string;
    trialEnd?: string;
    isTrialActive?: boolean;
    // 🆕 是否为活跃订阅
    isActive: boolean;
}

// 🆕 试用检查相关接口
export interface TrialCheckResult {
    hasUsedTrial: boolean;
    currentTrialStatus?: 'trialing' | 'expired' | 'none';
    trialEndDate?: string;
    planType?: string; // 🆕 添加计划类型字段
}

// 🆕 订阅创建参数
export interface SubscriptionCreationParams {
    userId: string;
    subscriptionId: string;
    orderNumber: string;
    priceId: string;
    price: number;
    creditAmount: number;
    isTrialSubscription: boolean;
    trialPeriodDays?: number;
}
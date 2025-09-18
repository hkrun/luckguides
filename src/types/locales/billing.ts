export interface Billing {
    page: {
      title: string;
      description: string;
    };
    subscription: SubscriptionLocal;
    transaction: {
      title: string;
      description: string;
      productName: string;
      unit: string;
      price: string;
      date: string;
      status: string;
      noTransactions: string;
      renewal: string; // 🆕 续费标识
    };
    toast: ToastLocal;
    meta:{
        title: string;
        description: string;
    };
  }

  export interface SubscriptionLocal  {
    title: string;
    description: string;
    clickHint: string;
    currentPlan: {
      planName: string;
      billingCycle: string;
      monthlyUnit: string;
      annualUnit: string;
      subscriptionStart: string;
      nextRenewal: string;
      expiryTime: string; // 🆕 到期时间
      noSubscriptions: string;
      cancelButton: string;
      status: string; // 🆕 状态标签
      statusCancelled: string; // 🆕 已取消状态
    };
    // 🆕 新增订阅类型翻译
    subscriptionTypes: {
      trial: string;
      monthly: string;
      quarterly: string;
      annual: string;
    };
    // 🆕 新增价格单位翻译
    pricingUnits: {
      trial: string;
      monthly: string;
      quarterly: string;
      annual: string;
    };
    cancelDialog: {
      title: string;
      description: string;
      cancelButton: string;
      confirmButton: string;
    };
  }

  export interface ToastLocal {
    error: {
        title: string;
        loadData: string;
        cancelSubscription: string;
      };
      success: {
        title: string;
        cancelSubscription: string;
      };
  }
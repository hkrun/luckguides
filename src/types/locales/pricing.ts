export interface Pricing {
  hero: {
    subtitle: string;
    title: string;
    description: string;
  };
  billing: {
    title: string;
    monthly: string;
    annual: string;
    save: string;
  };
  personal: {
    title: string;
    description: string;
    badge: string;
    popular: string;
  };
  basic: {
    title: string;
    price: {
      amount: string;
      period: string;
    };
    annualPrice?: {
      amount: string;
      period: string;
    };
    trial: string;
    currency: string;
    mode: "payment" | "recurring";
    features: Array<string>;
    annualFeatures?: Array<string>;
    product: Product;
    annualProduct?: Product;
    cta: string;
  };
  professional: {
    title: string;
    price: {
      amount: string;
      period: string;
    };
    annualPrice?: {
      amount: string;
      period: string;
    };
    trial: string;
    currency: string;
    mode: "payment" | "recurring";
    features: Array<string>;
    annualFeatures?: Array<string>;
    product: Product;
    annualProduct?: Product;
    cta: string;
  };
  oneTimeBasic: {
    title: string;
    price: {
      amount: string;
      period: string;
    };
    currency: string;
    mode: "payment" | "recurring";
    features: Array<string>;
    product: Product;
    cta: string;
  };
  oneTimeProfessional: {
    title: string;
    price: {
      amount: string;
      period: string;
    };
    currency: string;
    mode: "payment" | "recurring";
    features: Array<string>;
    product: Product;
    cta: string;
  };
  oneTimeElite: {
    title: string;
    price: {
      amount: string;
      period: string;
    };
    currency: string;
    mode: "payment" | "recurring";
    features: Array<string>;
    product: Product;
    cta: string;
  };
  business: {
    title: string;
    price: {
      amount: string;
      period: string;
    };
    annualPrice?: {
      amount: string;
      period: string;
    };
    trial: string;
    currency: string;
    mode: "payment" | "recurring";
    features: Array<string>;
    product: Product;
    annualProduct?: Product;
    cta: string;
  };
  paymentTips: string;
  planDescriptions: {
    basic: string;
    professional: string;
    elite: string;
    oneTimeBasic: string;
    oneTimeProfessional: string;
    oneTimeElite: string;
    business: string;
  };
  meta: {
    keywords: string;
    title: string;
    description: string;
    alt: string;
  };
}

export interface Product {
  code: string;
  desc: string;
  name: string;
  quantity: string;
  sku: string;
  type: string;
  unit_price: string;
  url?: string;
  priceId?: string;
}
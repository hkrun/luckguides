/**
 * 订阅计划权限管理系统
 * 定义不同订阅计划的功能权限和限制
 */

// 订阅计划类型枚举
export enum SubscriptionPlan {
  FREE = 'free',           // 免费用户（未订阅）
  BASIC = 'basic',         // 基础版
  PROFESSIONAL = 'professional', // 专业版
  BUSINESS = 'business'    // 商业版（原elite）
}

// 功能类型枚举
export enum Feature {
  TEXT_TRANSLATION = 'text_translation',      // 文本翻译
  VOICE_TRANSLATION = 'voice_translation',    // 语音翻译
  IMAGE_TRANSLATION = 'image_translation',    // 图片翻译
  TRAVEL_GUIDE = 'travel_guide',              // 旅游攻略
  AI_ASSISTANT = 'ai_assistant',              // AI智能助手
  API_ACCESS = 'api_access',                  // API接口访问
  PRIORITY_SUPPORT = 'priority_support'       // 优先支持
}

// 订阅计划配置接口
export interface PlanConfig {
  name: string;
  features: Feature[];
  limits: {
    dailyTranslations?: number;    // 每日翻译次数限制
    monthlyApiCalls?: number;      // 每月API调用次数限制
    maxFileSize?: number;          // 最大文件大小（MB）
    concurrentRequests?: number;   // 并发请求数限制
  };
  apiKeyAllowed: boolean;          // 是否允许生成API密钥
}

// 订阅计划配置
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.FREE]: {
    name: '免费用户',
    features: [],
    limits: {
      dailyTranslations: 0,
      monthlyApiCalls: 0,
      maxFileSize: 0,
      concurrentRequests: 0
    },
    apiKeyAllowed: false
  },
  
  [SubscriptionPlan.BASIC]: {
    name: '基础版',
    features: [
      Feature.TEXT_TRANSLATION,
      Feature.VOICE_TRANSLATION,
      Feature.IMAGE_TRANSLATION
    ],
    limits: {
      dailyTranslations: 1000,
      monthlyApiCalls: 0,
      maxFileSize: 5,
      concurrentRequests: 2
    },
    apiKeyAllowed: false
  },
  
  [SubscriptionPlan.PROFESSIONAL]: {
    name: '专业版',
    features: [
      Feature.TEXT_TRANSLATION,
      Feature.VOICE_TRANSLATION,
      Feature.IMAGE_TRANSLATION,
      Feature.TRAVEL_GUIDE,
      Feature.AI_ASSISTANT
    ],
    limits: {
      dailyTranslations: 5000,
      monthlyApiCalls: 0,
      maxFileSize: 10,
      concurrentRequests: 5
    },
    apiKeyAllowed: false
  },
  
  [SubscriptionPlan.BUSINESS]: {
    name: '商业版',
    features: [
      Feature.TEXT_TRANSLATION,
      Feature.VOICE_TRANSLATION,
      Feature.IMAGE_TRANSLATION,
      Feature.TRAVEL_GUIDE,
      Feature.AI_ASSISTANT,
      Feature.API_ACCESS,
      Feature.PRIORITY_SUPPORT
    ],
    limits: {
      dailyTranslations: 20000,
      monthlyApiCalls: 10000,
      maxFileSize: 50,
      concurrentRequests: 10
    },
    apiKeyAllowed: true
  }
};

// 根据订阅描述映射到计划类型
export function mapSubscriptionDescToPlan(orderDesc: string): SubscriptionPlan {
  if (!orderDesc) return SubscriptionPlan.FREE;
  
  const desc = orderDesc.toLowerCase();
  
  if (desc.includes('basic') || desc.includes('基础版')) {
    return SubscriptionPlan.BASIC;
  } else if (desc.includes('professional') || desc.includes('专业版')) {
    return SubscriptionPlan.PROFESSIONAL;
  } else if (desc.includes('elite') || desc.includes('business') || desc.includes('商业版')) {
    return SubscriptionPlan.BUSINESS;
  }
  
  return SubscriptionPlan.FREE;
}

// 根据产品代码映射到计划类型
export function mapProductCodeToPlan(productCode: string): SubscriptionPlan {
  if (!productCode) return SubscriptionPlan.FREE;
  
  const code = productCode.toLowerCase();
  
  if (code.includes('basic')) {
    return SubscriptionPlan.BASIC;
  } else if (code.includes('professional')) {
    return SubscriptionPlan.PROFESSIONAL;
  } else if (code.includes('elite') || code.includes('business')) {
    return SubscriptionPlan.BUSINESS;
  }
  
  return SubscriptionPlan.FREE;
}

// 检查用户是否有权限使用某个功能
export function hasFeatureAccess(userPlan: SubscriptionPlan, feature: Feature): boolean {
  const planConfig = SUBSCRIPTION_PLANS[userPlan];
  return planConfig.features.includes(feature);
}

// 获取用户计划配置
export function getPlanConfig(plan: SubscriptionPlan): PlanConfig {
  return SUBSCRIPTION_PLANS[plan];
}

// 获取功能所需的最低计划
export function getMinimumPlanForFeature(feature: Feature): SubscriptionPlan {
  for (const [plan, config] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (config.features.includes(feature)) {
      return plan as SubscriptionPlan;
    }
  }
  return SubscriptionPlan.BUSINESS; // 默认返回最高级计划
}

// 权限检查结果接口
export interface PermissionCheckResult {
  allowed: boolean;
  userPlan: SubscriptionPlan;
  requiredPlan?: SubscriptionPlan;
  message?: string;
  upgradeUrl?: string;
}

// 检查功能权限
export function checkFeaturePermission(
  userPlan: SubscriptionPlan, 
  feature: Feature,
  currentLang: string = 'zh'
): PermissionCheckResult {
  const hasAccess = hasFeatureAccess(userPlan, feature);
  
  if (hasAccess) {
    return {
      allowed: true,
      userPlan
    };
  }
  
  const requiredPlan = getMinimumPlanForFeature(feature);
  const messages = {
    zh: {
      [Feature.TEXT_TRANSLATION]: '文本翻译功能需要基础版或更高版本',
      [Feature.VOICE_TRANSLATION]: '语音翻译功能需要基础版或更高版本',
      [Feature.IMAGE_TRANSLATION]: '图片翻译功能需要基础版或更高版本',
      [Feature.TRAVEL_GUIDE]: '旅游攻略功能需要专业版或更高版本',
      [Feature.AI_ASSISTANT]: 'AI智能助手功能需要专业版或更高版本',
      [Feature.API_ACCESS]: 'API接口访问需要商业版',
      [Feature.PRIORITY_SUPPORT]: '优先支持需要商业版'
    },
    en: {
      [Feature.TEXT_TRANSLATION]: 'Text translation requires Basic plan or higher',
      [Feature.VOICE_TRANSLATION]: 'Voice translation requires Basic plan or higher',
      [Feature.IMAGE_TRANSLATION]: 'Image translation requires Basic plan or higher',
      [Feature.TRAVEL_GUIDE]: 'Travel guide requires Professional plan or higher',
      [Feature.AI_ASSISTANT]: 'AI assistant requires Professional plan or higher',
      [Feature.API_ACCESS]: 'API access requires Business plan',
      [Feature.PRIORITY_SUPPORT]: 'Priority support requires Business plan'
    },
    ja: {
      [Feature.TEXT_TRANSLATION]: 'テキスト翻訳機能にはベーシックプラン以上が必要です',
      [Feature.VOICE_TRANSLATION]: '音声翻訳機能にはベーシックプラン以上が必要です',
      [Feature.IMAGE_TRANSLATION]: '画像翻訳機能にはベーシックプラン以上が必要です',
      [Feature.TRAVEL_GUIDE]: '旅行ガイド機能にはプロフェッショナルプラン以上が必要です',
      [Feature.AI_ASSISTANT]: 'AI智能助手機能にはプロフェッショナルプラン以上が必要です',
      [Feature.API_ACCESS]: 'APIアクセスにはビジネスプランが必要です',
      [Feature.PRIORITY_SUPPORT]: '優先サポートにはビジネスプランが必要です'
    },
    ko: {
      [Feature.TEXT_TRANSLATION]: '텍스트 번역 기능은 베이직 플랜 이상이 필요합니다',
      [Feature.VOICE_TRANSLATION]: '음성 번역 기능은 베이직 플랜 이상이 필요합니다',
      [Feature.IMAGE_TRANSLATION]: '이미지 번역 기능은 베이직 플랜 이상이 필요합니다',
      [Feature.TRAVEL_GUIDE]: '여행 가이드 기능은 프로페셔널 플랜 이상이 필요합니다',
      [Feature.AI_ASSISTANT]: 'AI 어시스턴트 기능은 프로페셔널 플랜 이상이 필요합니다',
      [Feature.API_ACCESS]: 'API 액세스는 비즈니스 플랜이 필요합니다',
      [Feature.PRIORITY_SUPPORT]: '우선 지원은 비즈니스 플랜이 필요합니다'
    },
    es: {
      [Feature.TEXT_TRANSLATION]: 'La traducción de texto requiere plan Básico o superior',
      [Feature.VOICE_TRANSLATION]: 'La traducción de voz requiere plan Básico o superior',
      [Feature.IMAGE_TRANSLATION]: 'La traducción de imágenes requiere plan Básico o superior',
      [Feature.TRAVEL_GUIDE]: 'La guía de viaje requiere plan Profesional o superior',
      [Feature.AI_ASSISTANT]: 'El asistente IA requiere plan Profesional o superior',
      [Feature.API_ACCESS]: 'El acceso API requiere plan Empresarial',
      [Feature.PRIORITY_SUPPORT]: 'El soporte prioritario requiere plan Empresarial'
    },
    fr: {
      [Feature.TEXT_TRANSLATION]: 'La traduction de texte nécessite un plan Basique ou supérieur',
      [Feature.VOICE_TRANSLATION]: 'La traduction vocale nécessite un plan Basique ou supérieur',
      [Feature.IMAGE_TRANSLATION]: 'La traduction d\'images nécessite un plan Basique ou supérieur',
      [Feature.TRAVEL_GUIDE]: 'Le guide de voyage nécessite un plan Professionnel ou supérieur',
      [Feature.AI_ASSISTANT]: 'L\'assistant IA nécessite un plan Professionnel ou supérieur',
      [Feature.API_ACCESS]: 'L\'accès API nécessite un plan Entreprise',
      [Feature.PRIORITY_SUPPORT]: 'Le support prioritaire nécessite un plan Entreprise'
    },
    de: {
      [Feature.TEXT_TRANSLATION]: 'Textübersetzung erfordert Basic-Plan oder höher',
      [Feature.VOICE_TRANSLATION]: 'Sprachübersetzung erfordert Basic-Plan oder höher',
      [Feature.IMAGE_TRANSLATION]: 'Bildübersetzung erfordert Basic-Plan oder höher',
      [Feature.TRAVEL_GUIDE]: 'Reiseführer erfordert Professional-Plan oder höher',
      [Feature.AI_ASSISTANT]: 'KI-Assistent erfordert Professional-Plan oder höher',
      [Feature.API_ACCESS]: 'API-Zugang erfordert Business-Plan',
      [Feature.PRIORITY_SUPPORT]: 'Priority-Support erfordert Business-Plan'
    }
  };
  
  const langMessages = messages[currentLang as keyof typeof messages] || messages.en;
  
  return {
    allowed: false,
    userPlan,
    requiredPlan,
    message: langMessages[feature],
    upgradeUrl: `/${currentLang}/pricing`
  };
}

// 功能名称映射
export const FEATURE_NAMES = {
  zh: {
    [Feature.TEXT_TRANSLATION]: '文本翻译',
    [Feature.VOICE_TRANSLATION]: '语音翻译',
    [Feature.IMAGE_TRANSLATION]: '图片翻译',
    [Feature.TRAVEL_GUIDE]: '旅游攻略',
    [Feature.AI_ASSISTANT]: 'AI智能助手',
    [Feature.API_ACCESS]: 'API接口',
    [Feature.PRIORITY_SUPPORT]: '优先支持'
  },
  en: {
    [Feature.TEXT_TRANSLATION]: 'Text Translation',
    [Feature.VOICE_TRANSLATION]: 'Voice Translation',
    [Feature.IMAGE_TRANSLATION]: 'Image Translation',
    [Feature.TRAVEL_GUIDE]: 'Travel Guide',
    [Feature.AI_ASSISTANT]: 'AI Assistant',
    [Feature.API_ACCESS]: 'API Access',
    [Feature.PRIORITY_SUPPORT]: 'Priority Support'
  }
};

// 计划名称映射
export const PLAN_NAMES = {
  zh: {
    [SubscriptionPlan.FREE]: '免费用户',
    [SubscriptionPlan.BASIC]: '基础版',
    [SubscriptionPlan.PROFESSIONAL]: '专业版',
    [SubscriptionPlan.BUSINESS]: '商业版'
  },
  en: {
    [SubscriptionPlan.FREE]: 'Free',
    [SubscriptionPlan.BASIC]: 'Basic',
    [SubscriptionPlan.PROFESSIONAL]: 'Professional',
    [SubscriptionPlan.BUSINESS]: 'Business'
  }
};

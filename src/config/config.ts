export const port = process.env.PORT || 3000;
export const host = process.env.NEXT_PUBLIC_CF_URL || 
  (process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL 
    : `http://localhost:${port}`);

// 项目标识符 - 用于Stripe webhook事件过滤
export const PROJECT_ID = process.env.PROJECT_ID || 'ai-video-luck-guides';

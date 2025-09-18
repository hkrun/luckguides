import { NextResponse, NextRequest } from 'next/server'
import { i18nConfig } from "@/i18n-config";
import { getToken } from "next-auth/jwt";

// 受保护的API路由
const protectedApiRoutes = [
  '/api/user',
  '/api/subscription',
  '/api/airwallex',
  '/api/stripe',
  '/api/upload',
  '/api/luck-guides',
];

// 管理员专用路由
const adminRoutes = [
  '/dashboard',
  '/create-template'
];

// 公开路由（不需要认证）
const publicRoutes = [
  '/api/auth/register-user', // 自定义注册端点
  '/api/auth', // NextAuth所有路由
  '/',
  '/about',
  '/contact',
  '/legal',
];

function isProtectedApiRoute(pathname: string): boolean {
  return protectedApiRoutes.some(route => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(route => pathname.includes(route));
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route === '/') return pathname === '/' || pathname.match(/^\/[a-z]{2}$/);
    return pathname.includes(route);
  });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 强制放行 NextAuth 的所有路由，避免被任何重写/鉴权拦截返回 HTML
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // 跳过API路由的国际化处理
  if (pathname.startsWith('/api/')) {
    // 如果是受保护的API路由，检查认证
    if (isProtectedApiRoute(pathname)) {
      try {
        // 获取 NextAuth session token
        const token = await getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        });
      
        if (!token?.userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 将 NextAuth 用户信息添加到请求头中
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', token.userId as string);
        requestHeaders.set('x-user-email', token.email as string);

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
    }
    
    return NextResponse.next();
  }

  // 处理国际化路由（仅针对非API路由）
  const pathnameHasLocale = i18nConfig.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // 管理员路由检查
  if (isAdminRoute(pathname)) {
    try {
      // 检查 NextAuth token
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token?.userId || token.userId !== process.env.APP_ROLE_ADMIN) {
        const redirectUrl = new URL('/', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      const redirectUrl = new URL('/', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 处理国际化重写（仅针对页面路由）
  if (!pathnameHasLocale) {
    request.nextUrl.pathname = `/${i18nConfig.defaultLocale}${pathname}`;
  return NextResponse.rewrite(request.nextUrl);
  }

  return NextResponse.next();
}

 export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|sitemap.xml|favicon.ico|robots.txt|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|assets)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}


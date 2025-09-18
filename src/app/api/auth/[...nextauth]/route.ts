import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { sql } from '@/lib/postgres-client';
import { findUserByEmail, createUser, verifyPassword } from '@/lib/auth';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      httpOptions: {
        timeout: 10000, // 增加超时时间到 10 秒
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 查找用户
          const user = await findUserByEmail(credentials.email);
          if (!user) {
            return null;
          }

          // 检查用户状态
          if (user.status !== '1') {
            return null;
          }

          // 验证密码
          const isPasswordValid = await verifyPassword(credentials.password, (user as any).passwordHash);
          if (!isPasswordValid) {
            return null;
          }

          // 返回用户信息 (NextAuth User format)
          return {
            id: user.userId,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            image: null,
            firstName: user.firstName,
            lastName: user.lastName,
          } as any;
        } catch (error) {
          console.error('Credentials authorization error:', error);
          return null;
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // 在首次登录时将用户信息添加到 token
      if (user) {
        token.userId = user.id;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.picture = user.image || undefined;
        token.isNewUser = (user as any).isNewUser || false;
      }
      return token;
    },
    async session({ session, token }) {
      // 将 token 中的信息传递给 session
      if (token && session.user) {
        session.user.id = token.userId as string;
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;
        session.user.image = token.picture ? (token.picture as string) : undefined;
        (session.user as any).isNewUser = token.isNewUser;

        // 移除易变数据
        delete (session.user as any).credits;
        delete (session.user as any).isAdmin;
        delete (session.user as any).hasMember;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 如果 URL 是相对路径，直接返回
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // 如果 URL 是同域名的，直接返回
      if (new URL(url).origin === baseUrl) {
        return url;
      }

      // 否则返回基础 URL
      return baseUrl;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email) {
          console.error("Google profile missing email");
          return false;
        }

        try {
          let existingUser = await findUserByEmail(user.email);
          let isNewUser = false;

          if (!existingUser) {
            const newUser = {
              email: user.email,
              firstName: profile?.given_name || '',
              lastName: profile?.family_name || '',
              username: user.name || user.email.split('@')[0],
              password: '',
            };
            existingUser = await createUser(newUser);
            isNewUser = true;
          }

          if (!existingUser) {
            console.error("Failed to find or create user for Google sign-in");
            return false;
          }

          // 只将必要的、不易变的信息附加到 user 对象，以便传递给 jwt 回调
          (user as any).id = existingUser.userId;
          (user as any).firstName = existingUser.firstName;
          (user as any).lastName = existingUser.lastName;
          (user as any).isNewUser = isNewUser; // 标记是否为新用户

          return true;
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          return false;
        }
      }
      
      // 对于credentials登录，直接允许
      if (account?.provider === "credentials") {
        return true;
      }
      
      return true;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST } 
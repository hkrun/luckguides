import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      credits?: number;
      isAdmin: boolean;
      hasMember: boolean;
      isNewUser?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    credits?: number;
    isAdmin: boolean;
    hasMember: boolean;
    isNewUser?: boolean;
  }

  interface Profile {
    given_name?: string;
    family_name?: string;
    picture?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    firstName?: string;
    lastName?: string;
    credits?: number;
    isAdmin: boolean;
    hasMember: boolean;
    picture?: string;
    isNewUser?: boolean;
  }
}
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      theme?: string;
    };
  }

  interface User {
    id: number;
    theme?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: number;
    id: number;
    iat: number;
    exp: number;
    jti: string;
    theme?: string;
  }
}

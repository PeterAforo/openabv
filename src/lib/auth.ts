import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import prisma from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      image?: string | null;
      departmentId?: string | null;
      branchId?: string | null;
    };
  }

  interface User {
    role: UserRole;
    departmentId?: string | null;
    branchId?: string | null;
  }

  interface JWT {
    id: string;
    role: UserRole;
    departmentId?: string | null;
    branchId?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive || user.deletedAt || !user.password) {
          return null;
        }

        const isValid = await bcryptjs.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          image: user.image,
          departmentId: user.departmentId,
          branchId: user.branchId,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        // Find or update user with Google profile details
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email as string },
        });
        if (existingUser) {
          // Update name/image if they were empty (first OAuth link)
          const updates: Record<string, string> = {};
          if (!existingUser.firstName && (profile as { given_name?: string }).given_name) {
            updates.firstName = (profile as { given_name?: string }).given_name!;
          }
          if (!existingUser.lastName && (profile as { family_name?: string }).family_name) {
            updates.lastName = (profile as { family_name?: string }).family_name!;
          }
          if (!existingUser.image && (profile as { picture?: string }).picture) {
            updates.image = (profile as { picture?: string }).picture!;
          }
          if (Object.keys(updates).length > 0) {
            await prisma.user.update({ where: { id: existingUser.id }, data: updates });
          }
        } else {
          // The PrismaAdapter will create the user; ensure it has required fields
          // We set them on the user object so the adapter picks them up
          user.name = profile.name || (profile as { given_name?: string }).given_name || "";
          (user as unknown as Record<string, unknown>).firstName = (profile as { given_name?: string }).given_name || profile.name?.split(" ")[0] || "";
          (user as unknown as Record<string, unknown>).lastName = (profile as { family_name?: string }).family_name || profile.name?.split(" ").slice(1).join(" ") || "";
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role || "STAFF";
        token.departmentId = user.departmentId;
        token.branchId = user.branchId;
      }
      // On first Google sign-in, fetch role from DB since adapter user may not have it
      if (account?.provider === "google" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, departmentId: true, branchId: true, firstName: true, lastName: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.departmentId = dbUser.departmentId;
          token.branchId = dbUser.branchId;
          if (!token.name || token.name === "") {
            token.name = `${dbUser.firstName} ${dbUser.lastName}`.trim();
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.departmentId = token.departmentId as string | null;
        session.user.branchId = token.branchId as string | null;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");

      if (isOnDashboard && !isLoggedIn) {
        return false;
      }

      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
});

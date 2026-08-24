import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) throw new Error("Usuario no encontrado");
        if (!user.isActive) throw new Error("Tu cuenta ha sido suspendida. Contactá al administrador.");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Contraseña incorrecta");

        // Mark email as confirmed on first successful login
        if (!user.emailConfirmed) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailConfirmed: true }
          });
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Google OAuth → create/update USER role account
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                profileImage: user.image || null,
                googleId: account.providerAccountId,
                password: randomPassword,
                role: "USER",         // Google = usuario común
                emailConfirmed: true,
                isActive: true,
              },
            });
          } else {
            // Update googleId and profile image if missing
            await prisma.user.update({
              where: { email: user.email },
              data: {
                googleId: account.providerAccountId,
                profileImage: existingUser.profileImage || user.image || null,
                emailConfirmed: true,
              },
            });
          }
          return true;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      // After Google login, fetch role from DB
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};

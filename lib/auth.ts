import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        username: {
          label: "Username",
          type: "text",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        try {
          if (
            !credentials?.username ||
            !credentials?.password
          ) {
            return null;
          }

          const username = String(
            credentials.username
          )
            .trim()
            .toLowerCase();

          const password = String(
            credentials.password
          );

          const user =
            await prisma.user.findUnique({
              where: {
                username,
              },
            });

          if (!user) {
            console.log(
              "LOGIN: USER NOT FOUND:",
              username
            );

            return null;
          }

          if (!user.active) {
            console.log(
              "LOGIN: USER INACTIVE:",
              username
            );

            return null;
          }

          const passwordValid =
            await bcrypt.compare(
              password,
              user.password
            );

          if (!passwordValid) {
            console.log(
              "LOGIN: INVALID PASSWORD:",
              username
            );

            return null;
          }

          console.log(
            "LOGIN SUCCESS:",
            {
              id: user.id,
              username: user.username,
              role: user.role,
              active: user.active,
            }
          );

          return {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
          };
        } catch (error) {
          console.error(
            "AUTHORIZE ERROR:",
            error
          );

          return null;
        }
      },
    }),
  ],

  callbacks: {
    /*
     * =====================================================
     * JWT
     * =====================================================
     */

    async jwt({
      token,
      user,
    }) {
      /*
       * On initial login, save the user ID.
       */

      if (user?.id) {
        token.id = user.id;
      }

      if (user?.name) {
        token.name = user.name;
      }

      if (user?.username) {
        token.username =
          user.username;
      }

      if (user?.role) {
        token.role =
          user.role;
      }

      return token;
    },

    /*
     * =====================================================
     * SESSION
     * =====================================================
     *
     * IMPORTANT:
     *
     * Instead of trusting token.role, we query the
     * database using token.id.
     *
     * This guarantees that ADMIN/CASHIER/WAITER comes
     * directly from the User table.
     */

    async session({
      session,
      token,
    }) {
      if (!session.user) {
        return session;
      }

      const userId =
        typeof token.id === "string"
          ? token.id
          : "";

      if (!userId) {
        console.error(
          "SESSION ERROR: No user ID in JWT."
        );

        return session;
      }

      const databaseUser =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },

          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            active: true,
          },
        });

      if (!databaseUser) {
        console.error(
          "SESSION ERROR: User not found:",
          userId
        );

        return session;
      }

      if (!databaseUser.active) {
        console.error(
          "SESSION ERROR: User is inactive:",
          databaseUser.username
        );

        return session;
      }

      /*
       * Put the REAL database values into the session.
       */

      session.user.id =
        databaseUser.id;

      session.user.name =
        databaseUser.name;

      session.user.username =
        databaseUser.username;

      session.user.role =
        databaseUser.role;

      console.log(
        "SESSION CREATED:",
        {
          username:
            databaseUser.username,

          role:
            databaseUser.role,

          userId:
            databaseUser.id,
        }
      );

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret:
    process.env.NEXTAUTH_SECRET,
};
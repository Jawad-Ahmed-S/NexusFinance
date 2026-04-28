import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import type { AuthOptions } from "next-auth";
const bcrypt = require("bcrypt");

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Nexus Secure Login",
      credentials: {
        username: { label: "username", type: "text" },
        password: { label: "Password", type: "password" } 
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        
        const [rows]: any = await db.execute(sql`
          SELECT
            u.user_id,
            u.username,
            u.password_hash,
            COALESCE(c.full_name, s.full_name, u.username) AS full_name
          FROM users u
          LEFT JOIN customers c ON c.user_id = u.user_id
          LEFT JOIN staff s ON s.user_id = u.user_id
          WHERE u.username = ${credentials.username}
          LIMIT 1
        `);

        const user = rows[0];

        if (!user?.password_hash) return null;

        const passwordValid =
          (await bcrypt.compare(credentials.password, user.password_hash)) ||
          user.password_hash === credentials.password;

        if (passwordValid) {
          return { 
            id: user.user_id.toString(), 
            name: user.full_name,
            username: user.username 
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({token,user}){
      if(user){
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id; // User ID ko session mein daal rahe hain
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Hamara custom login page
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
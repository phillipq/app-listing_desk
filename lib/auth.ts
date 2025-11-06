import bcrypt from "bcryptjs"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, _req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const realtor = await prisma.realtor.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!realtor || !realtor.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          realtor.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Return user object with required fields
        // Domain is part of extended User type
        return {
          id: realtor.id,
          email: realtor.email,
          name: realtor.name || realtor.email,
          domain: realtor.domain || '',
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.domain = user.domain
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.domain = token.domain as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

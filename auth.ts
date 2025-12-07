import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './lib/db'
import { ShippingAddress } from './types'

import NextAuth, { type DefaultSession, type User } from 'next-auth'
import authConfig from './auth.config'

declare module 'next-auth' {
  interface Session {
    user: {
      role: string
      email: string
      addresses?: ShippingAddress[]
    } & DefaultSession['user']
  }
  
  interface User {
    email: string
    role: string
    addresses?: ShippingAddress[]
  }
}



export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
  debug: process.env.NODE_ENV === 'production',
  pages: {
    signIn: '/sign-in',
    newUser: '/sign-up',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  adapter: undefined, // We'll implement a custom adapter if needed
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      credentials: {
        email: {
          type: 'text',
          placeholder: 'Email',
        },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (credentials == null || !credentials.email || typeof credentials.email !== 'string') {
            console.log('Invalid credentials provided')
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            console.log('User not found with email:', credentials.email)
            return null
          }

          if (user && user.password) {
            const isMatch = await bcrypt.compare(
              credentials.password as string,
              user.password
            )
            if (isMatch) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              }
            } else {
              console.log('Password mismatch for user:', credentials.email)
            }
          }
          return null
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      try {
        if (user) {
          console.log('JWT callback - user data:', user)
          console.log('JWT callback - user.email:', (user as { email: string }).email)
          if (!user.name) {
            try {
              await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    name: user.name || (user.email ? user.email : 'User'),
                    role: 'user',
                  }
                })
            } catch (updateError) {
              console.error('Failed to update user:', updateError)
            }
          }
          token.name = user.name || (user.email ? user.email : 'User')
          token.role = (user as { role: string }).role || 'user'
          token.email = (user as { email: string }).email
          console.log('JWT callback - token after update:', token)
          console.log('JWT callback - token.email set to:', token.email)
        }

        if (session?.user?.name && trigger === 'update') {
          token.name = session.user.name
        }
        if (session?.user?.email && trigger === 'update') {
          token.email = session.user.email
        }
        
        // Ensure email is always in token if it exists
        if (!token.email && user?.email) {
          token.email = user.email
        }
        
        // If we still don't have an email, try to get it from the database
        if (!token.email && token.sub) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.sub }
            })
            if (dbUser) {
              token.email = dbUser.email
              console.log('JWT callback - email found from database:', dbUser.email)
            }
          } catch (error) {
            console.error('Error fetching email from database:', error)
          }
        }
        
        console.log('JWT callback - final token:', token)
        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return token
      }
    },
    session: async ({ session, user, trigger, token }) => {
      try {
        console.log('Session callback - token data:', token)
        console.log('Session callback - user data:', user)
        console.log('Session callback - trigger:', trigger)
        
        if (token.sub) {
          session.user.id = token.sub
        }
        if (token.role) {
          session.user.role = token.role as string
        }
        if (token.name) {
          session.user.name = token.name as string
        }
        if (token.email) {
          session.user.email = token.email as string
          console.log('Session callback - email set from token:', token.email)
        } else {
          console.log('Session callback - no email in token')
        }
        if (trigger === 'update' && user?.name) {
          session.user.name = user.name
        }
        if (trigger === 'update' && user?.email) {
          session.user.email = user.email
        }
        console.log('Session callback - final session:', session)
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    },
  },
})

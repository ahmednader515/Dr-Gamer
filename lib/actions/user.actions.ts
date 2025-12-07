'use server'

import bcrypt from 'bcryptjs'
import { auth, signIn, signOut } from '@/auth'
import { IUserName, IUserSignIn, IUserSignUp } from '@/types'
import { UserSignUpSchema, UserUpdateSchema } from '../validator'
import { prisma } from '@/lib/prisma'
import { formatError } from '../utils'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import data from '../data'

// CREATE
export async function registerUser(userSignUp: IUserSignUp) {
  try {
    const user = await UserSignUpSchema.parseAsync({
      name: userSignUp.name,
      email: userSignUp.email,
      password: userSignUp.password,
      confirmPassword: userSignUp.confirmPassword,
    })

    // Always use database

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (existingUser) {
      return { success: false, error: 'An account with this email already exists. Please log in instead.' }
    }

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: await bcrypt.hash(user.password, 5),
        role: 'User',
      }
    })
    return { success: true, message: 'User created successfully' }
  } catch (error) {
    // Handle specific validation errors
    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        return { success: false, error: 'Please check your inputs and make sure all fields are filled correctly.' }
      }
      if (error.message.includes('unique constraint')) {
        return { success: false, error: 'An account with this email already exists. Please log in instead.' }
      }
      if (error.message.includes('database')) {
        return { success: false, error: 'Database connection error. Please try again later.' }
      }
    }
    
    return { success: false, error: formatError(error) }
  }
}

// DELETE

export async function deleteUser(id: string) {
  try {
    const res = await prisma.user.delete({
      where: { id }
    })
    if (!res) throw new Error('User not found')
    revalidatePath('/admin/users')
    return {
      success: true,
      message: 'User deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
// UPDATE

export async function updateUser(user: z.infer<typeof UserUpdateSchema>) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: user._id },
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
      }
    })
    revalidatePath('/admin/users')
    return {
      success: true,
      message: 'Name updated successfully',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE USER NAME
export async function updateUserName(user: IUserName) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'يجب تسجيل الدخول أولاً' }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session?.user?.id },
      data: {
        name: user.name,
      }
    })
    return {
      success: true,
      message: 'Name updated successfully',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE USER EMAIL
export async function updateUserEmail(user: { email: string }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'يجب تسجيل الدخول أولاً' }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session?.user?.id },
      data: {
        email: user.email,
      }
    })
    return {
      success: true,
      message: 'Email updated successfully',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE USER PASSWORD
export async function updateUserPassword(user: { 
  currentPassword: string
  newPassword: string 
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'يجب تسجيل الدخول أولاً' }
    }

    // First verify the current password
    const currentUser = await prisma.user.findUnique({
      where: { id: session?.user?.id }
    })
    
    if (!currentUser) {
      return { success: false, message: 'User not found' }
    }
    
    const isCurrentPasswordValid = await bcrypt.compare(user.currentPassword, currentUser.password)
    if (!isCurrentPasswordValid) {
      return { success: false, message: 'Current password is incorrect' }
    }
    
    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(user.newPassword, 5)
    
    // Update the password
    const updatedUser = await prisma.user.update({
      where: { id: session?.user?.id },
      data: {
        password: hashedNewPassword,
      }
    })
    return {
      success: true,
      message: 'Password changed successfully',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function signInWithCredentials(user: IUserSignIn) {
  try {
    console.log('🔐 Attempting sign in with email:', user.email)
    
    const result = await signIn('credentials', { 
      email: user.email,
      password: user.password,
      redirect: false 
    })
    
    console.log('📋 Sign in result:', result)
    console.log('📋 Result type:', typeof result)
    console.log('📋 Result constructor:', result?.constructor?.name)
    console.log('📋 Result length:', result?.length)
    console.log('📋 Result keys:', result ? Object.keys(result) : 'null/undefined')
    console.log('📋 Result toString:', result?.toString())
    console.log('📋 Result valueOf:', result?.valueOf())
    
    if (result?.error) {
      console.log('❌ Sign in failed with error:', result.error)
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Invalid email or password'
      
      if (result.error.includes('CredentialsSignin')) {
        errorMessage = 'Invalid email or password'
      } else if (result.error.includes('Callback')) {
        errorMessage = 'Authentication error. Please try again'
      } else if (result.error.includes('OAuth')) {
        errorMessage = 'Login error. Please try again'
      } else if (result.error.includes('Configuration')) {
        errorMessage = 'System configuration error. Please try again'
      } else if (result.error.includes('AccessDenied')) {
        errorMessage = 'Access denied. Please check your credentials'
      }
      
      return { 
        success: false, 
        message: errorMessage,
        error: result.error 
      }
    }
    
    if (result?.ok) {
      console.log('✅ Sign in successful, waiting for session...')
      
      // Wait a bit for the session to be established
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Check if we can get the session to confirm authentication
      try {
        const session = await auth()
        if (session?.user) {
          console.log('✅ Session confirmed for user:', session.user.name)
          return { 
            success: true, 
            message: 'Logged in successfully' 
          }
        } else {
          console.log('⚠️ Sign in succeeded but no session found')
          // Even if no session, if signIn returned ok, we should consider it successful
          // The session might take a moment to propagate
          return { 
            success: true, 
            message: 'Logged in successfully' 
          }
        }
      } catch (sessionError) {
        console.log('⚠️ Could not verify session, but sign in returned ok')
        // If we can't verify the session but signIn succeeded, assume it worked
        return { 
          success: true, 
          message: 'تم تسجيل الدخول بنجاح' 
        }
      }
    }
    
    // Handle case where signIn returns a URL (redirect case)
    if (typeof result === 'string' && result.includes('http')) {
      console.log('⚠️ Sign in returned URL, checking if authentication succeeded...')
      
      // If we get a URL, it might mean the sign-in succeeded but NextAuth is trying to redirect
      // Let's wait a bit longer for the session to be established
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Check if we can get a session to confirm authentication
      try {
        const session = await auth()
        if (session?.user) {
          console.log('✅ Session found after URL redirect, sign in successful')
          return { 
            success: true, 
            message: 'Logged in successfully' 
          }
        } else {
          console.log('⚠️ No session found after URL redirect, but this might be normal')
          // In some cases, NextAuth returns a URL even when authentication succeeds
          // Let's give it a bit more time and check again
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          try {
            const session2 = await auth()
            if (session2?.user) {
              console.log('✅ Session found on second attempt after URL redirect')
              return { 
                success: true, 
                message: 'Logged in successfully' 
              }
            }
          } catch (sessionError2) {
            console.log('⚠️ Could not verify session on second attempt')
          }
          
          // If we still can't get a session, assume it failed
          return { 
            success: false, 
            message: 'Login failed. Please try again' 
          }
        }
      } catch (sessionError) {
        console.log('⚠️ Could not verify session after URL redirect')
        return { 
          success: false, 
          message: 'Login failed. Please try again' 
        }
      }
    }
    
    // Handle case where signIn returns an empty object or unexpected result
    if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
      console.log('⚠️ Sign in returned empty result, checking if authentication succeeded...')
      
      // Wait a bit for the session to be established
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if we can get a session to confirm authentication
      try {
        const session = await auth()
        if (session?.user) {
          console.log('✅ Session found after empty result, sign in successful')
          return { 
            success: true, 
            message: 'Logged in successfully' 
          }
        } else {
          console.log('⚠️ No session found after empty result')
          return { 
            success: false, 
            message: 'Login failed. Please try again' 
          }
        }
      } catch (sessionError) {
        console.log('⚠️ Could not verify session after empty result')
        return { 
          success: false, 
          message: 'Login failed. Please try again' 
        }
      }
    }
    
    console.log('⚠️ Sign in returned unexpected result:', result)
    return { 
      success: false, 
      message: 'Login failed. Please try again' 
    }
  } catch (error) {
    console.log('💥 Sign in error caught:', error)
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'An unexpected error occurred during login'
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again'
      } else if (error.message.includes('credentials')) {
        errorMessage = 'Invalid credentials. Please check your email and password'
      } else if (error.message.includes('network')) {
        errorMessage = 'Connection error. Please check your internet connection'
      } else {
        errorMessage = error.message || 'Authentication failed. Please try again'
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }
    
    return { 
      success: false, 
      message: errorMessage,
      error: formatError(error)
    }
  }
}
export const SignInWithGoogle = async () => {
  await signIn('google')
}
export const SignOut = async () => {
  try {
    const result = await signOut({ redirect: false })
    return { success: true, result }
  } catch (error) {
    console.error('Sign out error:', error)
    return { success: false, error: formatError(error) }
  }
}

// GET
export async function getAllUsers({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = data.settings[0];
  limit = limit || pageSize

  const skipAmount = (Number(page) - 1) * limit
  
  // Batch fetch users and count in parallel
  const [users, usersCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: skipAmount,
      take: limit
    }),
    prisma.user.count()
  ])
  
  return {
    data: JSON.parse(JSON.stringify(users)),
    totalPages: Math.ceil(usersCount / limit),
  }
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  if (!user) throw new Error('User not found')
  return JSON.parse(JSON.stringify(user))
}

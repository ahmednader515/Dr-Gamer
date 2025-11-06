'use server'

import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function requestPasswordReset(email: string) {
  try {
    console.log('🔐 Password reset requested for:', email)
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    console.log('👤 User found:', !!user)

    if (!user) {
      console.log('⚠️ User not found, returning generic message for security')
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      }
    }

    // Check if user has a password (not OAuth user)
    if (!user.password) {
      return {
        success: false,
        message: 'This account uses social login. Please sign in with your social provider.',
      }
    }

    // Generate unique reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    // Create new reset token (expires in 1 hour)
    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      },
    })

    // Send reset email
    console.log('📧 Attempting to send reset email to:', user.email)
    const emailResult = await sendPasswordResetEmail({
      email: user.email,
      resetToken,
      userName: user.name,
    })

    console.log('📧 Email result:', emailResult)

    if (!emailResult.success) {
      console.error('❌ Failed to send reset email')
      return {
        success: false,
        message: 'Failed to send reset email. Please try again later.',
      }
    }

    console.log('✅ Password reset email sent successfully')
    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    }
  } catch (error) {
    console.error('❌ Password reset request error:', error)
    return {
      success: false,
      message: 'An error occurred. Please try again later.',
    }
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    })

    if (!resetToken) {
      return {
        success: false,
        message: 'Invalid or expired reset token.',
      }
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      })

      return {
        success: false,
        message: 'Reset token has expired. Please request a new one.',
      }
    }

    // Validate new password
    if (newPassword.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long.',
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    })

    // Delete the used reset token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    })

    return {
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      message: 'An error occurred while resetting your password. Please try again.',
    }
  }
}

export async function verifyResetToken(token: string) {
  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
    })

    if (!resetToken) {
      return { valid: false, message: 'Invalid reset token.' }
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      })
      return { valid: false, message: 'Reset token has expired.' }
    }

    return { valid: true }
  } catch (error) {
    console.error('Token verification error:', error)
    return { valid: false, message: 'An error occurred.' }
  }
}


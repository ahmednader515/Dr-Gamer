'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { resetPassword, verifyResetToken } from '@/lib/actions/password-reset.actions'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/loading-overlay'
import Link from 'next/link'

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setIsTokenValid(false)
        setErrorMessage('Invalid reset link. Please request a new password reset.')
        setIsVerifying(false)
        return
      }

      const result = await verifyResetToken(token)
      setIsTokenValid(result.valid)
      if (!result.valid) {
        setErrorMessage(result.message || 'Invalid or expired reset token.')
      }
      setIsVerifying(false)
    }

    verifyToken()
  }, [token])

  async function onSubmit(data: ResetPasswordFormData) {
    if (!token) return

    setIsLoading(true)
    setErrorMessage('')

    const result = await resetPassword(token, data.password)

    setIsLoading(false)

    if (result.success) {
      setSuccessMessage(result.message)
      setTimeout(() => {
        router.push('/sign-in')
      }, 3000)
    } else {
      setErrorMessage(result.message)
    }
  }

  if (isVerifying) {
    return (
      <div className='text-center py-12'>
        <LoadingSpinner size='lg' />
        <p className='text-gray-400 mt-4'>Verifying reset link...</p>
      </div>
    )
  }

  if (!isTokenValid) {
    return (
      <div className='text-center py-8'>
        <div className='w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
          <AlertCircle className='h-8 w-8 text-red-500' />
        </div>
        <h2 className='text-2xl font-bold text-white mb-2'>
          Invalid Reset Link
        </h2>
        <p className='text-gray-400 mb-6'>
          {errorMessage}
        </p>
        <Link href='/forgot-password'>
          <Button className='w-full bg-purple-600 hover:bg-purple-700'>
            Request New Reset Link
          </Button>
        </Link>
      </div>
    )
  }

  if (successMessage) {
    return (
      <div className='text-center py-8'>
        <div className='w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
          <CheckCircle className='h-8 w-8 text-green-500' />
        </div>
        <h2 className='text-2xl font-bold text-white mb-2'>
          Password Reset Successful!
        </h2>
        <p className='text-gray-400 mb-6'>
          {successMessage}
        </p>
        <p className='text-sm text-gray-500'>
          Redirecting you to sign in page...
        </p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-white'>New Password</FormLabel>
              <FormControl>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Enter your new password'
                    className='pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500'
                    disabled={isLoading}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300'
                  >
                    {showPassword ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-white'>Confirm New Password</FormLabel>
              <FormControl>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='Confirm your new password'
                    className='pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500'
                    disabled={isLoading}
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300'
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorMessage && (
          <div className='bg-red-500/10 border border-red-500/50 rounded-lg p-3'>
            <p className='text-red-400 text-sm'>{errorMessage}</p>
          </div>
        )}

        <div className='bg-gray-800 border border-gray-700 rounded-lg p-4'>
          <p className='text-sm text-gray-300 font-medium mb-2'>Password Requirements:</p>
          <ul className='text-sm text-gray-400 space-y-1 list-disc list-inside'>
            <li>At least 6 characters long</li>
            <li>Must match the confirmation password</li>
          </ul>
        </div>

        <Button
          type='submit'
          disabled={isLoading}
          className='w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 rounded-lg transition-colors duration-200'
        >
          {isLoading ? (
            <div className='flex items-center gap-2'>
              <LoadingSpinner size='sm' />
              <span>Resetting Password...</span>
            </div>
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>
    </Form>
  )
}


'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { requestPasswordReset } from '@/lib/actions/password-reset.actions'
import { Mail, CheckCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/loading-overlay'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true)
    setErrorMessage('')

    const result = await requestPasswordReset(data.email)

    setIsLoading(false)

    if (result.success) {
      setIsSubmitted(true)
    } else {
      setErrorMessage(result.message)
    }
  }

  if (isSubmitted) {
    return (
      <div className='text-center py-8'>
        <div className='w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
          <CheckCircle className='h-8 w-8 text-green-500' />
        </div>
        <h2 className='text-2xl font-bold text-white mb-2'>
          Check Your Email
        </h2>
        <p className='text-gray-400 mb-6'>
          We've sent a password reset link to{' '}
          <span className='text-white font-medium'>{form.getValues('email')}</span>
        </p>
        <div className='bg-gray-800 border border-gray-700 rounded-lg p-4 text-left'>
          <p className='text-sm text-gray-300 mb-2'>
            <strong className='text-white'>Didn't receive the email?</strong>
          </p>
          <ul className='text-sm text-gray-400 space-y-1 list-disc list-inside'>
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes and try again</li>
          </ul>
        </div>
        <Button
          onClick={() => setIsSubmitted(false)}
          variant='outline'
          className='mt-6 w-full'
        >
          Try Another Email
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-white'>Email Address</FormLabel>
              <FormControl>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                  <Input
                    {...field}
                    type='email'
                    placeholder='Enter your email'
                    className='pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500'
                    disabled={isLoading}
                  />
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

        <Button
          type='submit'
          disabled={isLoading}
          className='w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 rounded-lg transition-colors duration-200'
        >
          {isLoading ? (
            <div className='flex items-center gap-2'>
              <LoadingSpinner size='sm' />
              <span>Sending Reset Link...</span>
            </div>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>
    </Form>
  )
}


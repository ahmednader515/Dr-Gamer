'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import data from '@/lib/data'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { IUserSignIn } from '@/types'
import { signInWithCredentials } from '@/lib/actions/user.actions'

import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSignInSchema } from '@/lib/validator'
import { useState, useEffect } from 'react'
import PhoneInput from '@/components/shared/phone-input'

const signInDefaultValues = { phone: '', password: '' };

export default function CredentialsSignInForm() {
  const { site } = data.settings[0];
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: session, status } = useSession()

  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: signInDefaultValues,
  })

  // Auto-redirect when session becomes available
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('Session detected, redirecting to:', callbackUrl)
      // Use replace to avoid adding to browser history
      router.replace(callbackUrl)
    }
  }, [status, session, router, callbackUrl])

  const { control, handleSubmit, formState: { errors } } = form

  const onSubmit = async (formData: IUserSignIn) => {
    if (isSubmitting) return // Prevent double submission
    
    setIsSubmitting(true)
    
    // Add a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (isSubmitting) {
        setIsSubmitting(false)
        toast({
          title: 'Request Timeout',
          description: 'Sign in took too long. Please try again.',
          variant: 'destructive',
        })
      }
    }, 30000) // 30 seconds timeout
    
    try {
      console.log('Attempting sign in with phone:', formData.phone)
      
      const result = await signInWithCredentials({
        phone: formData.phone,
        password: formData.password,
      })
      
      clearTimeout(timeoutId) // Clear timeout on success
      console.log('Sign in result:', result)
      console.log('Result type:', typeof result)
      console.log('Result keys:', result ? Object.keys(result) : 'null/undefined')
      
      if (!result.success) {
        console.log('⚠️ Sign in reported failure:', result.message)
        console.log('Result details:', { type: typeof result, keys: result ? Object.keys(result) : 'none' })
        
        // Clear password field on failed attempt
        form.setValue('password', '')
        
        // Check if we might actually be signed in despite the error
        // This can happen when NextAuth returns unexpected responses
        try {
          const sessionResponse = await fetch('/api/auth/session')
          const sessionData = await sessionResponse.json()
          
          if (sessionData?.user) {
            console.log('✅ Session found despite error, sign in actually succeeded')
            toast({
              title: 'Sign In Successful!',
              description: 'Welcome! Redirecting...',
              variant: 'default',
            })
            
            // Redirect to the callback URL
            router.replace(callbackUrl)
            return
          }
        } catch (sessionCheckError) {
          console.log('Could not check session, proceeding with error')
        }
        
        toast({
        title: 'Sign In Failed',
        description: result.message || 'Sign in failed. Please try again.',
          variant: 'destructive',
        })
        return
      }
      
      // Successfully signed in
      toast({
        title: 'Sign In Successful!',
        description: 'Welcome! Redirecting...',
        variant: 'default',
      })
      
      // Wait a moment for the session to propagate, then check if we can redirect
      console.log('Sign in successful, waiting for session to propagate...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Try to get the session to confirm it's ready
      try {
        const session = await fetch('/api/auth/session').then(res => res.json())
        if (session?.user) {
          console.log('Session confirmed, redirecting to:', callbackUrl)
          router.replace(callbackUrl)
        } else {
          console.log('Session not ready yet, useEffect will handle redirect')
        }
      } catch (error) {
        console.log('Could not verify session, useEffect will handle redirect')
      }
      
    } catch (error) {
      clearTimeout(timeoutId) // Clear timeout on error
      console.log('⚠️ Sign in error caught:', error)
      
      // Clear password field on error
      form.setValue('password', '')
      
      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again.'
        } else if (error.message.includes('validation')) {
          errorMessage = 'Please check your input and try again.'
        } else if (error.message.includes('credentials')) {
          errorMessage = 'Invalid credentials. Please check your phone number and password.'
        }
      }
      
      toast({
        title: 'Sign In Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while session is being checked
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-cairo">Checking session...</p>
          <p className="text-sm text-gray-500 font-cairo mt-2">Please wait...</p>
        </div>
      </div>
    )
  }

  // If already authenticated, show redirecting message
  if (status === 'authenticated' && session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-cairo">Sign in successful! Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} dir="ltr" className="font-cairo">
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
        
        {/* General form errors */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 text-center font-cairo">
              ⚠️ Please check the errors below and try again
            </p>
          </div>
        )}
        
        <div className='space-y-6 md:space-y-8 lg:space-y-10'>
          <FormField
            control={control}
            name='phone'
            render={({ field, fieldState }) => (
              <FormItem className='w-full'>
                <FormLabel className="text-left block font-cairo text-white text-base md:text-lg lg:text-xl mb-2 md:mb-3 lg:mb-4">Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput 
                    placeholder='Enter phone number' 
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    className={`text-left font-cairo h-12 md:h-14 text-base md:text-lg px-4 md:px-6 ${
                      fieldState.error ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                </FormControl>
                <FormMessage />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-1 text-left font-cairo">
                    {fieldState.error.message}
                  </p>
                )}
                <p className="text-xs md:text-sm text-gray-300 mt-1 text-left font-cairo">
                  Example: +201234567890
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='password'
            render={({ field, fieldState }) => (
              <FormItem className='w-full'>
                <FormLabel className="text-left block font-cairo text-white text-base md:text-lg lg:text-xl mb-2 md:mb-3 lg:mb-4">Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Enter password'
                    {...field}
                    className={`text-left font-cairo h-12 md:h-14 text-base md:text-lg px-4 md:px-6 ${
                      fieldState.error ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                </FormControl>
                <FormMessage />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-1 text-left font-cairo">
                    {fieldState.error.message}
                  </p>
                )}
              </FormItem>
            )}
          />

          <div className="pt-4 md:pt-6">
            <Button 
              type='submit' 
              disabled={isSubmitting} 
              className="w-full font-cairo h-12 md:h-14 text-base md:text-lg relative"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-purple-50 border border-blue-200 rounded-lg">
                <p className="text-xs md:text-sm text-blue-800 text-center font-cairo">
                  💡 <strong>Test Data:</strong> You can use phone number +201234567890 and password 123456
                </p>
              </div>
            )}
          </div>
          
          <div className='text-sm md:text-base lg:text-lg text-left text-gray-300 font-cairo leading-relaxed'>
            By signing in, you agree to the{' '}
            <Link href='/page/conditions-of-use' className="text-purple-400 hover:underline">Terms of Use</Link> and{' '}
            <Link href='/page/privacy-policy' className="text-purple-400 hover:underline">Privacy Policy</Link> of {site.name}.
          </div>
        </div>
      </form>
    </Form>
  )
}

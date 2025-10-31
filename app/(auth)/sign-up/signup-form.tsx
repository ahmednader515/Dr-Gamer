'use client'
import { useRouter, useSearchParams } from 'next/navigation'

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
import { IUserSignUp } from '@/types'
import { registerUser, signInWithCredentials } from '@/lib/actions/user.actions'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSignUpSchema } from '@/lib/validator'
import { useState } from 'react'
import PhoneInput from '@/components/shared/phone-input'

const signUpDefaultValues = {
  name: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

export default function SignUpForm() {
  const { site } = data.settings[0];
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<IUserSignUp>({
    resolver: zodResolver(UserSignUpSchema),
    defaultValues: signUpDefaultValues,
  })

  const { control, handleSubmit } = form

  const onSubmit = async (data: IUserSignUp) => {
    if (isSubmitting) return // Prevent double submission
    
    setIsSubmitting(true)
    
    try {
      const res = await registerUser(data)
      if (!res.success) {
        // Handle specific error cases with descriptive messages
        let errorMessage = 'Failed to create account'
        
        if (res.error) {
          if (res.error.includes('already exists')) {
            errorMessage = 'An account with this number already exists. Please sign in instead.'
          } else if (res.error.includes('validation')) {
            errorMessage = 'Please check your input and try again.'
          } else {
            errorMessage = res.error
          }
        }
        
        toast({
          title: 'Sign Up Failed',
          description: errorMessage,
          variant: 'destructive',
        })
        return
      }
      
      // Show success message
      toast({
        title: 'Account Created Successfully!',
        description: 'Your account has been created. Signing you in...',
        variant: 'default',
      })
      
      // If user creation is successful, sign them in
      const signInResult = await signInWithCredentials({
        phone: data.phone,
        password: data.password,
      })
      
      if (signInResult?.error) {
        toast({
          title: 'Account Created',
          description: 'Account created successfully, but automatic sign-in failed. Please sign in manually.',
          variant: 'default',
        })
        // Redirect to sign in page
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`)
        return
      }
      
      // Successfully signed in, redirect
      router.push(callbackUrl)
    } catch (error) {
      console.error('Signup error:', error)
      
      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again.'
        } else if (error.message.includes('validation')) {
          errorMessage = 'Please check your input and try again.'
        }
      }
      
      toast({
        title: 'Sign Up Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} dir="ltr" className="font-cairo">
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
        <div className='space-y-6 md:space-y-8'>
          <FormField
            control={control}
            name='name'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className="text-left block font-cairo text-white text-base md:text-lg mb-2 md:mb-3">Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder='Enter your name' 
                    {...field} 
                    className="text-left font-cairo h-10 md:h-12 text-base md:text-lg px-3 md:px-4"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='phone'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className="text-left block font-cairo text-white text-base md:text-lg mb-2 md:mb-3">Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput 
                    placeholder='Enter phone number' 
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    className="text-left font-cairo h-10 md:h-12 text-base md:text-lg px-3 md:px-4"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='password'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className="text-left block font-cairo text-white text-base md:text-lg mb-2 md:mb-3">Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Enter password'
                    {...field}
                    className="text-left font-cairo h-10 md:h-12 text-base md:text-lg px-3 md:px-4"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className="text-left block font-cairo text-white text-base md:text-lg mb-2 md:mb-3">Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Re-enter password'
                    {...field}
                    className="text-left font-cairo h-10 md:h-12 text-base md:text-lg px-3 md:px-4"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="pt-3 md:pt-4">
            <Button type='submit' disabled={isSubmitting} className="w-full font-cairo h-10 md:h-12 text-base md:text-lg">
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
          
          <div className='text-sm md:text-base text-left text-gray-300 font-cairo leading-relaxed'>
            By creating an account, you agree to the{' '}
            <Link href='/page/conditions-of-use' className="text-purple-400 hover:underline">Terms of Use</Link> and{' '}
            <Link href='/page/privacy-policy' className="text-purple-400 hover:underline">Privacy Policy</Link> of {site.name}.
          </div>
        </div>
      </form>
    </Form>
  )
}

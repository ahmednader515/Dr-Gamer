'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

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
import { useToast } from '@/hooks/use-toast'
import { updateUserPassword } from '@/lib/actions/user.actions'

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(3, 'New password must be at least 3 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ['confirmPassword'],
})

export const PasswordForm = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const form = useForm<z.infer<typeof PasswordSchema>>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })
  const { toast } = useToast()

  async function onSubmit(values: z.infer<typeof PasswordSchema>) {
    try {
      const res = await updateUserPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      
      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        })
        return
      }
      
      toast({
        description: res.message,
      })
      
      router.push('/account/manage')
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while changing password',
      })
    }
  }
  
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-5'
      >
        <div className='flex flex-col gap-5'>
          <FormField
            control={form.control}
            name='currentPassword'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='font-bold'>Current Password</FormLabel>
                <FormControl>
                  <Input 
                    type='password'
                    placeholder='Enter current password'
                    {...field}
                    className='input-field'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name='newPassword'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='font-bold'>New Password</FormLabel>
                <FormControl>
                  <Input 
                    type='password'
                    placeholder='Enter new password'
                    {...field}
                    className='input-field'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='font-bold'>Confirm New Password</FormLabel>
                <FormControl>
                  <Input 
                    type='password'
                    placeholder='Re-enter new password'
                    {...field}
                    className='input-field'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type='submit'
          size='lg'
          disabled={form.formState.isSubmitting}
          className='button col-span-2 w-full'
        >
          {form.formState.isSubmitting ? 'جاري الإرسال...' : 'حفظ التغييرات'}
        </Button>
      </form>
    </Form>
  )
}

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { PasswordForm } from './password-form'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import data from '@/lib/data'

export const metadata: Metadata = {
  title: 'Change Password',
}

export default async function ManagePasswordPage() {
  const session = await auth()
  if (!session) redirect('/sign-in')
  
  const { site } = data.settings[0];
  
  return (
    <div className='mb-24'>
      <div className='flex gap-2 '>
        <Link href='/account'>Your Account</Link>
        <span>›</span>
        <Link href='/account/manage'>Login & Security</Link>
        <span>›</span>
        <span>Change Password</span>
      </div>
      <h1 className='h1-bold py-4'>Change Password</h1>
      <Card className='max-w-2xl'>
        <CardContent className='p-4 flex justify-between flex-wrap'>
          <p className='text-sm py-2'>
            If you want to change your password for your {site.name} account,
            you can do so below. Make sure to click the Save Changes button when you are done.
          </p>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}

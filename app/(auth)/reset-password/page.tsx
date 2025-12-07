import { Metadata } from 'next'
import ResetPasswordForm from './reset-password-form'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reset Password',
}

export default function ResetPasswordPage() {
  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-12' style={{ background: 'linear-gradient(135deg, #0f0a1f 0%, #1a0f2e 50%, #2d1a5f 100%)' }}>
      <div className='w-full max-w-md'>
        {/* Back to Sign In */}
        <Link 
          href='/sign-in' 
          className='inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors duration-200 mb-6'
        >
          <ChevronLeft className='h-4 w-4' />
          <span>Back to Sign In</span>
        </Link>

        {/* Card */}
        <div className='bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800'>
          {/* Header */}
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-white mb-2'>
              Reset Your Password
            </h1>
            <p className='text-gray-400 text-sm'>
              Enter your new password below to reset your account password.
            </p>
          </div>

          {/* Form */}
          <ResetPasswordForm />
        </div>

        {/* Footer */}
        <p className='text-center text-sm text-gray-400 mt-6'>
          Remember your password?{' '}
          <Link href='/sign-in' className='text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200'>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}


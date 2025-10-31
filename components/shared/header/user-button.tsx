'use client'
import { useRouter } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOut } from '@/lib/actions/user.actions'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function UserButton({ 
  session, 
  translations 
}: { 
  session: any
  translations: {
    hello: string
    signIn: string
    accountOrders: string
    yourAccount: string
    yourOrders: string
    admin: string
    signOut: string
    newCustomer: string
    signUp: string
  }
}) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
    try {
      const result = await SignOut()
      // Refresh the page after successful sign-out
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if there's an error, refresh the page to clear any cached state
      window.location.reload()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className='flex gap-2 items-center'>
      <DropdownMenu>
        <DropdownMenuTrigger className='header-button' asChild>
          <div className='flex items-center'>
            <div className='flex flex-col text-xs text-left'>
              <span>
                {translations.hello},{' '}
                {session ? session.user.name : translations.signIn}
              </span>
              <span className='font-bold'>{translations.accountOrders}</span>
            </div>
            <ChevronDownIcon />
          </div>
        </DropdownMenuTrigger>
        {session ? (
          <DropdownMenuContent className='w-56 bg-gray-900 border-gray-700' align='end' forceMount style={{ fontFamily: 'Cairo, sans-serif' }}>
            <DropdownMenuLabel className='font-normal text-white'>
              <div className='flex flex-col space-y-1'>
                <p className='text-sm font-medium leading-none text-white'>
                  {session.user.name}
                </p>
                <p className='text-xs leading-none text-gray-300'>
                  {session.user.phone}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <Link className='w-full' href='/account'>
                <DropdownMenuItem className='text-gray-100 hover:text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white'>{translations.yourAccount}</DropdownMenuItem>
              </Link>
              <Link className='w-full' href='/account/orders'>
                <DropdownMenuItem className='text-gray-100 hover:text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white'>{translations.yourOrders}</DropdownMenuItem>
              </Link>

              {(session.user.role === 'Admin' || session.user.role === 'Moderator') && (
                <Link 
                  className='w-full' 
                  href={session.user.role === 'Admin' ? '/admin/overview' : '/admin/products'}
                >
                  <DropdownMenuItem className='text-purple-400 hover:text-purple-300 hover:bg-gray-800 focus:bg-gray-800 focus:text-purple-300'>
                    {session.user.role === 'Admin' ? translations.admin : 'Moderator Panel'}
                  </DropdownMenuItem>
                </Link>
              )}
            </DropdownMenuGroup>
            <DropdownMenuItem className='p-0 mb-1'>
              <Button
                className='w-full py-4 px-2 h-4 justify-start text-gray-100 hover:text-white hover:bg-gray-800'
                variant='ghost'
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? 'Signing out...' : translations.signOut}
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        ) : (
          <DropdownMenuContent className='w-56 bg-gray-900 border-gray-700' align='end' forceMount style={{ fontFamily: 'Cairo, sans-serif' }}>
            <DropdownMenuGroup>
              <DropdownMenuItem className='text-white hover:text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white'>
                <Link
                  className={cn(buttonVariants(), 'w-full bg-purple-600 hover:bg-purple-700 text-white')}
                  href='/sign-in'
                >
                  {translations.signIn}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuLabel className='text-white'>
              <div className='font-normal'>
                {translations.newCustomer}?{' '}
                <Link href='/sign-up' className='text-purple-400 hover:text-purple-300 underline'>{translations.signUp}</Link>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  )
}

'use client'
import React from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { SignOut } from '@/lib/actions/user.actions'

interface NavigationItem {
  name: string
  href: string
}

interface DesktopNavProps {
  navigation: NavigationItem[]
}

// Navigation translations
const navigationTranslations: { [key: string]: string } = {
  'Overview': 'Overview',
  'Products': 'Products',
  'Orders': 'Orders',
  'Users': 'Users',
  'Promo Codes': 'Promo Codes',
  'Web Pages': 'Web Pages',
  'FAQ': 'FAQ',
  'Settings': 'Settings',
}

// Default navigation if not provided
const defaultNavigation = [
  { name: 'Overview', href: '/admin/overview' },
  { name: 'Products', href: '/admin/products' },
  { name: 'Orders', href: '/admin/orders' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Promo Codes', href: '/admin/promo-codes' },
  { name: 'Web Pages', href: '/admin/web-pages' },
  { name: 'Settings', href: '/admin/settings' },
]

export default function DesktopNav({ navigation = defaultNavigation }: DesktopNavProps) {
  const handleSignOut = async () => {
    try {
      await SignOut()
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
      window.location.reload()
    }
  }

  return (
    <nav className='hidden md:flex items-center space-x-6'>
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className='text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800'
        >
          {navigationTranslations[item.name] || item.name}
        </Link>
      ))}
      {/* Desktop Sign Out Button */}
      <button
        onClick={handleSignOut}
        className='text-red-400 hover:text-red-200 hover:bg-red-900 transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2'
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </nav>
  )
}

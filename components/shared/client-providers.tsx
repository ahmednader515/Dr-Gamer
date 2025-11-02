'use client'
import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import useCartSidebar from '@/hooks/use-cart-sidebar'
import CartSidebar from './cart-sidebar'
import { ThemeProvider } from './theme-provider'
import { Toaster } from '../ui/toaster'
import AppInitializer from './app-initializer'
import data from '@/lib/data'

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  const visible = useCartSidebar()
  const pathname = usePathname()
  const setting = data.settings[0]
  
  // Check if we're on an admin route
  const isAdminRoute = pathname?.startsWith('/admin') ?? false
  // Use darker overlay for admin pages (0.6 instead of 0.3)
  const overlayOpacity = isAdminRoute ? 0.6 : 0.3

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <ThemeProvider>
        <AppInitializer setting={setting}>
          {visible ? (
            <div 
              className='min-h-screen mr-32'
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, ${overlayOpacity}), rgba(0, 0, 0, ${overlayOpacity})), url(/icons/background.jpeg)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
              }}
            >
              {children}
              <CartSidebar />
            </div>
          ) : (
            <div 
              className='min-h-screen'
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, ${overlayOpacity}), rgba(0, 0, 0, ${overlayOpacity})), url(/icons/background.jpeg)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
              }}
            >
              {children}
            </div>
          )}
          <Toaster />
        </AppInitializer>
      </ThemeProvider>
    </SessionProvider>
  )
}

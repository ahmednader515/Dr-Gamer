'use client'
import React from 'react'
import { SessionProvider } from 'next-auth/react'
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
  const setting = data.settings[0]

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <ThemeProvider>
        <AppInitializer setting={setting}>
          {visible ? (
            <div className='flex min-h-screen' style={{ backgroundColor: '#4618ac' }}>
              <div className='flex-1 overflow-hidden' style={{ backgroundColor: '#4618ac' }}>{children}</div>
              <CartSidebar />
            </div>
          ) : (
            <div className='min-h-screen' style={{ backgroundColor: '#4618ac' }}>{children}</div>
          )}
          <Toaster />
        </AppInitializer>
      </ThemeProvider>
    </SessionProvider>
  )
}

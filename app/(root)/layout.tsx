import React from 'react'

import Header from '@/components/shared/header'
import Footer from '@/components/shared/footer'
import HowToUseButton from '@/components/shared/how-to-use-button'
import PromoBar from '@/components/shared/promo-bar'
import { getActivePromoCodes } from '@/lib/actions/promo-code.actions'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const activePromoCodes = await getActivePromoCodes()
  const hasPromoCodes = activePromoCodes && activePromoCodes.length > 0
  
  return (
    <div className='flex flex-col min-h-screen'>
      <PromoBar />
      <Header hasPromoBar={hasPromoCodes} />
      <main className={`flex-1 flex flex-col p-4 ${hasPromoCodes ? 'pt-[216px] md:pt-[204px]' : 'pt-[172px] md:pt-[159px]'}`}>{children}</main>
      <Footer />
      <HowToUseButton />
    </div>
  )
}

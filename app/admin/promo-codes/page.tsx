import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PromoCodesList from './promo-codes-list'

export const metadata: Metadata = {
  title: 'Promo Codes - Admin Panel',
}

export default async function PromoCodesPage() {
  const session = await auth()
  
  if (session?.user.role !== 'Admin') {
    redirect('/')
  }

  const promoCodes = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return <PromoCodesList initialPromoCodes={promoCodes} />
}


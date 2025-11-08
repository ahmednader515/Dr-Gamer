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

  const [promoCodes, products] = await Promise.all([
    prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        applicableProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        name: true,
        price: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  const serializedPromoCodes = promoCodes.map((code) => ({
    id: code.id,
    code: code.code,
    discountPercent: code.discountPercent,
    isActive: code.isActive,
    expiresAt: code.expiresAt ? code.expiresAt.toISOString() : null,
    usageLimit: code.usageLimit,
    usageCount: code.usageCount,
    createdAt: code.createdAt.toISOString(),
    applicableProducts: code.applicableProducts.map((link) => ({
      productId: link.productId,
      maxDiscountAmount: link.maxDiscountAmount
        ? Number(link.maxDiscountAmount)
        : null,
      product: {
        id: link.product.id,
        name: link.product.name,
        price: Number(link.product.price),
      },
    })),
  }))

  const productOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
  }))

  return (
    <PromoCodesList
      initialPromoCodes={serializedPromoCodes}
      products={productOptions}
    />
  )
}


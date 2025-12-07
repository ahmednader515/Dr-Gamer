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

  const [promoCodes, products, categories] = await Promise.all([
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
                variations: true,
                categoryId: true,
                categoryRelation: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                category: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
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
        categoryId: true,
        categoryRelation: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
        variations: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  const extractVariationNames = (raw: any): string[] => {
    if (!raw) return []

    const normaliseToArray = (value: any): any[] => {
      if (!value) return []
      if (Array.isArray(value)) return value
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      if (typeof value === 'object') {
        if (Array.isArray((value as any).value)) return (value as any).value
        if (Array.isArray((value as any).data)) return (value as any).data
        const entries = Object.values(value)
        return Array.isArray(entries) ? entries : []
      }
      return []
    }

    const resolved = normaliseToArray(raw)

    return resolved
      .map((item) => {
        if (!item) return ''
        if (typeof item === 'string') return item.trim()
        if (typeof item === 'object') {
          if ('name' in item && typeof item.name === 'string') return item.name.trim()
          if ('label' in item && typeof item.label === 'string') return item.label.trim()
        }
        return ''
      })
      .filter((name) => Boolean(name))
  }

  const serializedPromoCodes = promoCodes.map((code) => ({
    id: code.id,
    code: code.code,
    discountPercent: code.discountPercent,
    isActive: code.isActive,
    expiresAt: code.expiresAt ? code.expiresAt.toISOString() : null,
    usageLimit: code.usageLimit,
    usageCount: code.usageCount,
    createdAt: code.createdAt.toISOString(),
    assignments: code.applicableProducts.map((link) => ({
      id: link.id,
      type: link.productId ? 'product' : 'category',
      product: link.product
        ? {
            id: link.product.id,
            name: link.product.name,
            price: Number(link.product.price),
            categoryId: link.product.categoryId,
            categoryName:
              link.product.categoryRelation?.name ??
              link.product.category ??
              'Uncategorized',
            variations: extractVariationNames(link.product.variations),
          }
        : null,
      category: link.category
        ? {
            id: link.category.id,
            name: link.category.name,
          }
        : null,
      variationNames: Array.isArray(link.variationNames)
        ? link.variationNames
        : [],
      maxDiscountAmount: link.maxDiscountAmount
        ? Number(link.maxDiscountAmount)
        : null,
    })),
  }))

  const productOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    categoryId: product.categoryId,
    categoryName:
      product.categoryRelation?.name ?? product.category ?? 'Uncategorized',
    variations: extractVariationNames(product.variations),
  }))

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }))

  return (
    <PromoCodesList
      initialPromoCodes={serializedPromoCodes}
      products={productOptions}
      categories={categoryOptions}
    />
  )
}


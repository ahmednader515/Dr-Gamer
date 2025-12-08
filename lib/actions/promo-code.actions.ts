'use server'

import { prisma } from '@/lib/prisma'

// GET ACTIVE PROMO CODES (for display in promo bar)
export async function getActivePromoCodes() {
  try {
    const now = new Date()
    
    // Get all active promo codes with their assignments
    const allPromoCodes = await prisma.promoCode.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      select: {
        id: true,
        code: true,
        discountPercent: true,
        expiresAt: true,
        usageLimit: true,
        usageCount: true,
        applicableProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
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
      orderBy: { createdAt: 'desc' },
    })

    // Filter out promo codes that have reached their usage limit
    const activePromoCodes = allPromoCodes.filter((promo) => {
      if (promo.usageLimit === null) {
        return true // No limit, always active
      }
      return promo.usageCount < promo.usageLimit
    })

    // Serialize the promo codes with assignments
    const serializedPromoCodes = activePromoCodes.map((promo) => ({
      id: promo.id,
      code: promo.code,
      discountPercent: promo.discountPercent,
      assignments: promo.applicableProducts.map((link) => ({
        id: link.id,
        type: link.productId ? 'product' : 'category',
        product: link.product
          ? {
              id: link.product.id,
              name: link.product.name,
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
      })),
    }))

    // Return all active promo codes (no limit)
    return JSON.parse(JSON.stringify(serializedPromoCodes))
  } catch (error) {
    console.error('Error getting active promo codes:', error)
    return []
  }
}


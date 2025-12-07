'use server'

import { prisma } from '@/lib/prisma'

// GET ACTIVE PROMO CODES (for display in promo bar)
export async function getActivePromoCodes() {
  try {
    const now = new Date()
    
    // Get all active promo codes
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

    // Return all active promo codes (no limit)
    return JSON.parse(JSON.stringify(activePromoCodes))
  } catch (error) {
    console.error('Error getting active promo codes:', error)
    return []
  }
}


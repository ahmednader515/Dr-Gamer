import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

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

const serializePromoCode = (promoCode: any) => ({
  id: promoCode.id,
  code: promoCode.code,
  discountPercent: promoCode.discountPercent,
  isActive: promoCode.isActive,
  expiresAt: promoCode.expiresAt ? promoCode.expiresAt.toISOString() : null,
  usageLimit: promoCode.usageLimit,
  usageCount: promoCode.usageCount,
  createdAt: promoCode.createdAt.toISOString(),
  assignments: (promoCode.applicableProducts || []).map((link: any) => ({
    id: link.id,
    type: link.productId ? 'product' : 'category',
    maxDiscountAmount: link.maxDiscountAmount
      ? Number(link.maxDiscountAmount)
      : null,
    variationNames: Array.isArray(link.variationNames)
      ? link.variationNames
      : [],
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
  })),
})

// GET all promo codes (Admin only)
export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        applicableProducts: {
          include: {
            product: {
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
    })

    return NextResponse.json({
      success: true,
      data: promoCodes.map(serializePromoCode),
    })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching promo codes' },
      { status: 500 }
    )
  }
}

// POST create new promo code (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { code, discountPercent, expiresAt, usageLimit, assignments } = body

    // Validation
    if (!code || !discountPercent) {
      return NextResponse.json(
        { success: false, message: 'الرجاء إدخال الكود ونسبة الخصم' },
        { status: 400 }
      )
    }

    if (discountPercent < 1 || discountPercent > 100) {
      return NextResponse.json(
        { success: false, message: 'Discount percentage must be between 1% and 100%' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (existingCode) {
      return NextResponse.json(
        { success: false, message: 'هذا الكود موجود بالفعل' },
        { status: 400 }
      )
    }

    const assignmentLinks = Array.isArray(assignments)
      ? assignments
          .map((assignment: any) => {
            if (!assignment || typeof assignment !== 'object') return null
            const { type, productId, categoryId, maxDiscountAmount, variationNames } =
              assignment as {
                type?: string
                productId?: string
                categoryId?: string
                maxDiscountAmount?: number | string | null
                variationNames?: string[]
              }

            const resolvedMaxDiscount =
              maxDiscountAmount !== null &&
              maxDiscountAmount !== undefined &&
              maxDiscountAmount !== '' &&
              !Number.isNaN(Number(maxDiscountAmount))
                ? new Prisma.Decimal(maxDiscountAmount as Prisma.Decimal.Value)
                : null

            if (type === 'product' && productId) {
              const variationList = Array.isArray(variationNames)
                ? Array.from(
                    new Set(
                      variationNames
                        .map((name) => (typeof name === 'string' ? name.trim() : ''))
                        .filter((name) => name.length > 0),
                    ),
                  )
                : []

              return {
                product: { connect: { id: productId } },
                variationNames: variationList,
                maxDiscountAmount: resolvedMaxDiscount,
              }
            }

            if (type === 'category' && categoryId) {
              return {
                category: { connect: { id: categoryId } },
                variationNames: [],
                maxDiscountAmount: resolvedMaxDiscount,
              }
            }

            return null
          })
          .filter((link): link is {
            product?: { connect: { id: string } }
            category?: { connect: { id: string } }
            variationNames: string[]
            maxDiscountAmount: Prisma.Decimal | null
          } => Boolean(link))
      : []

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discountPercent: parseInt(discountPercent, 10),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        applicableProducts: assignmentLinks.length
          ? {
              create: assignmentLinks,
            }
          : undefined,
      },
      include: {
        applicableProducts: {
          include: {
            product: {
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
    })

    return NextResponse.json({
      success: true,
      message: 'Promo code created successfully',
      data: serializePromoCode(promoCode),
    })
  } catch (error) {
    console.error('Error creating promo code:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating promo code' },
      { status: 500 }
    )
  }
}


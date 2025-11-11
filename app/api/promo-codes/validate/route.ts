import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const serializeAssignments = (links: any[]) =>
  links.map((link) => ({
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
          categoryName:
            link.product.categoryRelation?.name ??
            link.product.category ??
            'Uncategorized',
        }
      : null,
    category: link.category
      ? {
          id: link.category.id,
          name: link.category.name,
        }
      : null,
  }))

// POST validate promo code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, items = [] } = body

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'الرجاء إدخال كود الخصم' },
        { status: 400 }
      )
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
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

    if (!promoCode) {
      return NextResponse.json(
        { success: false, message: 'Invalid promo code' },
        { status: 404 }
      )
    }

    // Check if active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { success: false, message: 'This code is not active' },
        { status: 400 }
      )
    }

    // Check if expired
    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'هذا الكود منتهي الصلاحية' },
        { status: 400 }
      )
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      return NextResponse.json(
        { success: false, message: 'This code has been fully used' },
        { status: 400 }
      )
    }

    const assignmentsRaw = promoCode.applicableProducts || []
    if (assignmentsRaw.length > 0) {
      const cartItems = Array.isArray(items) ? items : []

      const assignmentsForCheck = assignmentsRaw.map((assignment) => ({
        type: assignment.productId ? 'product' : 'category',
        productId: assignment.productId || undefined,
        categoryId: assignment.categoryId || undefined,
        categoryName: assignment.category?.name || undefined,
        variationNames: Array.isArray(assignment.variationNames)
          ? assignment.variationNames.map((name: any) =>
              typeof name === 'string' ? name.trim().toLowerCase() : '',
            )
          : [],
      }))

      const hasEligibleItem = cartItems.some((item: any) => {
        const productId = String(
          item?.productId || item?.product || item?.id || '',
        ).trim()
        if (!productId) return false

        const categoryId = item?.categoryId ? String(item.categoryId).trim() : ''
        const categoryName = item?.categoryName
          ? String(item.categoryName).trim().toLowerCase()
          : ''
        const selectedVariation = item?.selectedVariation
          ? String(item.selectedVariation).trim().toLowerCase()
          : ''

        return assignmentsForCheck.some((assignment) => {
          if (assignment.type === 'product' && assignment.productId) {
            if (assignment.productId !== productId) return false
            if (assignment.variationNames.length === 0) return true
            return assignment.variationNames.includes(selectedVariation)
          }
          if (assignment.type === 'category') {
            if (assignment.categoryId && categoryId) {
              return assignment.categoryId === categoryId
            }
            if (assignment.categoryName && categoryName) {
              return assignment.categoryName === categoryName
            }
          }
          return false
        })
      })

      if (!hasEligibleItem) {
        return NextResponse.json(
          {
            success: false,
            message:
              'This promo code is restricted to specific products or categories that are not in your cart.',
          },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `${promoCode.discountPercent}% discount applied`,
      data: {
        code: promoCode.code,
        discountPercent: promoCode.discountPercent,
        assignments: serializeAssignments(assignmentsRaw),
      },
    })
  } catch (error) {
    console.error('Error validating promo code:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while validating the code' },
      { status: 500 }
    )
  }
}


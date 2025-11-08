import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const serializeApplicableProducts = (products: any[]) =>
  products.map((link) => ({
    productId: link.productId,
    productName: link.product?.name ?? '',
    maxDiscountAmount: link.maxDiscountAmount
      ? Number(link.maxDiscountAmount)
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

    const applicableProducts = promoCode.applicableProducts || []
    if (applicableProducts.length > 0) {
      const cartItems = Array.isArray(items) ? items : []
      const cartProductIds = new Set(
        cartItems
          .map((item: any) => item?.productId || item?.product || item?.id)
          .filter(Boolean)
          .map(String),
      )
      const eligibleProducts = applicableProducts.filter((product) =>
        cartProductIds.has(product.productId),
      )

      if (eligibleProducts.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'This promo code is restricted to specific products that are not in your cart.',
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
        applicableProducts: serializeApplicableProducts(applicableProducts),
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


import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

const serializePromoCode = (promoCode: any) => ({
  id: promoCode.id,
  code: promoCode.code,
  discountPercent: promoCode.discountPercent,
  isActive: promoCode.isActive,
  expiresAt: promoCode.expiresAt ? promoCode.expiresAt.toISOString() : null,
  usageLimit: promoCode.usageLimit,
  usageCount: promoCode.usageCount,
  createdAt: promoCode.createdAt.toISOString(),
  applicableProducts: (promoCode.applicableProducts || []).map((link: any) => ({
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
    const { code, discountPercent, expiresAt, usageLimit, products } = body

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

    const productLinks = Array.isArray(products)
      ? products
          .filter(
            (product: any) => product && typeof product.productId === 'string',
          )
          .map((product: any) => ({
            product: { connect: { id: product.productId } },
            maxDiscountAmount:
              product.maxDiscountAmount !== null &&
              product.maxDiscountAmount !== undefined &&
              product.maxDiscountAmount !== ''
                ? new Prisma.Decimal(product.maxDiscountAmount)
                : null,
          }))
      : []

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discountPercent: parseInt(discountPercent, 10),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        applicableProducts: productLinks.length
          ? {
              create: productLinks,
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


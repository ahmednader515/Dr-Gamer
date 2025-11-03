import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// POST validate promo code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'الرجاء إدخال كود الخصم' },
        { status: 400 }
      )
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
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

    return NextResponse.json({
      success: true,
      message: `${promoCode.discountPercent}% discount applied`,
      data: {
        code: promoCode.code,
        discountPercent: promoCode.discountPercent
      }
    })
  } catch (error) {
    console.error('Error validating promo code:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while validating the code' },
      { status: 500 }
    )
  }
}


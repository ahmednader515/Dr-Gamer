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
        { success: false, message: 'كود الخصم غير صحيح' },
        { status: 404 }
      )
    }

    // Check if active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { success: false, message: 'هذا الكود غير نشط' },
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
        { success: false, message: 'تم استخدام هذا الكود بالكامل' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `تم تطبيق خصم ${promoCode.discountPercent}%`,
      data: {
        code: promoCode.code,
        discountPercent: promoCode.discountPercent
      }
    })
  } catch (error) {
    console.error('Error validating promo code:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في التحقق من الكود' },
      { status: 500 }
    )
  }
}


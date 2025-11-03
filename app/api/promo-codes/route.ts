import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: promoCodes })
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
    const { code, discountPercent, expiresAt, usageLimit } = body

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

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discountPercent: parseInt(discountPercent),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Promo code created successfully',
      data: promoCode
    })
  } catch (error) {
    console.error('Error creating promo code:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating promo code' },
      { status: 500 }
    )
  }
}


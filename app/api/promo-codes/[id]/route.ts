import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// DELETE promo code (Admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    await prisma.promoCode.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'تم Delete كود الخصم بنجاح'
    })
  } catch (error) {
    console.error('Error deleting promo code:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في Delete كود الخصم' },
      { status: 500 }
    )
  }
}

// PATCH toggle active status (Admin only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const body = await request.json()

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: { isActive: body.isActive }
    })

    return NextResponse.json({
      success: true,
      message: 'تم تحديث حالة الكود بنجاح',
      data: promoCode
    })
  } catch (error) {
    console.error('Error updating promo code:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في تحديث الكود' },
      { status: 500 }
    )
  }
}


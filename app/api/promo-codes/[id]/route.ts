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
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    await prisma.promoCode.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Promo code deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting promo code:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting promo code' },
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
        { success: false, message: 'Unauthorized' },
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
      message: 'Code status updated successfully',
      data: promoCode
    })
  } catch (error) {
    console.error('Error updating promo code:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating the code' },
      { status: 500 }
    )
  }
}


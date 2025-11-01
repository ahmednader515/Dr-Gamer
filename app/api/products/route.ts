import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const idsParam = searchParams.get('ids')
    
    if (!idsParam) {
      return NextResponse.json({ error: 'No product IDs provided' }, { status: 400 })
    }

    const ids = idsParam.split(',').filter(Boolean)
    
    if (ids.length === 0) {
      return NextResponse.json([])
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        isPublished: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        price: true,
        listPrice: true,
        avgRating: true,
        numReviews: true,
        category: true,
        brand: true,
        productType: true,
        countInStock: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Reorder to match the input order
    const productMap = new Map(products.map(p => [p.id, p]))
    const orderedProducts = ids.map(id => productMap.get(id)).filter(Boolean)

    return NextResponse.json(orderedProducts)
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

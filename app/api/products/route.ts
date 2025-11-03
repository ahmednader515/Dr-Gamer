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
        platformType: true,
        productCategory: true,
        variations: true,
        countInStock: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Reorder to match the input order and parse variations
    const productMap = new Map(products.map(p => {
      // Parse variations if they're stored as JSON string
      let variations = null
      if (p.variations) {
        try {
          variations = typeof p.variations === 'string' 
            ? JSON.parse(p.variations as string)
            : p.variations
        } catch (e) {
          console.error('Error parsing variations:', e)
          variations = null
        }
      }
      
      return [p.id, { ...p, variations }]
    }))
    const orderedProducts = ids.map(id => productMap.get(id)).filter(Boolean)

    return NextResponse.json(orderedProducts)
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

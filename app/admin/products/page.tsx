import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ProductList from './product-list'

export const metadata: Metadata = {
  title: 'Admin Products',
}

export default async function AdminProduct() {
  const session = await auth()
  // Allow both Admin and Moderator
  if (session?.user.role !== 'Admin' && session?.user.role !== 'Moderator') {
    redirect('/')
  }

  // Direct database query for products
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      price: true,
      listPrice: true,
      originalPrice: true,
      category: true,
      countInStock: true,
      avgRating: true,
      isPublished: true,
      images: true,
      slug: true,
      updatedAt: true,
      variations: true,
    }
  })

  // Convert Decimal values to numbers for client components and parse variations
  const normalizedProducts = products.map(product => {
    let parsedVariations = null
    if (product.variations) {
      try {
        parsedVariations = typeof product.variations === 'string' 
          ? JSON.parse(product.variations)
          : product.variations
      } catch (e) {
        parsedVariations = null
      }
    }
    
    return {
      ...product,
      price: Number(product.price),
      listPrice: product.listPrice ? Number(product.listPrice) : undefined,
      originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
      avgRating: Number(product.avgRating),
      variations: parsedVariations,
    }
  })

  // Get total count for pagination
  const totalProducts = await prisma.product.count()

  return (
    <ProductList 
      initialProducts={normalizedProducts} 
      totalProducts={totalProducts}
    />
  )
}

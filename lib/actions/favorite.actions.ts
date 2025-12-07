'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function addToFavorites(productId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'You must be logged in to add favorites' }
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId,
        },
      },
    })

    if (existing) {
      return { error: 'Product is already in favorites' }
    }

    await prisma.favorite.create({
      data: {
        userId: session.user.id,
        productId: productId,
      },
    })

    revalidatePath('/favorites')
    return { success: true }
  } catch (error: any) {
    console.error('Error adding to favorites:', error)
    return { error: error.message || 'Failed to add to favorites' }
  }
}

export async function removeFromFavorites(productId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'You must be logged in to remove favorites' }
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        productId: productId,
      },
    })

    revalidatePath('/favorites')
    return { success: true }
  } catch (error: any) {
    console.error('Error removing from favorites:', error)
    return { error: error.message || 'Failed to remove from favorites' }
  }
}

export async function toggleFavorite(productId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'You must be logged in to toggle favorites' }
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId,
        },
      },
    })

    if (existing) {
      await prisma.favorite.delete({
        where: {
          id: existing.id,
        },
      })
      revalidatePath('/favorites')
      return { success: true, isFavorited: false }
    } else {
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          productId: productId,
        },
      })
      revalidatePath('/favorites')
      return { success: true, isFavorited: true }
    }
  } catch (error: any) {
    console.error('Error toggling favorite:', error)
    return { error: error.message || 'Failed to toggle favorite' }
  }
}

export async function getFavorites() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return favorites.map(fav => fav.product)
  } catch (error: any) {
    console.error('Error getting favorites:', error)
    return []
  }
}

export async function isProductFavorited(productId: string): Promise<boolean> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return false
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId,
        },
      },
    })

    return !!favorite
  } catch (error: any) {
    console.error('Error checking favorite:', error)
    return false
  }
}

export async function getFavoriteProductIds(): Promise<string[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        productId: true,
      },
    })

    return favorites.map(fav => fav.productId)
  } catch (error: any) {
    console.error('Error getting favorite product IDs:', error)
    return []
  }
}


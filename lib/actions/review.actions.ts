'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatError } from '../utils'
import { ReviewInputSchema } from '../validator'
//

export async function createUpdateReview({
  data,
  path,
}: {
  data: z.infer<typeof ReviewInputSchema>
  path: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('User is not authenticated')
    }

    const review = ReviewInputSchema.parse({
      ...data,
      user: session.user.id,
    })

    // Use transaction to batch operations
    const { product, wasUpdate } = await prisma.$transaction(async (tx) => {
      // Check if review exists first
      const existingReview = await tx.review.findFirst({
        where: {
          productId: review.product,
          userId: review.user,
        },
        select: { id: true }
      })

      // Update or create review
      if (existingReview) {
        await tx.review.update({
          where: { id: existingReview.id },
          data: {
            comment: review.comment,
            rating: review.rating,
            title: review.title,
            updatedAt: new Date(),
          }
        })
      } else {
        await tx.review.create({
          data: {
            userId: review.user,
            productId: review.product,
            isVerifiedPurchase: review.isVerifiedPurchase,
            rating: review.rating,
            title: review.title || '',
            comment: review.comment,
          }
        })
      }

      // Get product slug for revalidation and update stats in parallel
      const [productRecord] = await Promise.all([
        tx.product.findUnique({
          where: { id: review.product },
          select: { slug: true },
        }),
        updateProductReviewStatsInTx(tx, review.product)
      ])

      return { product: productRecord, wasUpdate: !!existingReview }
    })

    // Revalidate outside transaction
    if (product?.slug) {
      revalidatePath(`/product/${product.slug}`)
    }
    
    return {
      success: true,
      message: wasUpdate ? 'Review updated successfully' : 'Review created successfully',
    }
  } catch (error) {
    console.error('Review creation error:', error)
    return {
      success: false,
      message: formatError(error),
    }
  }
}

// Transaction-aware version for use within transactions
const updateProductReviewStatsInTx = async (tx: any, productId: string) => {
  try {
    // Use aggregate for better performance
    const stats = await tx.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { rating: true }
    })

    if (stats.length === 0) {
      await tx.product.update({
        where: { id: productId },
        data: {
          avgRating: 0,
          numReviews: 0,
          ratingDistribution: [],
        }
      })
      return
    }

    // Calculate from grouped stats
    let totalRating = 0
    let totalReviews = 0
    const ratingDistribution: any[] = []
    
    for (let i = 1; i <= 5; i++) {
      const stat = stats.find((s: any) => s.rating === i)
      const count = stat?._count?.rating || 0
      totalRating += i * count
      totalReviews += count
      ratingDistribution.push({ rating: i, count })
    }

    const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0
    
    await tx.product.update({
      where: { id: productId },
      data: {
        avgRating: parseFloat(avgRating.toFixed(1)),
        numReviews: totalReviews,
        ratingDistribution,
      }
    })
  } catch (error) {
    console.error('Error updating product review stats:', error)
  }
}

// Non-transaction version for backward compatibility
const updateProductReviewStats = async (productId: string) => {
  await updateProductReviewStatsInTx(prisma, productId)
}

export async function getReviews({
  productId,
  limit = 10,
  page = 1,
}: {
  productId: string
  limit?: number
  page?: number
}) {
  try {
    const skipAmount = (page - 1) * limit
    
    // Get reviews with user information
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { 
            name: true,
            id: true 
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: skipAmount,
      take: limit,
    })

    // Get total count for pagination
    const totalReviews = await prisma.review.count({
      where: { productId }
    })

    const totalPages = Math.ceil(totalReviews / limit)

    // Transform reviews to match expected format
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      product: review.productId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt.toISOString(),
      user: {
        name: review.user.name,
        id: review.userId,
      }
    }))

    return {
      data: transformedReviews,
      totalPages: totalPages === 0 ? 1 : totalPages,
      totalReviews,
    }
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return {
      data: [],
      totalPages: 1,
      totalReviews: 0,
    }
  }
}

export const getUserReviewForProduct = async (productId: string) => {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return null
    }
    
    const review = await prisma.review.findFirst({
      where: {
        productId,
        userId: session.user.id,
      },
    })
    
    return review
  } catch (error) {
    console.error('Error fetching user review:', error)
    return null
  }
}

export const deleteReview = async (reviewId: string, path: string) => {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('User is not authenticated')
    }

    // Get the review to check ownership and get productId
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true, productId: true }
    })

    if (!review) {
      throw new Error('Review not found')
    }

    if (review.userId !== session.user.id) {
      throw new Error('You can only delete your own reviews')
    }

    // Use transaction to batch operations
    const product = await prisma.$transaction(async (tx) => {
      // Delete the review
      await tx.review.delete({
        where: { id: reviewId }
      })

      // Update product review stats (within transaction)
      await updateProductReviewStatsInTx(tx, review.productId)

      // Get product slug for revalidation (within transaction)
      const productRecord = await tx.product.findUnique({
        where: { id: review.productId },
        select: { slug: true },
      })

      return productRecord
    })

    // Revalidate outside transaction
    if (product?.slug) {
      revalidatePath(`/product/${product.slug}`)
    }
    return {
      success: true,
      message: 'Review deleted successfully',
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    }
  }
}

'use client'

import { useState } from 'react'
import Rating from '@/components/shared/product/rating'
import AddToCart from '@/components/shared/product/add-to-cart'
import { Separator } from '@/components/ui/separator'
import { getVariationPricing } from '@/lib/utils'

interface ProductDetailsProps {
  product: any
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedVariation, setSelectedVariation] = useState<string>('')
  
  // Check if product has variations (new system)
  const hasVariations = product.variations && Array.isArray(product.variations) && product.variations.length > 0
  
  // Calculate selected price from variations
  const selectedPrice = selectedVariation && hasVariations
    ? (() => {
        const variation = product.variations.find((v: any) => v.name === selectedVariation)
        if (!variation) return null
        const pricing = getVariationPricing(variation)
        return pricing.currentPrice
      })()
    : null

  const variationPricingDetails = hasVariations
    ? product.variations.map((variation: any) => ({
        variation,
        pricing: getVariationPricing(variation),
      }))
    : []

  const currentPrices = variationPricingDetails.length
    ? variationPricingDetails.map((entry) => entry.pricing.currentPrice || 0)
    : []

  const minCurrentPrice = currentPrices.length ? Math.min(...currentPrices) : Number(product.price)
  const maxCurrentPrice = currentPrices.length ? Math.max(...currentPrices) : Number(product.listPrice)

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Product Title & Rating */}
      <div>
        <h1 className='text-2xl sm:text-3xl font-bold mb-2'>{product.name}</h1>
        <div className='flex items-center gap-2 mb-3 sm:mb-4'>
          <Rating rating={product.avgRating} />
          <span className='text-xs sm:text-sm text-muted-foreground'>
            ({product.numReviews} reviews)
          </span>
        </div>
        
        {/* Price Display - New System */}
        {hasVariations ? (
          // Product with variations - show selected price or range
          <div>
            {selectedVariation && selectedPrice ? (
              <div>
                <p className='text-sm text-muted-foreground mb-1'>Selected option price:</p>
                <div className='text-2xl font-bold text-white'>
                  {Number(selectedPrice).toFixed(2)} EGP
                </div>
              </div>
            ) : (
              <div className="text-left">
                <div className="text-2xl font-bold text-white">
                  {minCurrentPrice !== maxCurrentPrice
                    ? `${minCurrentPrice.toFixed(2)} - ${maxCurrentPrice.toFixed(2)} EGP`
                    : `${minCurrentPrice.toFixed(2)} EGP`}
                </div>
                {minCurrentPrice !== maxCurrentPrice && (
                  <p className="text-sm text-muted-foreground mt-1">Price varies by option</p>
                )}
              </div>
            )}
          </div>
        ) : (
          // Product without variations - show single price
          <div className="text-left">
            <div className="text-2xl font-bold text-white">
              {Number(product.price).toFixed(2)} EGP
            </div>
          </div>
        )}
      </div>

      {/* Variation Selection - Only if variations exist */}
      {hasVariations && (
        <div className='border border-gray-700 rounded-lg p-4 bg-gray-900/50'>
          <h3 className='text-lg font-semibold mb-3'>Select Your Option:</h3>
          <div className='space-y-2'>
            {variationPricingDetails.map(({ variation, pricing }) => {
              const hasDiscount = pricing.saleActive
              const discountPercentage =
                hasDiscount && pricing.originalPrice
                  ? Math.round(((pricing.originalPrice - pricing.currentPrice) / pricing.originalPrice) * 100)
                  : 0
              
              return (
                <button
                  key={variation.name}
                  className={`w-full px-4 py-3 border rounded-lg text-sm sm:text-base transition-all text-left ${
                    selectedVariation === variation.name 
                      ? 'border-purple-500 bg-purple-500/20 text-white ring-2 ring-purple-500' 
                      : 'border-gray-600 bg-gray-800/50 hover:border-purple-400 hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedVariation(variation.name)}
                >
                  const expiryDate = variation.salePriceExpiresAt
                    ? new Date(variation.salePriceExpiresAt)
                    : null
                  const hasExpiry =
                    expiryDate && !Number.isNaN(expiryDate.getTime())

                  return (
                    <button
                      key={variation.name}
                      className={`w-full px-4 py-3 border rounded-lg text-sm sm:text-base transition-all text-left ${
                        selectedVariation === variation.name 
                          ? 'border-purple-500 bg-purple-500/20 text-white ring-2 ring-purple-500' 
                          : 'border-gray-600 bg-gray-800/50 hover:border-purple-400 hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedVariation(variation.name)}
                    >
                      <div className='flex justify-between items-center'>
                    <div className='flex-1'>
                      <span className='font-medium'>{variation.name}</span>
                      {hasDiscount && (
                        <span className='ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-md font-bold'>
                          -{discountPercentage}%
                        </span>
                      )}
                    </div>
                    <div className='text-right'>
                      {hasDiscount && pricing.originalPrice > 0 && (
                        <div className='text-xs text-gray-400 line-through'>
                          {pricing.originalPrice.toFixed(2)} EGP
                        </div>
                      )}
                      <div className={`font-bold ${selectedVariation === variation.name ? 'text-purple-300' : 'text-purple-400'}`}>
                        {pricing.currentPrice.toFixed(2)} EGP
                      </div>
                    </div>
                  </div>
                      {hasDiscount && hasExpiry && (
                        <p className='text-xs text-gray-500 mt-1'>
                          Offer ends {expiryDate.toLocaleString()}
                        </p>
                      )}
                    </button>
                  )
            })}
          </div>
        </div>
      )}

      {/* Add to Cart */}
      <div>
        <AddToCart product={{...product, selectedVariation}} />
      </div>

      <Separator />

      {/* Product Details Section */}
      <div className='space-y-3 sm:space-y-4'>
        <div>
          <h3 className='font-semibold mb-2 text-sm sm:text-base'>Product Details</h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm'>
            <div>
              <span className='text-muted-foreground'>Category:</span>
              <span className='ml-2'>{product.category}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>Brand:</span>
              <span className='ml-2'>{product.brand}</span>
            </div>
            {product.platformType && (
              <div>
                <span className='text-muted-foreground'>Platform:</span>
                <span className='ml-2'>{product.platformType}</span>
              </div>
            )}
            {product.productCategory && (
              <div>
                <span className='text-muted-foreground'>Type:</span>
                <span className='ml-2'>{product.productCategory}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className='font-semibold mb-2 text-sm sm:text-base'>Description</h3>
        <p className='text-sm sm:text-base text-muted-foreground whitespace-pre-line'>{product.description}</p>
      </div>
    </div>
  )
}


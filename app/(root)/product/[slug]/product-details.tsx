'use client'

import { useState } from 'react'
import Rating from '@/components/shared/product/rating'
import AddToCart from '@/components/shared/product/add-to-cart'
import { Separator } from '@/components/ui/separator'

interface ProductDetailsProps {
  product: any
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedVariation, setSelectedVariation] = useState<string>('')
  
  // Check if product has variations (new system)
  const hasVariations = product.variations && Array.isArray(product.variations) && product.variations.length > 0
  
  // Calculate selected price from variations
  const selectedPrice = selectedVariation && hasVariations
    ? product.variations.find((v: any) => v.name === selectedVariation)?.price
    : null

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
                  {Number(product.price).toFixed(2)} - {Number(product.listPrice).toFixed(2)} EGP
                </div>
                <p className="text-sm text-muted-foreground mt-1">Price varies by option</p>
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

      {/* Description */}
      <div>
        <p className='text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4'>{product.description}</p>
      </div>

      {/* Variation Selection - Only if variations exist */}
      {hasVariations && (
        <div className='border border-gray-700 rounded-lg p-4 bg-gray-900/50'>
          <h3 className='text-lg font-semibold mb-3'>Select Your Option:</h3>
          <div className='space-y-2'>
            {product.variations.map((variation: any) => {
              const originalPrice = Number(variation.originalPrice) || 0
              const currentPrice = Number(variation.price) || 0
              const hasDiscount = originalPrice > 0 && currentPrice > 0 && currentPrice < originalPrice
              const discountPercentage = hasDiscount 
                ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
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
                      {hasDiscount && (
                        <div className='text-xs text-gray-400 line-through'>
                          {originalPrice.toFixed(2)} EGP
                        </div>
                      )}
                      <div className={`font-bold ${selectedVariation === variation.name ? 'text-purple-300' : 'text-purple-400'}`}>
                        {currentPrice.toFixed(2)} EGP
                      </div>
                    </div>
                  </div>
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
    </div>
  )
}


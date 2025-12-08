
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useCartStore from '@/hooks/use-cart-store'
import { IProduct } from '@/types'
import { useLoading } from '@/hooks/use-loading'
import { LoadingSpinner } from '@/components/shared/loading-overlay'
import SelectVariant from './select-variant'
import { getVariationPricing } from '@/lib/utils'

interface AddToCartProps {
  product: IProduct
  className?: string
}

export default function AddToCart({ product, className }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const { addItem } = useCartStore()
  const { toast } = useToast()
  const { isLoading: isAddingToCart, withLoading } = useLoading()
  
  // Get product variations and selected variation from props
  const variations = (product as any).variations || []
  const hasVariations = variations.length > 0
  const selectedVariation = (product as any).selectedVariation || ''
  const selectedPrice = selectedVariation && hasVariations
    ? (() => {
        const variation = variations.find((v: any) => v.name === selectedVariation)
        if (!variation) return Number(product.price)
        const pricing = getVariationPricing(variation)
        return pricing.currentPrice || Number(product.price)
      })()
    : Number(product.price)

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(99, quantity + value))
    setQuantity(newQuantity)
  }

  const handleAddToCart = async () => {
    // Check if variation is required but not selected
    if (hasVariations && !selectedVariation) {
      toast({
        title: 'Please select an option',
        description: 'Please select a product variation before adding to cart',
        variant: 'destructive',
      })
      return
    }

    // Check if selected variation is out of stock
    if (hasVariations && selectedVariation) {
      const variation = variations.find((v: any) => v.name === selectedVariation)
      if (variation && variation.stock !== undefined) {
        const variationStock = Number(variation.stock) || 0
        if (variationStock <= 0) {
          toast({
            title: 'Out of Stock',
            description: `The selected variation "${selectedVariation}" is currently out of stock`,
            variant: 'destructive',
          })
          return
        }
        if (variationStock < quantity) {
          toast({
            title: 'Insufficient Stock',
            description: `Only ${variationStock} item${variationStock !== 1 ? 's' : ''} available for "${selectedVariation}"`,
            variant: 'destructive',
          })
          return
        }
      }
    }
    
    if ((product.colors.length > 1 || product.sizes.length > 1) && !selectedVariant) {
      toast({
        title: 'Please select options',
        description: 'Please select color and size before adding to cart',
        variant: 'destructive',
      })
      return
    }

    await withLoading(
      async () => {
        const category =
          product.category ||
          (product as any).productCategory ||
          (product as any).platformType ||
          'General'

        // Get variation pricing info if variation is selected
        let variationOriginalPrice: number | undefined
        let variationSalePriceExpiresAt: string | undefined
        if (hasVariations && selectedVariation) {
          const variation = variations.find((v: any) => v.name === selectedVariation)
          if (variation) {
            variationOriginalPrice = variation.originalPrice ? Number(variation.originalPrice) : undefined
            variationSalePriceExpiresAt = variation.salePriceExpiresAt || undefined
          }
        }
        
        // Get product-level pricing info for products without variations
        let productListPrice: number | undefined
        let productOriginalPrice: number | undefined
        if (!hasVariations) {
          productListPrice = (product as any).listPrice ? Number((product as any).listPrice) : undefined
          productOriginalPrice = (product as any).originalPrice ? Number((product as any).originalPrice) : undefined
        }

        await addItem({
          product: product.id,
          name: product.name,
          slug: product.slug,
          category,
          categoryId: (product as any).categoryId ?? null,
          image: product.images[0],
          price: hasVariations ? selectedPrice : Number(product.price), // Use selected variation price or product price
          countInStock: product.countInStock,
          color: selectedVariant || product.colors[0] || '',
          size: product.sizes[0] || '',
          quantity: 1,
          // product type & game account fields
          productType: (product as any).productType || 'game_code',
          platformType: (product as any).platformType,
          productCategory: (product as any).productCategory,
          selectedVariation: selectedVariation || undefined,
          isAddToOwnAccount: false,
          accountUsername: undefined,
          accountPassword: undefined,
          accountBackupCode: undefined,
          disableTwoStepVerified: false,
          clientId: `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          // Variation pricing info for discount expiration handling
          variationOriginalPrice,
          variationSalePriceExpiresAt,
          // Product-level pricing info for discount handling (products without variations)
          productListPrice,
          productOriginalPrice,
        }, quantity)

        toast({
          title: 'Added to Cart',
          description: `${product.name} has been added to your cart`,
          variant: 'default',
        })

        // Reset quantity
        setQuantity(1)
      }
    )
  }

  return (
    <div className={`space-y-4 ${className}`} dir="ltr">
      
      {(product.colors.length > 1 || product.sizes.length > 1) && (
        <div className='space-y-3'>
          {product.colors.length > 1 && (
            <div>
              <label className='font-medium mb-2 block'>Color:</label>
              <div className='flex gap-2'>
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className={`px-3 py-1 border rounded ${
                      selectedVariant === color ? 'border-primary bg-primary text-white' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedVariant(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
          {product.sizes.length > 1 && (
            <div>
              <label className='font-medium mb-2 block'>Size:</label>
              <div className='flex gap-2'>
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`px-3 py-1 border rounded ${
                      selectedVariant === size ? 'border-primary bg-primary text-white' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedVariant(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='icon'
          onClick={() => handleQuantityChange(-1)}
          disabled={quantity <= 1}
        >
          <Minus className='h-4 w-4' />
        </Button>
        <Input
          type='number'
          min='1'
          max='99'
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className='w-20 text-center'
        />
        <Button
          variant='outline'
          size='icon'
          onClick={() => handleQuantityChange(1)}
          disabled={quantity >= 99}
        >
          <Plus className='h-4 w-4' />
        </Button>
      </div>

      {(() => {
        // Check if product or selected variation is out of stock
        const isOutOfStock = hasVariations && selectedVariation
          ? (() => {
              const variation = variations.find((v: any) => v.name === selectedVariation)
              if (variation && variation.stock !== undefined) {
                return Number(variation.stock) <= 0
              }
              return product.countInStock === 0
            })()
          : product.countInStock === 0

        return (
          <Button
            onClick={handleAddToCart}
            className="w-full rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isAddingToCart || isOutOfStock}
          >
            {isAddingToCart ? (
              <LoadingSpinner size="sm" text="Adding..." />
            ) : isOutOfStock ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingCart className="ml-2 h-4 w-4" />
                Add to Cart
              </>
            )}
          </Button>
        )
      })()}
    </div>
  )
}

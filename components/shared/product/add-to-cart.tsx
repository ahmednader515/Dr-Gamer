
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

interface AddToCartProps {
  product: IProduct
  className?: string
}

export default function AddToCart({ product, className }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [selectedVariation, setSelectedVariation] = useState<string>('')
  const [selectedPrice, setSelectedPrice] = useState<number>(Number(product.price))
  const { addItem } = useCartStore()
  const { toast } = useToast()
  const { isLoading: isAddingToCart, withLoading } = useLoading()
  
  // Get product variations if they exist
  const variations = (product as any).variations || []
  const hasVariations = variations.length > 0

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
        await addItem({
          product: product.id,
          name: product.name,
          slug: product.slug,
          category: product.category,
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
      {/* Product Variations */}
      {hasVariations && (
        <div className='space-y-3'>
          <div>
            <label className='font-medium mb-2 block text-sm sm:text-base'>Select Option:</label>
            <div className='grid grid-cols-2 gap-2'>
              {variations.map((variation: any) => (
                <button
                  key={variation.name}
                  className={`px-3 py-2 border rounded-lg text-xs sm:text-sm transition-all ${
                    selectedVariation === variation.name 
                      ? 'border-purple-500 bg-purple-500 text-white' 
                      : 'border-gray-600 bg-gray-800 hover:border-purple-400'
                  }`}
                  onClick={() => {
                    setSelectedVariation(variation.name)
                    setSelectedPrice(variation.price)
                  }}
                >
                  <div className='font-medium'>{variation.name}</div>
                  <div className='text-xs mt-1'>{variation.price.toFixed(2)} EGP</div>
                </button>
              ))}
            </div>
          </div>
          {selectedVariation && (
            <div className='p-3 bg-gray-800 rounded-lg border border-gray-700'>
              <p className='text-sm text-gray-300'>
                Selected: <span className='font-semibold text-white'>{selectedVariation}</span>
              </p>
              <p className='text-lg font-bold text-purple-400 mt-1'>
                {selectedPrice.toFixed(2)} EGP
              </p>
            </div>
          )}
        </div>
      )}
      
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

      <Button
        onClick={handleAddToCart}
        className="w-full rounded-full font-bold"
        disabled={isAddingToCart}
      >
        {isAddingToCart ? (
          <LoadingSpinner size="sm" text="Adding..." />
        ) : (
          <>
            <ShoppingCart className="ml-2 h-4 w-4" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import ProductPrice from '@/components/shared/product/product-price'
import { calculatePromoDiscount } from '@/lib/utils'

type CartItem = {
  product?: string
  productId?: string
  id?: string
  price: number
  quantity: number
  categoryId?: string | null
  categoryName?: string | null
  category?: string | null
  selectedVariation?: string | null
}

type PromoAssignmentResponse = {
  id: string
  type: 'product' | 'category'
  maxDiscountAmount: number | null
  variationNames: string[]
  product?: {
    id: string
    name: string
    categoryName?: string | null
  } | null
  category?: {
    id: string
    name: string
  } | null
}

type AppliedPromo = {
  code: string
  discountPercent: number
  assignments: PromoAssignmentResponse[]
}

type PromoCodeInputProps = {
  onPromoApplied: (data: AppliedPromo) => void
  onPromoRemoved: () => void
  appliedPromo: AppliedPromo | null
  discountAmount: number
  cartItems: CartItem[]
}

export default function PromoCodeInput({
  onPromoApplied,
  onPromoRemoved,
  appliedPromo,
  discountAmount,
  cartItems,
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('')
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  const { toast } = useToast()

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a promo code',
        variant: 'destructive',
      })
      return
    }

    setIsValidatingPromo(true)
    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.toUpperCase(),
          items: cartItems.map((item) => ({
            productId: item.productId || item.product || item.id,
            price: item.price,
            quantity: item.quantity,
            categoryId: item.categoryId ?? null,
            categoryName: item.categoryName ?? item.category ?? null,
            selectedVariation: item.selectedVariation ?? null,
          })),
        }),
      })

      const result = await response.json()

      if (result.success) {
        const applied: AppliedPromo = {
          code: result.data.code,
          discountPercent: result.data.discountPercent,
          assignments: result.data.assignments || [],
        }
        const { discount, eligibleItems } = calculatePromoDiscount(cartItems, {
          discountPercent: applied.discountPercent,
          assignments: applied.assignments.map((assignment: PromoAssignmentResponse) => ({
            type: assignment.type,
            productId: assignment.product?.id,
            categoryId: assignment.category?.id,
            categoryName: assignment.category?.name,
            variationNames: assignment.variationNames,
            maxDiscountAmount: assignment.maxDiscountAmount,
          })),
        })

        if (applied.assignments.length > 0 && eligibleItems.length === 0) {
          toast({
            title: 'Not Eligible',
            description:
              'This promo code does not apply to any items currently in your cart.',
            variant: 'destructive',
          })
          return
        }

        if (discount <= 0) {
          toast({
            title: 'Not Eligible',
            description:
              'This promo code does not apply to your current cart contents.',
            variant: 'destructive',
          })
          return
        }

        onPromoApplied(applied)
        setPromoCode('')
        toast({
          title: 'Applied',
          description: result.message,
        })
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error validating promo code',
        variant: 'destructive',
      })
    } finally {
      setIsValidatingPromo(false)
    }
  }

  const handleRemovePromoCode = () => {
    onPromoRemoved()
    setPromoCode('')
    toast({
      title: 'Removed',
      description: 'Promo code has been removed',
    })
  }

  if (appliedPromo) {
    return (
      <>
        <div className='bg-purple-900/30 border border-purple-600 rounded-lg p-3'>
          <div className='flex justify-between items-center'>
            <div>
              <p className='text-sm font-medium text-purple-400'>
                Promo Code: {appliedPromo.code}
              </p>
              <p className='text-xs text-gray-300'>
                {appliedPromo.discountPercent}% OFF
              </p>
            </div>
            <Button
              size='sm'
              variant='ghost'
              onClick={handleRemovePromoCode}
              className='text-red-400 hover:text-red-300 hover:bg-red-900/20'
            >
              Remove
            </Button>
          </div>
        </div>
        <div className='flex justify-between text-sm sm:text-base text-purple-400'>
          <span>Discount ({appliedPromo.discountPercent}%):</span>
          <span>- <ProductPrice price={discountAmount} plain /></span>
        </div>
        {appliedPromo.assignments && appliedPromo.assignments.length > 0 && (
          <p className='text-xs text-gray-400 mt-1'>
            Applies to:{' '}
            {appliedPromo.assignments
              .map((assignment) => {
                if (assignment.type === 'product' && assignment.product) {
                  return assignment.product.name
                }
                if (assignment.type === 'category' && assignment.category) {
                  return `${assignment.category.name} (category)`
                }
                return assignment.id
              })
              .join(', ')}
          </p>
        )}
      </>
    )
  }

  return (
    <div className='space-y-2'>
      <Label htmlFor='promoCode' className='text-sm font-medium'>Promo Code</Label>
      <div className='flex gap-2'>
        <Input
          id='promoCode'
          type='text'
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder='Enter promo code'
          className='flex-1'
        />
        <Button
          onClick={handleApplyPromoCode}
          disabled={isValidatingPromo}
          className='bg-purple-600 hover:bg-purple-700'
        >
          {isValidatingPromo ? 'Validating...' : 'Apply'}
        </Button>
      </div>
    </div>
  )
}


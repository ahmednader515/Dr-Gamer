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
}

type AppliedPromo = {
  code: string
  discountPercent: number
  applicableProducts: Array<{
    productId: string
    productName?: string
    maxDiscountAmount: number | null
  }>
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
          })),
        }),
      })

      const result = await response.json()

      if (result.success) {
        const applied: AppliedPromo = {
          code: result.data.code,
          discountPercent: result.data.discountPercent,
          applicableProducts: result.data.applicableProducts || [],
        }
        const { discount, eligibleItems } = calculatePromoDiscount(
          cartItems,
          applied,
        )

        if (applied.applicableProducts.length > 0 && eligibleItems.length === 0) {
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
        {appliedPromo.applicableProducts && appliedPromo.applicableProducts.length > 0 && (
          <p className='text-xs text-gray-400 mt-1'>
            Applies to: {appliedPromo.applicableProducts.map((product) => product.productName || product.productId).join(', ')}
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


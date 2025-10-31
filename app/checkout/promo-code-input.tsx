'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import ProductPrice from '@/components/shared/product/product-price'

type PromoCodeInputProps = {
  onPromoApplied: (data: { code: string; discountPercent: number }) => void
  onPromoRemoved: () => void
  appliedPromo: { code: string; discountPercent: number } | null
  discountAmount: number
}

export default function PromoCodeInput({
  onPromoApplied,
  onPromoRemoved,
  appliedPromo,
  discountAmount,
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('')
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  const { toast } = useToast()

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال كود الخصم',
        variant: 'destructive',
      })
      return
    }

    setIsValidatingPromo(true)
    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.toUpperCase() }),
      })

      const result = await response.json()

      if (result.success) {
        onPromoApplied(result.data)
        toast({
          title: 'تم التطبيق',
          description: result.message,
        })
      } else {
        toast({
          title: 'خطأ',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في التحقق من الكود',
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
      title: 'تم الإزالة',
      description: 'تم إزالة كود الخصم',
    })
  }

  if (appliedPromo) {
    return (
      <>
        <div className='bg-purple-900/30 border border-purple-600 rounded-lg p-3'>
          <div className='flex justify-between items-center'>
            <div>
              <p className='text-sm font-medium text-purple-400'>
                كود الخصم: {appliedPromo.code}
              </p>
              <p className='text-xs text-gray-300'>
                خصم {appliedPromo.discountPercent}%
              </p>
            </div>
            <Button
              size='sm'
              variant='ghost'
              onClick={handleRemovePromoCode}
              className='text-red-400 hover:text-red-300 hover:bg-red-900/20'
            >
              إزالة
            </Button>
          </div>
        </div>
        <div className='flex justify-between text-sm sm:text-base text-purple-400'>
          <span>الخصم ({appliedPromo.discountPercent}%):</span>
          <span>- <ProductPrice price={discountAmount} plain /></span>
        </div>
      </>
    )
  }

  return (
    <div className='space-y-2'>
      <Label htmlFor='promoCode' className='text-sm font-medium'>كود الخصم</Label>
      <div className='flex gap-2'>
        <Input
          id='promoCode'
          type='text'
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder='أدخل كود الخصم'
          className='flex-1'
        />
        <Button
          onClick={handleApplyPromoCode}
          disabled={isValidatingPromo}
          className='bg-purple-600 hover:bg-purple-700'
        >
          {isValidatingPromo ? 'جاري التحقق...' : 'تطبيق'}
        </Button>
      </div>
    </div>
  )
}


'use client'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProductPriceProps {
  price: number
  originalPrice?: number
  currency?: string
  className?: string
  plain?: boolean
  isRange?: boolean
}

export default function ProductPrice({
  price,
  originalPrice,
  currency = 'EGP',
  className,
  plain = false,
  isRange = false,
}: ProductPriceProps) {
  const formatPrice = (price: number) => {
    // Ensure price is a valid number
    const numericPrice = Number(price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return '0.00 EGP'
    }
    
    // Custom formatting for Egyptian Pound to show EGP
    if (currency === 'EGP') {
      return `${numericPrice.toFixed(2)} EGP`
    }
    
    // Fallback to standard currency formatting for other currencies
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(numericPrice)
  }

  const hasDiscount = Number(originalPrice) > 0 && Number(price) > 0 && Number(originalPrice) > Number(price)

  if (plain) {
    if (isRange && originalPrice && originalPrice !== price) {
      return <span>{formatPrice(price)} - {formatPrice(originalPrice)}</span>
    }
    return <span>{formatPrice(price)}</span>
  }

  // Don't render anything if price is 0 or invalid
  if (!price || Number(price) <= 0) {
    return null
  }

  return (
    <div className={cn('flex flex-col gap-1 items-start text-left', className)} dir="ltr">
      <span className='text-2xl font-bold text-white text-left'>
        {isRange && originalPrice && originalPrice !== price 
          ? `${formatPrice(price)} - ${formatPrice(originalPrice)}`
          : formatPrice(price)
        }
      </span>
      {hasDiscount && !isRange && (
        <>
          <span className='text-sm text-muted-foreground line-through text-left'>
            {formatPrice(originalPrice)}
          </span>
          <Badge variant='destructive' className='text-xs w-fit text-left'>
            {Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)}% OFF
          </Badge>
        </>
      )}
    </div>
  )
}

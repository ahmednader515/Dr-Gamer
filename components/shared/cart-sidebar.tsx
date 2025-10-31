'use client'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import useCartStore from '@/hooks/use-cart-store'
import ProductPrice from '@/components/shared/product/product-price'
import { useLoading } from '@/hooks/use-loading'
import { LoadingSpinner } from '@/components/shared/loading-overlay'
import data from '@/lib/data'

export default function CartSidebar() {
  const {
    cart: { items, itemsPrice },
    updateItem,
    removeItem,
  } = useCartStore()
  const {
    common: { freeShippingMinPrice },
  } = data.settings[0];

  const { isLoading: isUpdating, withLoading } = useLoading()

  const handleQuantityChange = async (item: any, newQuantity: number) => {
    await withLoading(
      async () => {
        updateItem(item, newQuantity)
      }
    )
  }

  const handleRemoveItem = async (item: any) => {
    await withLoading(
      async () => {
        removeItem(item)
      }
    )
  }

  return (
    <div className='w-32 h-full bg-gray-900 border-l border-gray-700 shadow-lg flex-shrink-0' style={{ direction: 'ltr' }}>
      <div className='p-3 h-full flex flex-col gap-3 justify-start items-center'>
        <div className='text-center space-y-2 w-full'>
          <div className='text-sm font-medium text-gray-300'>Subtotal</div>
          <div className='font-bold text-base text-white'>
            <ProductPrice price={itemsPrice} plain />
          </div>
          {itemsPrice > freeShippingMinPrice && (
            <div className='text-center text-xs text-purple-400 bg-purple-900/30 border border-purple-700 p-2 rounded-md'>
              Your order qualifies for free shipping
            </div>
          )}

          <Link
            className={`rounded-full hover:no-underline w-full text-sm btn-mobile bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 block text-center transition-colors`}
            href='/cart'
          >
            Go to Cart
          </Link>
          <Separator className='mt-3' />
        </div>

        <ScrollArea className='flex-1 w-full'>
          <div className='space-y-3'>
            {items.map((item) => (
              <div key={item.clientId} className='bg-gray-800 rounded-lg p-2'>
                <div className='space-y-2'>
                  <Link href={`/product/${item.slug}`}>
                    <div className='relative h-20 w-full'>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes='20vw'
                        className='object-contain rounded-md'
                      />
                    </div>
                  </Link>
                  <div className='text-sm text-center font-bold text-white'>
                    <ProductPrice price={item.price} plain />
                  </div>
                  <div className='flex gap-2 justify-center'>
                    <Select
                      value={item.quantity.toString()}
                      onValueChange={(value) => {
                        handleQuantityChange(item, Number(value))
                      }}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className='text-xs w-12 h-8 py-0'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: item.countInStock }).map(
                          (_, i) => (
                            <SelectItem value={(i + 1).toString()} key={i + 1}>
                              {i + 1}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant={'outline'}
                      size={'sm'}
                      onClick={() => handleRemoveItem(item)}
                      disabled={isUpdating}
                      className='h-8 w-8 p-0'
                    >
                      {isUpdating ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 className='w-4 h-4' />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

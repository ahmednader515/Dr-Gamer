'use client'

import { Card, CardContent } from '@/components/ui/card'
import { IOrderList } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

import CheckoutFooter from '../checkout-footer'
import { redirect, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ProductPrice from '@/components/shared/product/product-price'


export default function OrderDetailsForm({
  order,
}: {
  order: IOrderList
}) {
  const router = useRouter()
  const items = order.items || []
  const {
    customerEmail,
    customerPhone,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    paymentNumber,
    transactionImage,
    expectedDeliveryDate,
    isPaid,
    promoCode,
    discountPercent,
    discountAmount,
  } = order
  const { toast } = useToast()

  if (isPaid) {
    redirect(`/account/orders/${order.id}`)
  }


  const CheckoutSummary = () => (
    <Card>
      <CardContent className='p-4'>
        <div>
          <div className='text-lg font-bold'>Order Summary</div>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span>Products:</span>
              <span>
                {' '}
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>

            {/* Promo Code Discount */}
            {promoCode && discountAmount && (
              <div className='flex items-center justify-between text-purple-400'>
                <div>
                  <span className='text-sm'>Promo Code: </span>
                  <span className='font-semibold'>{promoCode}</span>
                  <span className='text-xs ml-1'>({discountPercent}%)</span>
                </div>
                <span className='font-semibold'>
                  - <ProductPrice price={discountAmount} plain />
                </span>
              </div>
            )}

            <div className='flex justify-between pt-3 font-bold text-lg border-t'>
              <span>Total:</span>
              <span className='text-purple-400'>
                {' '}
                <ProductPrice price={totalPrice} plain />
              </span>
            </div>
            
            {promoCode && discountAmount && (
              <div className='text-xs text-gray-400 text-center'>
                Saved {discountPercent}% • <ProductPrice price={discountAmount} plain /> discount
              </div>
            )}

            {!isPaid && paymentMethod && (
              <div className='space-y-3 pt-3 border-t'>
                <div className='bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 text-sm'>
                  <p className='text-yellow-400 font-semibold mb-1'>⏳ Waiting for payment confirmation</p>
                  <p className='text-gray-300 text-xs'>
                    Your transaction will be reviewed and the order will be confirmed shortly. The digital product will be sent to your email after confirmation.
                  </p>
                </div>
                <Button
                  className='w-full rounded-full'
                  onClick={() => router.push(`/account/orders/${order.id}`)}
                >
                  View Order Details
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Debug: Log order data to console
  console.log('Order data:', order)
  console.log('Customer email:', customerEmail)
  console.log('Items:', items)
  console.log('Payment method:', paymentMethod)
  console.log('Payment number:', paymentNumber)
  console.log('Transaction image:', transactionImage)
  console.log('Is paid:', isPaid)

  return (
    <main className='max-w-6xl mx-auto px-4 py-6' dir='ltr'>
      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold text-purple-400 mb-2'>
          ✓ Your Order Has Been Received Successfully
        </h1>
        <p className='text-gray-400 text-sm sm:text-base'>
          Order Number: <span className='font-mono text-white'>{order.id}</span>
        </p>
      </div>

      <div className='grid md:grid-cols-4 gap-6'>
        <div className='md:col-span-3 space-y-4'>
          
          {/* Customer Contact Info */}
          <Card>
            <CardContent className='p-4'>
              <div className='text-lg font-bold mb-3'>Contact Information</div>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm text-gray-400'>Email:</p>
                  <p className='text-base font-semibold'>
                    {customerEmail || 'Not available'}
                  </p>
                  <p className='text-xs text-gray-400 mt-1'>
                    The digital product will be sent to this email after payment confirmation
                  </p>
                </div>
                
                <div className='border-t border-gray-700 pt-3'>
                  <p className='text-sm text-gray-400'>Phone Number:</p>
                  <p className='text-base font-semibold'>
                    {customerPhone || 'Not available'}
                  </p>
                  <p className='text-xs text-gray-400 mt-1'>
                    For contact if email is unavailable
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardContent className='p-4'>
              <div className='grid md:grid-cols-3 gap-3'>
                <div className='text-lg font-bold'>
                  <span>Payment Method</span>
                </div>
                <div className='col-span-2 space-y-3'>
                  <p className='text-base font-semibold'>{paymentMethod || 'Not specified'}</p>
                  
                  {paymentNumber && (
                    <div>
                      <p className='text-xs text-gray-400'>Your Payment Number:</p>
                      <p className='text-sm font-mono'>{paymentNumber}</p>
                    </div>
                  )}

                  {transactionImage && (
                    <div>
                      <p className='text-xs text-gray-400 mb-2'>Transaction Screenshot:</p>
                      <a 
                        href={transactionImage} 
                        target='_blank' 
                        rel='noopener noreferrer'
                        className='block'
                      >
                        <div className='relative w-full max-w-sm h-48 border border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity'>
                          <img
                            src={transactionImage}
                            alt='Transaction screenshot'
                            className='w-full h-full object-contain bg-gray-900'
                          />
                        </div>
                      </a>
                      <p className='text-xs text-gray-500 mt-1'>Click to view full size image</p>
                    </div>
                  )}

                  {!isPaid && (
                    <div className='bg-blue-900/30 border border-blue-600 rounded-lg p-3 text-sm'>
                      <p className='text-blue-400 font-semibold mb-1'>ℹ️ Confirmation Steps</p>
                      <ol className='text-gray-300 text-xs list-decimal list-inside space-y-1'>
                        <li>Our team will review your transaction</li>
                        <li>Payment will be confirmed within 24 hours</li>
                        <li>You will receive the digital product via email</li>
                        <li>You can track the order status from My Orders page</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expected Delivery */}
          {expectedDeliveryDate && (
            <Card>
              <CardContent className='p-4'>
                <div className='grid md:grid-cols-3 gap-3'>
                  <div className='text-lg font-bold'>
                    <span>Expected Delivery</span>
                  </div>
                  <div className='col-span-2'>
                    <p className='text-base'>
                      {formatDateTime(expectedDeliveryDate).dateTime}
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>
                      The digital product will be sent to your email within 24 hours of payment confirmation
                    </p>
                    <p className='text-xs text-purple-400 mt-2 font-medium'>
                      Your order will be delivered soon based on the order processing sequence
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className='block md:hidden'>
            <CheckoutSummary />
          </div>

          <CheckoutFooter />
        </div>
        <div className='hidden md:block'>
          <CheckoutSummary />
        </div>
      </div>
    </main>
  )
}

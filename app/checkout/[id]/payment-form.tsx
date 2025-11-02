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
          <div className='text-lg font-bold'>ملخص الطلب</div>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span>المنتجات:</span>
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
              <span>المجموع الكلي:</span>
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
                  <p className='text-yellow-400 font-semibold mb-1'>⏳ في انتظار تأكيد الدفع</p>
                  <p className='text-gray-300 text-xs'>
                    سيتم مراجعة معاملتك وتأكيد الطلب في أقرب وقت. سيتم إرسال المنتج الرقمي إلى بريدك الإلكتروني بعد التأكيد.
                  </p>
                </div>
                <Button
                  className='w-full rounded-full'
                  onClick={() => router.push(`/account/orders/${order.id}`)}
                >
                  عرض تفاصيل الطلب
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
          ✓ تم استلام طلبك بنجاح
        </h1>
        <p className='text-gray-400 text-sm sm:text-base'>
          رقم الطلب: <span className='font-mono text-white'>{order.id}</span>
        </p>
      </div>

      <div className='grid md:grid-cols-4 gap-6'>
        <div className='md:col-span-3 space-y-4'>
          
          {/* Customer Contact Info */}
          <Card>
            <CardContent className='p-4'>
              <div className='text-lg font-bold mb-3'>معلومات التواصل</div>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm text-gray-400'>البريد الإلكتروني:</p>
                  <p className='text-base font-semibold'>
                    {customerEmail || 'غير متوفر'}
                  </p>
                  <p className='text-xs text-gray-400 mt-1'>
                    سيتم إرسال المنتج الرقمي إلى هذا البريد بعد تأكيد الدفع
                  </p>
                </div>
                
                <div className='border-t border-gray-700 pt-3'>
                  <p className='text-sm text-gray-400'>رقم الهاتف:</p>
                  <p className='text-base font-semibold'>
                    {customerPhone || 'غير متوفر'}
                  </p>
                  <p className='text-xs text-gray-400 mt-1'>
                    للتواصل في حالة عدم توفر البريد الإلكتروني
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
                  <span>طريقة الدفع</span>
                </div>
                <div className='col-span-2 space-y-3'>
                  <p className='text-base font-semibold'>{paymentMethod || 'غير محدد'}</p>
                  
                  {paymentNumber && (
                    <div>
                      <p className='text-xs text-gray-400'>رقم الدفع الخاص بك:</p>
                      <p className='text-sm font-mono'>{paymentNumber}</p>
                    </div>
                  )}

                  {transactionImage && (
                    <div>
                      <p className='text-xs text-gray-400 mb-2'>صورة المعاملة:</p>
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
                      <p className='text-xs text-gray-500 mt-1'>اضغط لعرض الصورة بالحجم الكامل</p>
                    </div>
                  )}

                  {!isPaid && (
                    <div className='bg-blue-900/30 border border-blue-600 rounded-lg p-3 text-sm'>
                      <p className='text-blue-400 font-semibold mb-1'>ℹ️ خطوات التأكيد</p>
                      <ol className='text-gray-300 text-xs list-decimal list-inside space-y-1'>
                        <li>سيقوم فريقنا بمراجعة معاملتك</li>
                        <li>سيتم تأكيد الدفع خلال 24 ساعة</li>
                        <li>ستتلقى المنتج الرقمي على بريدك الإلكتروني</li>
                        <li>يمكنك متابعة حالة الطلب من صفحة طلباتي</li>
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
                    <span>التسليم المتوقع</span>
                  </div>
                  <div className='col-span-2'>
                    <p className='text-base'>
                      {formatDateTime(expectedDeliveryDate).dateTime}
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>
                      سيتم إرسال المنتج الرقمي إلى بريدك خلال ساعتين من تأكيد الدفع
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

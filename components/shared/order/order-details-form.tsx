'use client'

import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IOrderList } from '@/types'
import { cn, formatDateTime } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import ProductPrice from '../product/product-price'
import ActionButton from '../action-button'
import { deliverOrder, updateOrderToPaid } from '@/lib/actions/order.actions'

export default function OrderDetailsForm({
  order,
  isAdmin,
  userRole = 'User',
}: {
  order: IOrderList
  isAdmin: boolean
  userRole?: string
}) {
  const isModerator = userRole === 'Moderator'
  const {
    customerEmail,
    customerPhone,
    shippingAddress,
    items,
    orderItems,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    paymentNumber,
    transactionImage,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
    expectedDeliveryDate,
  } = order

  // Add safety checks for required properties
  if (!order) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        الطلب غير موجود
      </div>
    )
  }

  // Use items or orderItems, whichever is available
  const orderItemsList = items || orderItems || []
  
  // Debug logging
  console.log('Order data received:', order)
  console.log('Items:', items)
  console.log('OrderItems:', orderItems)
  console.log('OrderItemsList:', orderItemsList)
  console.log('CustomerEmail:', customerEmail)
  
  if (orderItemsList.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        لا توجد منتجات في الطلب
        <br />
        <small className="text-xs mt-2">
          Items: {items?.length || 0}, OrderItems: {orderItems?.length || 0}
        </small>
      </div>
    )
  }

  return (
    <div className='grid md:grid-cols-3 md:gap-5' dir='rtl'>
      <div className='overflow-x-auto md:col-span-2 space-y-4'>
        
        {/* Customer Contact Info Card */}
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>معلومات التواصل</h2>
            <div className='space-y-3'>
              <div>
                <p className='text-sm text-gray-400'>البريد الإلكتروني:</p>
                <p className='text-lg font-semibold'>
                  {customerEmail || 'غير متوفر'}
                </p>
                <p className='text-xs text-gray-400 mt-1'>
                  سيتم إرسال المنتج الرقمي إلى هذا البريد
                </p>
              </div>
              
              <div className='border-t border-gray-700 pt-3'>
                <p className='text-sm text-gray-400'>رقم الهاتف للتواصل:</p>
                <p className='text-lg font-semibold'>
                  {customerPhone || 'غير متوفر'}
                </p>
                <p className='text-xs text-gray-400 mt-1'>
                  للتواصل في حالة عدم توفر البريد الإلكتروني
                </p>
              </div>
              
              {!isModerator && (
                <>
                  <div className='border-t border-gray-700 pt-3'>
                    <p className='text-sm text-gray-400'>اسم العميل:</p>
                    <p className='text-base'>{order.user?.name || 'غير متوفر'}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-400'>رقم هاتف الحساب:</p>
                    <p className='text-base'>{order.user?.phone || 'غير متوفر'}</p>
                  </div>
                </>
              )}
            </div>

            {isDelivered ? (
              <Badge className='mt-3'>
                تم التسليم في {deliveredAt ? formatDateTime(deliveredAt).dateTime : 'غير محدد'}
              </Badge>
            ) : (
              <div className='mt-3'>
                {' '}
                <Badge variant='destructive'>لم يتم التسليم بعد</Badge>
                <div className='mt-2'>
                  <strong>موعد التسليم المتوقع:</strong> <br />
                  {expectedDeliveryDate ? formatDateTime(expectedDeliveryDate).dateTime : 'غير محدد'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Card */}
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>طريقة الدفع</h2>
            <div className='space-y-3'>
              <div>
                <p className='text-sm text-gray-400'>طريقة الدفع:</p>
                <p className='text-lg font-semibold'>{paymentMethod || 'غير محدد'}</p>
              </div>
              
              {paymentNumber && (
                <div>
                  <p className='text-sm text-gray-400'>رقم الدفع للعميل:</p>
                  <p className='text-lg font-semibold'>{paymentNumber}</p>
                </div>
              )}

              {transactionImage && (
                <div>
                  <p className='text-sm text-gray-400 mb-2'>صورة المعاملة:</p>
                  <a 
                    href={transactionImage} 
                    target='_blank' 
                    rel='noopener noreferrer'
                    className='block'
                  >
                    <div className='relative w-full max-w-md h-64 border border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity'>
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
            </div>

            {isPaid ? (
              <Badge className='mt-3'>تم الدفع في {paidAt ? formatDateTime(paidAt).dateTime : 'غير محدد'}</Badge>
            ) : (
              <Badge variant='destructive' className='mt-3'>لم يتم الدفع بعد</Badge>
            )}
          </CardContent>
        </Card>

        {/* Order Items Card */}
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>تفاصيل الطلب</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-right'>المنتج</TableHead>
                  <TableHead className='text-right'>الكمية</TableHead>
                  <TableHead className='text-right'>السعر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItemsList.map((item, index) => (
                  <TableRow key={item.slug || item.productId || `item-${index}`}>
                    <TableCell>
                      <Link
                        href={`/product/${item.slug || '#'}`}
                        className='flex items-center'
                      >
                        <Image
                          src={item.image || '/placeholder-image.jpg'}
                          alt={item.name || 'Product'}
                          width={50}
                          height={50}
                        ></Image>
                        <span className='px-2'>{item.name || 'منتج غير معروف'}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className='px-2'>{item.quantity || 0}</span>
                    </TableCell>
                    <TableCell className='text-right'>
                      <ProductPrice price={item.price || 0} plain />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardContent className='p-4 space-y-4 gap-4'>
            <h2 className='text-xl pb-4'>ملخص الطلب</h2>
            <div className='flex justify-between'>
              <div>المنتجات</div>
              <div>
                {' '}
                <ProductPrice price={itemsPrice || 0} plain />
              </div>
            </div>
            <div className='flex justify-between font-bold text-lg'>
              <div>المجموع الكلي</div>
              <div>
                {' '}
                <ProductPrice price={totalPrice || 0} plain />
              </div>
            </div>

            {(isAdmin || isModerator) && !isPaid && (
              <ActionButton
                caption='تحديد كمدفوع'
                action={() => updateOrderToPaid(order.id)}
              />
            )}
            {(isAdmin || isModerator) && isPaid && !isDelivered && (
              <ActionButton
                caption='تحديد كمُسلم'
                action={() => deliverOrder(order.id)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

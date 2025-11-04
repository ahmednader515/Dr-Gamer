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
        Order not found
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
        No products in this order
        <br />
        <small className="text-xs mt-2">
          Items: {items?.length || 0}, Order Items: {orderItems?.length || 0}
        </small>
      </div>
    )
  }

  return (
    <div className='grid md:grid-cols-3 md:gap-5' dir='ltr'>
      <div className='overflow-x-auto md:col-span-2 space-y-4'>
        
        {/* Customer Contact Info Card */}
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>Contact Information</h2>
            <div className='space-y-3'>
              <div>
                <p className='text-sm text-gray-400'>Email:</p>
                <p className='text-lg font-semibold'>
                  {customerEmail || 'Not available'}
                </p>
                <p className='text-xs text-gray-400 mt-1'>
                  Digital product will be sent to this email
                </p>
              </div>
              
              <div className='border-t border-gray-700 pt-3'>
                <p className='text-sm text-gray-400'>Phone Number:</p>
                <p className='text-lg font-semibold'>
                  {customerPhone || 'Not available'}
                </p>
                <p className='text-xs text-gray-400 mt-1'>
                  For contact if email is unavailable
                </p>
              </div>
              
              {!isModerator && (
                <>
                  <div className='border-t border-gray-700 pt-3'>
                    <p className='text-sm text-gray-400'>Customer Name:</p>
                    <p className='text-base'>{order.user?.name || 'Not available'}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-400'>Account Email:</p>
                    <p className='text-base'>{order.user?.email || 'Not available'}</p>
                  </div>
                </>
              )}
            </div>

            {isDelivered ? (
              <Badge className='mt-3'>
                Delivered on {deliveredAt ? formatDateTime(deliveredAt).dateTime : 'Not specified'}
              </Badge>
            ) : (
              <div className='mt-3'>
                {' '}
                <Badge variant='destructive'>Not delivered yet</Badge>
                <div className='mt-2'>
                  <strong>Expected Delivery:</strong> <br />
                  {expectedDeliveryDate ? formatDateTime(expectedDeliveryDate).dateTime : 'Not specified'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Card */}
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>Payment Method</h2>
            <div className='space-y-3'>
              <div>
                <p className='text-sm text-gray-400'>Payment Method:</p>
                <p className='text-lg font-semibold'>{paymentMethod || 'Not specified'}</p>
              </div>
              
              {paymentNumber && (
                <div>
                  <p className='text-sm text-gray-400'>Customer Payment Number:</p>
                  <p className='text-lg font-semibold'>{paymentNumber}</p>
                </div>
              )}

              {transactionImage && (
                <div>
                  <p className='text-sm text-gray-400 mb-2'>Transaction Screenshot:</p>
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
                  <p className='text-xs text-gray-500 mt-1'>Click to view full size image</p>
                </div>
              )}
            </div>

            {isPaid ? (
              <Badge className='mt-3'>Paid on {paidAt ? formatDateTime(paidAt).dateTime : 'Not specified'}</Badge>
            ) : (
              <Badge variant='destructive' className='mt-3'>Not paid yet</Badge>
            )}
          </CardContent>
        </Card>

        {/* Order Items Card */}
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>Order Details</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-left'>Product</TableHead>
                  <TableHead className='text-left'>Quantity</TableHead>
                  <TableHead className='text-left'>Price</TableHead>
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
                        <span className='px-2'>{item.name || 'Unknown product'}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className='px-2'>{item.quantity || 0}</span>
                    </TableCell>
                    <TableCell className='text-left'>
                      <ProductPrice price={item.price || 0} plain />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Account Credentials Section */}
            {orderItemsList.some((item: any) => item.accountUsername || item.accountPassword) && (
              <div className='mt-6 pt-6 border-t border-gray-700'>
                <h3 className='text-lg font-semibold mb-4'>Account Credentials</h3>
                <div className='space-y-4'>
                  {orderItemsList.map((item: any, index: number) => {
                    if (!item.accountUsername && !item.accountPassword) return null
                    
                    return (
                      <div key={`creds-${index}`} className='bg-gray-800 border border-gray-700 rounded-lg p-4'>
                        <h4 className='font-semibold text-purple-400 mb-3'>{item.name}</h4>
                        <div className='space-y-2 text-sm'>
                          {item.accountUsername && (
                            <div>
                              <span className='text-gray-400'>Email/Username: </span>
                              <span className='text-white font-medium'>{item.accountUsername}</span>
                            </div>
                          )}
                          {item.accountPassword && (
                            <div>
                              <span className='text-gray-400'>Password: </span>
                              <span className='text-white font-medium'>{item.accountPassword}</span>
                            </div>
                          )}
                          {item.accountBackupCode && (
                            <div>
                              <span className='text-gray-400'>Backup Code: </span>
                              <span className='text-white font-medium'>{item.accountBackupCode}</span>
                            </div>
                          )}
                          {item.disableTwoStepVerified && (
                            <div className='flex items-center gap-2 text-green-400'>
                              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                              </svg>
                              <span>2-Step Verification Disabled</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardContent className='p-4 space-y-4 gap-4'>
            <h2 className='text-xl pb-4'>Order Summary</h2>
            <div className='flex justify-between'>
              <div>Products</div>
              <div>
                {' '}
                <ProductPrice price={itemsPrice || 0} plain />
              </div>
            </div>
            <div className='flex justify-between font-bold text-lg'>
              <div>Total</div>
              <div>
                {' '}
                <ProductPrice price={totalPrice || 0} plain />
              </div>
            </div>

            {(isAdmin || isModerator) && !isPaid && (
              <ActionButton
                caption='Mark as Paid'
                action={() => updateOrderToPaid(order.id)}
              />
            )}
            {(isAdmin || isModerator) && isPaid && !isDelivered && (
              <ActionButton
                caption='Mark as Delivered'
                action={() => deliverOrder(order.id)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

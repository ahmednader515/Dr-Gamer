'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { IOrderList } from '@/types'
import { formatDateTime } from '@/lib/utils'
import ProductPrice from '../product/product-price'
import ActionButton from '../action-button'
import {
  adminCancelOrder,
  adminHandleOrderRefund,
  deliverOrder,
  requestOrderRefund,
  updateOrderToPaid,
} from '@/lib/actions/order.actions'
import { UploadButton } from '@/lib/uploadthing'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

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
  const isAdminOrModerator = isAdmin || isModerator
  const { toast } = useToast()
  const [isUserSubmitting, startUserTransition] = useTransition()
  const [isAdminSubmitting, startAdminTransition] = useTransition()
  const {
    customerEmail,
    customerPhone,
    items,
    orderItems,
    itemsPrice,
    totalPrice,
    paymentMethod,
    paymentNumber,
    transactionImage,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
    expectedDeliveryDate,
    refundRequested,
    refundStatus,
    refundReason,
    refundTransactionImage,
    refundRequestedAt,
    refundProcessedAt,
    isCancelled,
    cancelledAt,
  } = order

  const [refundRequestedState, setRefundRequestedState] = useState<boolean>(refundRequested ?? false)
  const [refundStatusState, setRefundStatusState] = useState<string>(refundStatus || 'none')
  const [refundReasonState, setRefundReasonState] = useState<string>(refundReason || '')
  const [refundImageState, setRefundImageState] = useState<string>(refundTransactionImage || '')
  const [refundRequestedAtState, setRefundRequestedAtState] = useState<string | null>(refundRequestedAt || null)
  const [refundProcessedAtState, setRefundProcessedAtState] = useState<string | null>(refundProcessedAt || null)
  const [isCancelledState, setIsCancelledState] = useState<boolean>(isCancelled ?? false)
  const [cancelledAtState, setCancelledAtState] = useState<string | null>(cancelledAt || null)
  const [adminAction, setAdminAction] = useState<'approve' | 'reject' | 'pending' | null>(null)
  const [isCancellingOrder, startCancelTransition] = useTransition()

  const canRequestRefund = isPaid && !isCancelledState
  const canCancelOrder = !isCancelledState && !isDelivered

  const formatDateValue = (value: string | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return formatDateTime(date as Date).dateTime
  }

  const handleRefundRequest = () => {
    if (!canRequestRefund) {
      toast({ description: 'Refunds are only available for paid orders.', variant: 'destructive' })
      return
    }
    if (!refundReasonState.trim()) {
      toast({
        description: 'Please provide a refund reason.',
        variant: 'destructive',
      })
      return
    }

    if (!refundImageState) {
      toast({
        description: 'Please upload a refund transaction image.',
        variant: 'destructive',
      })
      return
    }

    startUserTransition(async () => {
      const res = await requestOrderRefund(order.id, refundReasonState.trim(), refundImageState)
      if (res.success) {
        toast({ description: res.message })
        setRefundRequestedState(true)
        setRefundStatusState('pending')
        setRefundRequestedAtState(new Date().toISOString())
        setRefundProcessedAtState(null)
        setIsCancelledState(false)
        setCancelledAtState(null)
      } else {
        toast({ description: res.message, variant: 'destructive' })
      }
    })
  }

  const handleAdminRefundDecision = (decision: 'approve' | 'reject' | 'pending') => {
    const trimmedReason = refundReasonState.trim()
    if ((decision === 'approve' || decision === 'pending') && !trimmedReason) {
      toast({
        description: 'Please provide a reason before proceeding.',
        variant: 'destructive',
      })
      return
    }

    if (decision !== 'reject') {
      setRefundReasonState(trimmedReason)
    }

    setAdminAction(decision)
    startAdminTransition(async () => {
      try {
        const res = await adminHandleOrderRefund(order.id, decision, {
          reason: decision === 'reject' ? refundReasonState : trimmedReason,
          transactionImage: refundImageState,
        })

        if (res.success) {
          toast({ description: res.message })
          const data = res.data || {}
          setRefundRequestedState(!!data.refundRequested)
          setRefundStatusState(data.refundStatus || (decision === 'approve' ? 'approved' : 'rejected'))
          if (data.refundReason !== undefined) {
            setRefundReasonState(data.refundReason || '')
          }
          if (data.refundTransactionImage !== undefined) {
            setRefundImageState(data.refundTransactionImage || '')
          }
          if (data.refundRequestedAt !== undefined) {
            setRefundRequestedAtState(data.refundRequestedAt || null)
          }
          setRefundProcessedAtState(data.refundProcessedAt || null)
          setIsCancelledState(!!data.isCancelled)
          setCancelledAtState(data.cancelledAt || null)
        } else {
          toast({ description: res.message, variant: 'destructive' })
        }
      } finally {
        setAdminAction(null)
      }
    })
  }

  const handleCancelOrder = () => {
    if (!canCancelOrder) {
      toast({ description: 'This order can no longer be cancelled.', variant: 'destructive' })
      return
    }

    const trimmedReason = refundReasonState.trim()

    startCancelTransition(async () => {
      const res = await adminCancelOrder(
        order.id,
        trimmedReason || (isPaid ? 'Customer requested cancellation and refund' : 'Customer cancelled before payment confirmation'),
        refundImageState || undefined
      )

      if (res.success) {
        toast({ description: 'Order cancelled successfully.' })
        const data = res.data || {}
        setRefundRequestedState(!!data.refundRequested)
        setRefundStatusState(data.refundStatus || 'approved')
        if (data.refundReason !== undefined) {
          setRefundReasonState(data.refundReason || '')
        }
        if (data.refundTransactionImage !== undefined) {
          setRefundImageState(data.refundTransactionImage || '')
        }
        if (data.refundRequestedAt !== undefined) {
          setRefundRequestedAtState(data.refundRequestedAt || null)
        }
        setRefundProcessedAtState(data.refundProcessedAt || null)
        setIsCancelledState(!!data.isCancelled)
        setCancelledAtState(data.cancelledAt || null)
      } else {
        toast({ description: res.message, variant: 'destructive' })
      }
    })
  }

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

            {isCancelledState && (
              <Badge variant='destructive' className='mt-2 justify-center'>
                Order Cancelled
              </Badge>
            )}

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

            {!isAdminOrModerator && (canRequestRefund || canCancelOrder) && (
              <div className='border-t border-gray-700 pt-4 space-y-4'>
                <h3 className='text-lg font-semibold'>Manage Your Order</h3>
                {refundRequestedState && canRequestRefund ? (
                  <div className='space-y-2 text-sm'>
                    <p className='text-gray-300'>
                      <span className='font-medium text-white'>Status:</span> {refundStatusState}
                    </p>
                    {refundRequestedAtState && (
                      <p className='text-gray-300'>
                        <span className='font-medium text-white'>Requested:</span> {formatDateValue(refundRequestedAtState)}
                      </p>
                    )}
                    {refundProcessedAtState && (
                      <p className='text-gray-300'>
                        <span className='font-medium text-white'>Processed:</span> {formatDateValue(refundProcessedAtState)}
                      </p>
                    )}
                    {isCancelledState && cancelledAtState && (
                      <p className='text-gray-300'>
                        <span className='font-medium text-white'>Cancelled:</span> {formatDateValue(cancelledAtState)}
                      </p>
                    )}
                    {refundReasonState && (
                      <p className='text-gray-300'>
                        <span className='font-medium text-white'>Reason:</span> {refundReasonState}
                      </p>
                    )}
                    {refundImageState && (
                      <div className='space-y-2'>
                        <p className='text-gray-300 font-medium'>Transaction Screenshot:</p>
                        <a
                          href={refundImageState}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='block'
                        >
                          <div className='relative w-full h-48 border border-gray-700 rounded-lg overflow-hidden hover:opacity-90 transition-opacity'>
                            <img
                              src={refundImageState}
                              alt='Refund transaction screenshot'
                              className='w-full h-full object-contain bg-gray-900'
                            />
                          </div>
                        </a>
                        <p className='text-xs text-gray-500'>Click to view full size image</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <div>
                      <label className='text-sm text-gray-400 block mb-1'>Reason (refund or cancellation)</label>
                      <Textarea
                        value={refundReasonState}
                        onChange={(event) => setRefundReasonState(event.target.value)}
                        placeholder='Tell us why you need to cancel or request a refund'
                        className='min-h-[100px]'
                      />
                    </div>
                    {canRequestRefund && (
                      <div className='space-y-2'>
                        <label className='text-sm text-gray-400 block'>Refund Transaction Screenshot</label>
                        {refundImageState ? (
                          <div className='space-y-2'>
                            <div className='relative w-full h-48 border border-gray-700 rounded-lg overflow-hidden'>
                              <img
                                src={refundImageState}
                                alt='Refund transaction screenshot'
                                className='w-full h-full object-contain bg-gray-900'
                              />
                            </div>
                            <Button
                              variant='outline'
                              className='w-full'
                              onClick={() => setRefundImageState('')}
                            >
                              Remove Image
                            </Button>
                          </div>
                        ) : (
                          <UploadButton
                            endpoint='imageUploader'
                            onClientUploadComplete={(res) => {
                              if (res && res[0]) {
                                const url = res[0].url
                                setRefundImageState(url)
                                toast({ description: 'Image uploaded successfully' })
                              }
                            }}
                            onUploadError={(error: Error) => {
                              toast({ description: `Error uploading image: ${error.message}`, variant: 'destructive' })
                            }}
                            appearance={{
                              button: 'ut-ready:bg-purple-500 ut-ready:bg-opacity-20 ut-uploading:cursor-not-allowed ut-uploading:bg-gray-500 ut-uploading:bg-opacity-20 bg-gray-800 text-white border border-gray-700 cursor-pointer rounded-lg px-4 py-2 text-sm',
                              container: 'w-full',
                              allowedContent: 'text-gray-400 text-xs mt-2',
                            }}
                          />
                        )}
                      </div>
                    )}
                    <div className='grid gap-2 sm:grid-cols-2'>
                      {canRequestRefund && (
                        <Button
                          className='w-full bg-purple-600 hover:bg-purple-700 text-white'
                          onClick={handleRefundRequest}
                          disabled={isUserSubmitting}
                        >
                          {isUserSubmitting ? (
                            <span className='flex items-center gap-2 justify-center'>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              Sending...
                            </span>
                          ) : (
                            'Submit Refund Request'
                          )}
                        </Button>
                      )}
                      {canCancelOrder && (
                        <Button
                          variant='destructive'
                          className='w-full'
                          onClick={handleCancelOrder}
                          disabled={isCancellingOrder}
                        >
                          {isCancellingOrder ? (
                            <span className='flex items-center gap-2 justify-center'>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              Cancelling...
                            </span>
                          ) : (
                            'Cancel Entire Order'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAdminOrModerator && (
              <div className='border-t border-gray-700 pt-4 space-y-4 text-sm'>
                <div className='space-y-2'>
                  <h3 className='text-lg font-semibold'>Refund Management</h3>
                  <p className='text-gray-300'>
                    <span className='font-medium text-white'>Current Status:</span> {refundStatusState}
                  </p>
                  {refundRequestedAtState && (
                    <p className='text-gray-300'>
                      <span className='font-medium text-white'>Requested:</span> {formatDateValue(refundRequestedAtState)}
                    </p>
                  )}
                  {refundProcessedAtState && (
                    <p className='text-gray-300'>
                      <span className='font-medium text-white'>Processed:</span> {formatDateValue(refundProcessedAtState)}
                    </p>
                  )}
                  {isCancelledState && cancelledAtState && (
                    <p className='text-gray-300'>
                      <span className='font-medium text-white'>Cancelled:</span> {formatDateValue(cancelledAtState)}
                    </p>
                  )}
                </div>

                <div className='space-y-3'>
                  <div>
                    <label className='text-sm text-gray-400 block mb-1'>Refund Notes / Reason</label>
                    <Textarea
                      value={refundReasonState}
                      onChange={(event) => setRefundReasonState(event.target.value)}
                      placeholder='Add admin notes about the refund decision'
                      className='min-h-[100px]'
                      readOnly={!!refundReason && refundReason.trim() !== ''}
                      disabled={!!refundReason && refundReason.trim() !== ''}
                    />
                    {!!refundReason && refundReason.trim() !== '' && (
                      <p className='text-xs text-gray-500 mt-1'>Reason provided by customer. Editing disabled.</p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm text-gray-400 block'>Refund Transaction Screenshot</label>
                    {refundImageState ? (
                      <div className='space-y-2'>
                        <div className='relative w-full h-48 border border-gray-700 rounded-lg overflow-hidden'>
                          <img
                            src={refundImageState}
                            alt='Refund transaction screenshot'
                            className='w-full h-full object-contain bg-gray-900'
                          />
                        </div>
                        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                          <Button
                            variant='outline'
                            onClick={() => setRefundImageState('')}
                            disabled={isAdminSubmitting}
                          >
                            Remove Image
                          </Button>
                          <a
                            href={refundImageState}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center justify-center rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors'
                          >
                            View Image
                          </a>
                        </div>
                      </div>
                    ) : (
                      <UploadButton
                        endpoint='imageUploader'
                        onClientUploadComplete={(res) => {
                          if (res && res[0]) {
                            const url = res[0].url
                            setRefundImageState(url)
                            toast({ description: 'Image uploaded successfully' })
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast({ description: `Error uploading image: ${error.message}`, variant: 'destructive' })
                        }}
                        appearance={{
                          button: 'ut-ready:bg-purple-500 ut-ready:bg-opacity-20 ut-uploading:cursor-not-allowed ut-uploading:bg-gray-500 ut-uploading:bg-opacity-20 bg-gray-800 text-white border border-gray-700 cursor-pointer rounded-lg px-4 py-2 text-sm',
                          container: 'w-full',
                          allowedContent: 'text-gray-400 text-xs mt-2',
                        }}
                      />
                    )}
                  </div>
                  <div className='grid gap-2 sm:grid-cols-3'>
                    <Button
                      variant='outline'
                      className='w-full border border-purple-500 text-purple-400 hover:bg-purple-500/10'
                      onClick={() => handleAdminRefundDecision('pending')}
                      disabled={isAdminSubmitting || refundStatusState === 'pending' || isCancelledState}
                    >
                      {isAdminSubmitting && adminAction === 'pending' ? (
                        <span className='flex items-center gap-2 justify-center'>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          Saving...
                        </span>
                      ) : (
                        'Mark Pending'
                      )}
                    </Button>
                    <Button
                      className='w-full bg-red-600 hover:bg-red-700 text-white'
                      onClick={() => handleAdminRefundDecision('approve')}
                      disabled={isAdminSubmitting || refundStatusState === 'approved'}
                    >
                      {isAdminSubmitting && adminAction === 'approve' ? (
                        <span className='flex items-center gap-2 justify-center'>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          Approving...
                        </span>
                      ) : (
                        'Approve & Cancel'
                      )}
                    </Button>
                    <Button
                      variant='secondary'
                      className='w-full bg-gray-700 hover:bg-gray-600 text-white'
                      onClick={() => handleAdminRefundDecision('reject')}
                      disabled={isAdminSubmitting || refundStatusState === 'rejected'}
                    >
                      {isAdminSubmitting && adminAction === 'reject' ? (
                        <span className='flex items-center gap-2 justify-center'>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          Rejecting...
                        </span>
                      ) : (
                        'Reject Request'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

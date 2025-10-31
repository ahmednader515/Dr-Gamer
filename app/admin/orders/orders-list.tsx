'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import ProductPrice from '@/components/shared/product/product-price'
import DeleteDialog from '@/components/shared/delete-dialog'
import { useToast } from '@/hooks/use-toast'

type Order = {
  id: string
  createdAt: Date
  totalPrice: number
  promoCode: string | null
  discountPercent: number | null
  discountAmount: number | undefined
  isPaid: boolean
  isDelivered: boolean
  user: {
    name: string
    phone: string
  }
}

type OrdersListProps = {
  orders: Order[]
  totalPages: number
  currentPage: number
  userRole: string
}

export default function OrdersList({ orders, totalPages, currentPage, userRole }: OrdersListProps) {
  const isModerator = userRole === 'Moderator'
  const { toast } = useToast()

  const handleDeleteOrder = async (id: string) => {
    try {
      // Call the API route to delete the order
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: 'Order Deleted Successfully',
          description: result.message,
        })
        // Refresh the page to show updated data
        window.location.reload()
        return { success: true, message: result.message }
      } else {
        toast({
          title: 'Error Deleting Order',
          description: result.message || 'An unexpected error occurred',
          variant: 'destructive',
        })
        return { success: false, message: result.message || 'An unexpected error occurred' }
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      toast({
        title: 'Error Deleting Order',
        description: 'An unexpected error occurred while deleting the order',
        variant: 'destructive',
      })
      return { success: false, message: 'An error occurred during deletion' }
    }
  }

  return (
    <div className='space-y-4 ltr text-left' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <h1 className='h1-bold'>Orders</h1>
      
      {/* Desktop Table - Hidden on mobile */}
      <div className='hidden md:block overflow-x-auto'>
        <Table className="admin-table border border-gray-700 rounded-lg overflow-hidden shadow-lg">
          <TableHeader>
            <TableRow className="bg-gray-800 border-b-2 border-gray-700">
              <TableHead className='text-left bg-gray-800 text-purple-400 font-semibold py-4 px-4'>Date</TableHead>
              <TableHead className='text-left bg-gray-800 text-purple-400 font-semibold py-4 px-4'>Customer</TableHead>
              <TableHead className='text-left bg-gray-800 text-purple-400 font-semibold py-4 px-4'>Total</TableHead>
              <TableHead className='text-left bg-gray-800 text-purple-400 font-semibold py-4 px-4'>Paid</TableHead>
              <TableHead className='text-left bg-gray-800 text-purple-400 font-semibold py-4 px-4'>Delivered</TableHead>
              <TableHead className='text-left bg-gray-800 text-purple-400 font-semibold py-4 px-4'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-b border-gray-700">
                <TableCell className='py-4 px-4'>
                  {formatDateTime(order.createdAt).dateTime}
                </TableCell>
                <TableCell className='py-4 px-4'>
                  <div>
                    <div className='font-medium'>{isModerator ? '***' : order.user.name}</div>
                    <div className='text-sm text-gray-500'>{isModerator ? '***' : order.user.phone}</div>
                  </div>
                </TableCell>
                <TableCell className='py-4 px-4'>
                  <ProductPrice price={order.totalPrice} />
                </TableCell>
                <TableCell className='py-4 px-4'>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    order.isPaid 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {order.isPaid ? 'Paid' : 'Not Paid'}
                  </span>
                </TableCell>
                <TableCell className='py-4 px-4'>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    order.isDelivered 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.isDelivered ? 'Delivered' : 'Pending Delivery'}
                  </span>
                </TableCell>
                <TableCell className='py-4 px-4'>
                  <div className='flex gap-2'>
                    <Button asChild size='sm'>
                      <Link href={`/admin/orders/${order.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <DeleteDialog
                      id={order.id}
                      action={handleDeleteOrder}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards - Visible only on mobile */}
      <div className='md:hidden space-y-4'>
        {orders.map((order) => (
          <div key={order.id} className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm p-4 space-y-3">
            {/* Order Header */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {formatDateTime(order.createdAt).dateTime}
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  order.isPaid 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {order.isPaid ? 'مدفوع' : 'غير مدفوع'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  order.isDelivered 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.isDelivered ? 'مُسلم' : 'قيد التوصيل'}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="border-t border-gray-100 pt-3">
              <div className="font-medium text-gray-900">{isModerator ? 'Customer' : order.user.name}</div>
              <div className="text-sm text-gray-500">{isModerator ? '***' : order.user.phone}</div>
            </div>

            {/* Order Total */}
            {order.promoCode && (
              <div className="border-t border-gray-700 pt-3">
                <div className="text-sm text-gray-400 mb-1">Promo Code:</div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-medium">{order.promoCode}</span>
                  <span className="text-xs text-gray-500">({order.discountPercent}%)</span>
                </div>
                <div className="text-sm text-purple-400 mt-1">
                  - <ProductPrice price={order.discountAmount || 0} />
                </div>
              </div>
            )}

            <div className="border-t border-gray-700 pt-3">
              <div className="text-sm text-gray-400 mb-1">Total:</div>
              <div className="text-lg font-semibold text-purple-400">
                <ProductPrice price={order.totalPrice} />
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 pt-3 flex gap-2">
              <Button asChild size='sm' className="flex-1">
                <Link href={`/admin/orders/${order.id}`}>
                  عرض التفاصيل
                </Link>
              </Button>
              <DeleteDialog
                id={order.id}
                action={handleDeleteOrder}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Simple pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          {currentPage > 1 && (
            <Button asChild variant="outline">
              <Link href={`/admin/orders?page=${currentPage - 1}`}>
                Previous
              </Link>
            </Button>
          )}
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          {currentPage < totalPages && (
            <Button asChild variant="outline">
              <Link href={`/admin/orders?page=${currentPage + 1}`}>
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

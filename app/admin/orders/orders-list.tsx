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
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

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
    email: string
  }
}

type OrdersListProps = {
  orders: Order[]
  totalPages: number
  currentPage: number
  userRole: string
  currentSearch: string
  currentIsPaid: string
  currentIsDelivered: string
}

export default function OrdersList({ 
  orders, 
  totalPages, 
  currentPage, 
  userRole,
  currentSearch,
  currentIsPaid,
  currentIsDelivered
}: OrdersListProps) {
  const isModerator = userRole === 'Moderator'
  const { toast } = useToast()
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(currentSearch)

  const handleSearch = (value: string) => {
    const params = new URLSearchParams()
    if (value) params.set('search', value)
    if (currentIsPaid) params.set('isPaid', currentIsPaid)
    if (currentIsDelivered) params.set('isDelivered', currentIsDelivered)
    params.set('page', '1')
    router.push(`/admin/orders?${params.toString()}`)
  }

  const handleFilterChange = (filterType: 'isPaid' | 'isDelivered', value: string) => {
    const params = new URLSearchParams()
    if (currentSearch) params.set('search', currentSearch)
    if (filterType === 'isPaid') {
      if (value !== 'all') params.set('isPaid', value)
      if (currentIsDelivered) params.set('isDelivered', currentIsDelivered)
    } else {
      if (currentIsPaid) params.set('isPaid', currentIsPaid)
      if (value !== 'all') params.set('isDelivered', value)
    }
    params.set('page', '1')
    router.push(`/admin/orders?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchInput('')
    router.push('/admin/orders')
  }

  const handleDeleteOrder = async (id: string) => {
    try {
      // Call the API route to delete the order
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: 'Order deleted successfully',
          description: result.message,
        })
        // Refresh the page to show updated data
        window.location.reload()
        return { success: true, message: result.message }
      } else {
        toast({
          title: 'Error deleting order',
          description: result.message || 'An unexpected error occurred',
          variant: 'destructive',
        })
        return { success: false, message: result.message || 'An unexpected error occurred' }
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      toast({
        title: 'Error deleting order',
        description: 'An unexpected error occurred while deleting the order',
        variant: 'destructive',
      })
      return { success: false, message: 'An error occurred during deletion' }
    }
  }

  const hasActiveFilters = currentSearch || currentIsPaid || currentIsDelivered

  return (
    <div className='space-y-4 ltr text-left' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className='flex items-center justify-between'>
        <h1 className='h1-bold'>Orders</h1>
        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant='outline'
            size='sm'
            className='gap-2'
          >
            <X className='h-4 w-4' />
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className='bg-gray-900 rounded-lg p-4 space-y-4'>
        {/* Search Bar */}
        <div className='flex gap-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
            <Input
              type='text'
              placeholder='Search by customer name, email, or order ID...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchInput)
                }
              }}
              className='pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500'
            />
          </div>
          <Button
            onClick={() => handleSearch(searchInput)}
            className='bg-purple-600 hover:bg-purple-700'
          >
            Search
          </Button>
        </div>

        {/* Filters */}
        <div className='flex flex-wrap gap-3'>
          <div className='flex-1 min-w-[200px]'>
            <label className='text-sm text-gray-400 mb-2 block'>Payment Status</label>
            <Select
              value={currentIsPaid || 'all'}
              onValueChange={(value) => handleFilterChange('isPaid', value)}
            >
              <SelectTrigger className='bg-gray-800 border-gray-700 text-white'>
                <SelectValue placeholder='All Payment Statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Payment Statuses</SelectItem>
                <SelectItem value='true'>Paid Only</SelectItem>
                <SelectItem value='false'>Unpaid Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex-1 min-w-[200px]'>
            <label className='text-sm text-gray-400 mb-2 block'>Delivery Status</label>
            <Select
              value={currentIsDelivered || 'all'}
              onValueChange={(value) => handleFilterChange('isDelivered', value)}
            >
              <SelectTrigger className='bg-gray-800 border-gray-700 text-white'>
                <SelectValue placeholder='All Delivery Statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Delivery Statuses</SelectItem>
                <SelectItem value='true'>Delivered Only</SelectItem>
                <SelectItem value='false'>Pending Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className='flex flex-wrap gap-2 pt-2'>
            <span className='text-sm text-gray-400'>Active filters:</span>
            {currentSearch && (
              <span className='text-xs bg-purple-600 text-white px-3 py-1 rounded-full'>
                Search: "{currentSearch}"
              </span>
            )}
            {currentIsPaid === 'true' && (
              <span className='text-xs bg-green-600 text-white px-3 py-1 rounded-full'>
                Paid
              </span>
            )}
            {currentIsPaid === 'false' && (
              <span className='text-xs bg-orange-600 text-white px-3 py-1 rounded-full'>
                Unpaid
              </span>
            )}
            {currentIsDelivered === 'true' && (
              <span className='text-xs bg-blue-600 text-white px-3 py-1 rounded-full'>
                Delivered
              </span>
            )}
            {currentIsDelivered === 'false' && (
              <span className='text-xs bg-yellow-600 text-white px-3 py-1 rounded-full'>
                Pending
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className='text-sm text-gray-400'>
          Showing {orders.length} of {orders.length} orders
          {hasActiveFilters && ' (filtered)'}
        </div>
      </div>
      
      {/* Desktop Table - Hidden on mobile */}
      <div className='hidden md:block overflow-x-auto'>
        <Table className="admin-table border border-gray-700 rounded-lg overflow-hidden shadow-lg">
          <TableHeader>
            <TableRow className="bg-gray-800 border-b-2 border-gray-700">
              <TableHead className='text-left bg-gray-800 text-purple-400 font-semibold py-4 px-4'>Date</TableHead>
              <TableHead className='text-left bg-gray-800 text-purple-400 font-semibold py-4 px-4'>Customer</TableHead>
              <TableHead className='text-left bg-gray-800 text-purple-400 font-semibold py-4 px-4'>Total</TableHead>
              <TableHead className='text-left bg-gray-800 text-purple-400 font-semibold py-4 px-4'>Paid</TableHead>
              <TableHead className='text-left bg-gray-800 text-purple-400 font-semibold py-4 px-4'>Delivery</TableHead>
              <TableHead className='text-left bg-gray-800 text-purple-400 font-semibold py-4 px-4'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="bg-gray-800 hover:bg-gray-700 border-b border-gray-700">
                <TableCell className='text-left py-4 px-4'>
                  {formatDateTime(order.createdAt).dateTime}
                </TableCell>
                <TableCell className='text-left py-4 px-4'>
                  <div>
                    <div className='font-medium'>{isModerator ? '***' : order.user.name}</div>
                    <div className='text-sm text-gray-500'>{isModerator ? '***' : order.user.email}</div>
                  </div>
                </TableCell>
                <TableCell className='text-left py-4 px-4'>
                  <ProductPrice price={order.totalPrice} />
                </TableCell>
                <TableCell className='text-left py-4 px-4'>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    order.isPaid 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {order.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </TableCell>
                <TableCell className='text-left py-4 px-4'>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    order.isDelivered 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.isDelivered ? 'Delivered' : 'Pending'}
                  </span>
                </TableCell>
                <TableCell className='text-left py-4 px-4'>
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
              <div className="text-sm text-gray-400">
                {formatDateTime(order.createdAt).dateTime}
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  order.isPaid 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {order.isPaid ? 'Paid' : 'Unpaid'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  order.isDelivered 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.isDelivered ? 'Delivered' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="border-t border-gray-700 pt-3">
              <div className="font-medium text-white">{isModerator ? 'Customer' : order.user.name}</div>
              <div className="text-sm text-gray-400">{isModerator ? '***' : order.user.email}</div>
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
            <div className="border-t border-gray-700 pt-3 flex gap-2">
              <Button asChild size='sm' className="flex-1">
                <Link href={`/admin/orders/${order.id}`}>
                  View Details
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
          
          <span className="text-sm text-white">
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

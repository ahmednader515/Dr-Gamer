'use client'
import { BadgeDollarSign, Barcode, CreditCard, Users } from 'lucide-react'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { calculatePastDate, formatDateTime, formatNumber } from '@/lib/utils'

import React, { useEffect, useRef, useState, useTransition } from 'react'
import { DateRange } from 'react-day-picker'
import { getOverviewChartsData, getLatestOrdersForOverview, getOverviewHeaderStats } from '@/lib/actions/order.actions'
import { CalendarDateRangePicker } from './date-range-picker'
import { IOrderList } from '@/types'
import ProductPrice from '@/components/shared/product/product-price'
import TableChart from './table-chart'
import { Skeleton } from '@/components/ui/skeleton'

export default function OverviewReport({ initialDate, initialHeader }: { initialDate?: DateRange; initialHeader?: { [key: string]: any } }) {
  const [date, setDate] = useState<DateRange | undefined>(
    initialDate || {
      from: calculatePastDate(30),
      to: new Date(),
    }
  )

  // Progressive state slices
  const [header, setHeader] = useState<{ [key: string]: any } | undefined>(initialHeader)
  const [charts, setCharts] = useState<{ [key: string]: any } | undefined>(undefined)
  const [latest, setLatest] = useState<IOrderList[] | undefined>(undefined)
  // Skip first header fetch if SSR provided it
  const skipFirstFetchRef = useRef<boolean>(!!initialHeader)
  const [isPending, startTransition] = useTransition()
  useEffect(() => {
    if (date) {
      if (skipFirstFetchRef.current) {
        skipFirstFetchRef.current = false
        // We have header from server. Fetch charts next, then latest.
        startTransition(async () => {
          try {
            const chartsData = await getOverviewChartsData(date)
            setCharts(chartsData)
            const latestOrders = await getLatestOrdersForOverview()
            setLatest(latestOrders as any)
          } catch (err) {
            console.error('Progressive fetch error:', err)
          }
        })
        return
      }
      startTransition(async () => {
        try {
          // Fetch header first
          const headerData = await getOverviewHeaderStats(date)
          setHeader(headerData)
          // Then charts
          const chartsData = await getOverviewChartsData(date)
          setCharts(chartsData)
          // Finally latest orders
          const latestOrders = await getLatestOrdersForOverview()
          setLatest(latestOrders as any)
        } catch (error) {
          console.error('Error fetching overview data:', error)
          setHeader({ ordersCount: 0, productsCount: 0, usersCount: 0, totalSales: 0 })
          setCharts({ monthlySales: [], salesChartData: [], topSalesCategories: [], topSalesProducts: [] })
          setLatest([] as any)
        }
      })
    }
  }, [date])

  if (!header)
    return (
      <div className='space-y-4 ltr text-left' style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div>
          <h1 className='h1-bold'>Dashboard</h1>
        </div>
        {/* First Row */}
        <div className='flex gap-4'>
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className='h-36 w-full' />
          ))}
        </div>

        {/* Second Row */}
        <div>
          <Skeleton className='h-[30rem] w-full' />
        </div>

        {/* Third Row */}
        <div className='flex gap-4'>
          {[...Array(2)].map((_, index) => (
            <Skeleton key={index} className='h-60 w-full' />
          ))}
        </div>

        {/* Fourth Row */}
        <div className='flex gap-4'>
          {[...Array(2)].map((_, index) => (
            <Skeleton key={index} className='h-60 w-full' />
          ))}
        </div>
      </div>
    )

  return (
    <div className='ltr text-left' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className='flex items-center justify-between mb-2'>
        <h1 className='h1-bold'>Dashboard</h1>
        <CalendarDateRangePicker defaultDate={date} setDate={setDate} />
      </div>
      <div className='space-y-4'>
        <div className='grid gap-4  grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-left'>
                Total Revenue
              </CardTitle>
              <BadgeDollarSign />
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='text-2xl font-bold'>
                <ProductPrice price={header.totalSales} plain />
              </div>
              <div>
                <Link className='text-xs' href='/admin/orders'>
                  View Revenue
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-left'>Paid Orders</CardTitle>
              <CreditCard />
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='text-2xl font-bold'>
                {formatNumber(header.ordersCount)}
              </div>
              <div>
                <Link className='text-xs' href='/admin/orders'>
                  View Paid Orders
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-left'>Customers</CardTitle>
              <Users />
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='text-2xl font-bold'>{header.usersCount}</div>
              <div>
                <Link className='text-xs' href='/admin/users'>
                  View Customers
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-left'>Products</CardTitle>
              <Barcode />
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='text-2xl font-bold'>{header.productsCount}</div>
              <div>
                <Link className='text-xs' href='/admin/products'>
                  View Products
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <Card>
            <CardHeader className='text-left'>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Estimated · Last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {charts ? (
                <TableChart data={charts.monthlySales || []} labelType='month' />
              ) : (
                <Skeleton className='h-60 w-full' />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='text-left'>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>
                From {formatDateTime(date!.from!).dateOnly} to{' '}
                {formatDateTime(date!.to!).dateOnly}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {charts ? (
                <TableChart data={charts.topSalesProducts || []} labelType='product' />
              ) : (
                <Skeleton className='h-60 w-full' />
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className='text-left'>
              <CardTitle>Recent Sales (Paid Orders Only)</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table - Hidden on mobile */}
              <div className='hidden md:block'>
                {latest ? (
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='text-left'>Customer</TableHead>
                      <TableHead className='text-left'>Date</TableHead>
                      <TableHead className='text-left'>Total</TableHead>
                      <TableHead className='text-left'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(latest || []).map((order: IOrderList) => (
                      <TableRow key={order.id} className='bg-gray-800 hover:bg-gray-700 border-b border-gray-700'>
                        <TableCell className='text-left'>
                          {order.user ? order.user.name : 'Deleted user'}
                        </TableCell>

                        <TableCell className='text-left'>
                          {formatDateTime(order.createdAt).dateOnly}
                        </TableCell>
                        <TableCell className='text-left'>
                          <ProductPrice price={order.totalPrice} plain />
                        </TableCell>

                        <TableCell className='text-left'>
                          <Link href={`/admin/orders/${order.id}`}>
                            <span className='px-2'>Details</span>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                ) : (
                  <Skeleton className='h-60 w-full' />
                )}
              </div>

              {/* Mobile Cards - Visible only on mobile */}
              <div className='md:hidden space-y-3'>
                {(latest || []).map((order: IOrderList) => (
                  <div key={order.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                    {/* Customer Name */}
                    <div className="font-medium text-gray-900">
                      {order.user ? order.user.name : 'Deleted user'}
                    </div>
                    
                    {/* Order Details */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{formatDateTime(order.createdAt).dateOnly}</span>
                      <span className="font-semibold text-purple-600">
                        <ProductPrice price={order.totalPrice} plain />
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="border-t border-gray-200 pt-2">
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

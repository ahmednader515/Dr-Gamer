import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import OrdersList from './orders-list'

export const metadata: Metadata = {
  title: 'Admin Orders',
}

export default async function OrdersPage(props: {
  searchParams: Promise<{ 
    page: string
    search?: string
    isPaid?: string
    isDelivered?: string
  }>
}) {
  const { 
    page = '1',
    search = '',
    isPaid = '',
    isDelivered = ''
  } = await props.searchParams

  const session = await auth()
  const userRole = session?.user.role
  
  // Only Admin can access orders
  if (userRole !== 'Admin') {
    redirect('/')
  }

  // Build where clause for filtering
  const where: any = {}
  
  // Search filter - search by customer name, email, or order ID
  if (search && search.trim() !== '') {
    where.OR = [
      {
        user: {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        }
      },
      {
        user: {
          email: {
            contains: search,
            mode: 'insensitive'
          }
        }
      },
      {
        id: {
          contains: search,
          mode: 'insensitive'
        }
      }
    ]
  }
  
  // Payment status filter
  if (isPaid === 'true') {
    where.isPaid = true
  } else if (isPaid === 'false') {
    where.isPaid = false
  }
  
  // Delivery status filter
  if (isDelivered === 'true') {
    where.isDelivered = true
  } else if (isDelivered === 'false') {
    where.isDelivered = false
  }

  // Direct database query for orders
  const pageSize = 10
  const skip = (Number(page) - 1) * pageSize
  
  const [orders, totalOrders] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    }),
    prisma.order.count({ where })
  ])

  // Convert Decimal values to numbers for client components
  const normalizedOrders = orders.map(order => ({
    ...order,
    itemsPrice: Number(order.itemsPrice),
    shippingPrice: Number(order.shippingPrice),
    taxPrice: Number(order.taxPrice),
    totalPrice: Number(order.totalPrice),
    discountAmount: order.discountAmount ? Number(order.discountAmount) : undefined,
  }))

  const totalPages = Math.ceil(totalOrders / pageSize)
  
  return (
    <OrdersList 
      orders={normalizedOrders} 
      totalPages={totalPages} 
      currentPage={Number(page)}
      userRole={userRole as string}
      currentSearch={search}
      currentIsPaid={isPaid}
      currentIsDelivered={isDelivered}
    />
  )
}

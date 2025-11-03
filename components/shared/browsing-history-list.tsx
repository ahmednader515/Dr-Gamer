'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Eye, Trash2, X } from 'lucide-react'
import useBrowsingHistory from '@/hooks/use-browsing-history'
import Link from 'next/link'
import Image from 'next/image'

export default function BrowsingHistoryList() {
  const { products, clear, removeItem } = useBrowsingHistory()

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className='p-6 text-center font-cairo' dir="ltr">
          <Clock className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
          <h3 className='text-lg font-semibold mb-2'>No Browsing History</h3>
          <p className='text-muted-foreground mb-4'>
            Start browsing products to see your browsing history here
          </p>
          <Button asChild>
            <Link href='/'>Browse Products</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Now'
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    return new Date(timestamp).toLocaleDateString('en-US')
  }

  return (
    <div className='space-y-4 font-cairo' dir="ltr">
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-gray-800'>Browsing History</h2>
        <Button variant='outline' onClick={clear}>
          Clear All
        </Button>
      </div>

      <div className='grid gap-4'>
        {products.map((item) => (
          <Card key={item.id} className='overflow-hidden'>
            <CardContent className='p-4'>
              <div className='flex gap-4'>
                <div className='relative h-20 w-20 flex-shrink-0'>
                  <Image
                    src={item.image || '/images/p11-1.jpg'}
                    alt={item.name}
                    fill
                    className='object-cover rounded-md'
                  />
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='font-medium mb-1 line-clamp-2 text-left'>
                    <Link href={`/product/${item.slug}`} className='hover:underline'>
                      {item.name}
                    </Link>
                  </h3>
                  <p className='text-sm text-muted-foreground mb-2 text-left'>
                    Category: {item.category}
                  </p>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <Clock className='h-3 w-3' />
                    <span>{formatTimeAgo(item.timestamp)}</span>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/product/${item.slug}`}>
                      <Eye className='h-4 w-4 mr-1' />
                      View
                    </Link>
                  </Button>
                  <Button 
                    variant='ghost' 
                    size='sm'
                    onClick={() => removeItem(item.id)}
                    className='text-muted-foreground hover:text-destructive'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

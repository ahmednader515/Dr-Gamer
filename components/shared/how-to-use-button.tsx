'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HowToUseButton() {
  const pathname = usePathname()
  
  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <Link href='/how-to-use'>
      <Button
        className='fixed bottom-6 left-6 z-50 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700 text-white h-auto px-4 py-3 flex items-center gap-2'
        size='lg'
        title='How to Use'
      >
        <HelpCircle className='h-5 w-5' />
        <span className='font-medium'>How to Use</span>
      </Button>
    </Link>
  )
}


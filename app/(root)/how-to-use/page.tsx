import { Metadata } from 'next'
import { getSetting } from '@/lib/actions/setting.actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'How to Use - DR.Gamer',
  description: 'Learn how to use DR.Gamer platform',
}

export default async function HowToUsePage() {
  const setting = await getSetting()
  const howToUseVideo = (setting as any)?.howToUseVideo

  if (!howToUseVideo) {
    return (
      <div className='max-w-4xl mx-auto p-4'>
        <div className='mb-4'>
          <Button asChild variant='ghost'>
            <Link href='/' className='flex items-center gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Back to Home
            </Link>
          </Button>
        </div>
        <div className='text-center py-12'>
          <h1 className='text-2xl font-bold mb-4'>How to Use</h1>
          <p className='text-gray-400'>
            The tutorial video is not available yet. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-4xl mx-auto p-4'>
      <div className='mb-4'>
        <Button asChild variant='ghost'>
          <Link href='/' className='flex items-center gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Back to Home
          </Link>
        </Button>
      </div>
      
      <div className='space-y-4'>
        <h1 className='text-3xl font-bold'>How to Use</h1>
        <p className='text-gray-400'>
          Watch this video to learn how to use the DR.Gamer platform.
        </p>
        
        <div className='w-full aspect-video rounded-lg overflow-hidden border border-gray-700 bg-gray-900'>
          <video
            src={howToUseVideo}
            controls
            className='w-full h-full'
            preload='metadata'
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  )
}


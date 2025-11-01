'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const platforms = [
  { name: 'Steam', image: '/images/steam.avif', href: '/search?tag=steam' },
  { name: 'Xbox', image: '/images/xbox.png', href: '/search?tag=xbox' },
  { name: 'PlayStation', image: '/images/playstation.jpg', href: '/search?tag=playstation' },
  { name: 'Epic Games', image: '/images/epic.jpg', href: '/search?tag=epic-games' },
]

export default function PlatformsSection() {
  return (
    <>
      <style jsx>{`
        :global(.scrollbar-hide) {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        :global(.scrollbar-hide::-webkit-scrollbar) {
          display: none;
        }
      `}</style>
      <div className='py-12' style={{ backgroundColor: '#1f0a4d' }}>
        <div className='w-full px-8 max-w-7xl mx-auto' dir="ltr">
          <h2 className='text-2xl sm:text-3xl font-bold text-white mb-8 text-center'>
            Discover by Platforms
          </h2>
          
          <div className='relative mb-4 max-w-6xl mx-auto'>
            {/* Scrolling container - swipeable on mobile */}
            <div 
              style={{ direction: 'ltr', WebkitOverflowScrolling: 'touch' }}
              className='overflow-x-auto overflow-y-hidden scrollbar-hide'
            >
              <div className='flex gap-6 px-2'>
                {platforms.map((platform, index) => (
                  <div key={`${platform.name}-${index}`} className='flex-shrink-0'>
                    <Link
                      href={platform.href}
                      className='flex-shrink-0 group block'
                    >
                      <div className='w-32 sm:w-48 md:w-56 lg:w-64 h-24 sm:h-36 md:h-40 lg:h-44 rounded-xl overflow-hidden group-hover:scale-105 relative'>
                        <Image
                          src={platform.image}
                          alt={platform.name}
                          fill
                          className='object-cover'
                          sizes='(max-width: 640px) 128px, (max-width: 768px) 192px, (max-width: 1024px) 224px, 256px'
                        />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


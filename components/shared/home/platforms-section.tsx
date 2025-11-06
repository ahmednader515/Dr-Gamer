'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const platforms = [
  { name: 'Steam', image: '/images/steam.avif', href: '/search?platformType=Steam' },
  { name: 'Xbox', image: '/images/xbox.png', href: '/search?platformType=Xbox' },
  { name: 'PlayStation', image: '/images/playstation.jpg', href: '/search?platformType=PlayStation' },
  { name: 'Epic Games', image: '/images/epic.jpg', href: '/search?platformType=Epic Games' },
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
            {/* Vertical stack on mobile, horizontal scroll on desktop */}
            <div 
              style={{ direction: 'ltr' }}
              className='md:overflow-x-auto md:overflow-y-hidden md:scrollbar-hide'
            >
              <div className='flex flex-col md:flex-row gap-4 md:gap-6 px-2'>
                {platforms.map((platform, index) => (
                  <div key={`${platform.name}-${index}`} className='w-full md:flex-shrink-0 md:w-auto'>
                    <Link
                      href={platform.href}
                      className='group block w-full md:w-auto'
                    >
                      <div className='w-full h-32 md:w-48 md:h-36 lg:w-56 lg:h-40 xl:w-64 xl:h-44 rounded-xl overflow-hidden group-hover:scale-105 relative'>
                        <Image
                          src={platform.image}
                          alt={platform.name}
                          fill
                          className='object-cover'
                          sizes='(max-width: 768px) 100vw, (max-width: 1024px) 224px, 256px'
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


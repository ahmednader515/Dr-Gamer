'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const Products = [
  { name: 'Games', image: '/images/games.jpg', href: '/search?tag=steam' },
  { name: 'Subscriptions', image: '/images/sub.jfif', href: '/search?tag=xbox' },
  { name: 'Gift Cards', image: '/images/gift.png', href: '/search?tag=playstation' },
]

export default function ProductsSection() {
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
            Discover by Products
          </h2>
          
          <div className='relative mb-4 max-w-3xl mx-auto'>
            {/* Scrolling container - swipeable on mobile */}
            <div 
              style={{ direction: 'ltr', WebkitOverflowScrolling: 'touch' }}
              className='overflow-x-auto overflow-y-hidden scrollbar-hide'
            >
              <div className='flex gap-6 px-2'>
                {Products.map((platform, index) => (
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
                        <div className='absolute inset-0 bg-black/40 rounded-xl'></div>
                        <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 rounded-xl flex items-end'>
                          <h3 className='text-white font-bold text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4 px-3 sm:px-4 w-full'>
                            {platform.name}
                          </h3>
                        </div>
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


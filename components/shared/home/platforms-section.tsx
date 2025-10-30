'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Marquee from 'react-fast-marquee'

const platforms = [
  { name: 'Steam', image: '/images/steam.avif', href: '/search?tag=steam' },
  { name: 'Xbox', image: '/images/xbox.png', href: '/search?tag=xbox' },
  { name: 'PlayStation', image: '/images/playstation.jpg', href: '/search?tag=playstation' },
  { name: 'Nintendo', image: '/images/nintendo.png', href: '/search?tag=nintendo' },
  { name: 'Epic Games', image: '/images/epic.jpg', href: '/search?tag=epic-games' },
  { name: 'Ubisoft', image: '/images/ubisoft.png', href: '/search?tag=ubisoft' },
  { name: 'EA Games', image: '/images/ea.avif', href: '/search?tag=ea-games' },
  { name: 'Rockstar', image: '/images/Rockstar-Games.jpg', href: '/search?tag=rockstar' },
]

export default function PlatformsSection() {
  return (
    <>
      <style jsx>{`
        :global(.rfm-marquee-container) {
          overflow: hidden !important;
        }
        :global(.rfm-marquee-container::-webkit-scrollbar) {
          display: none !important;
        }
        :global(.rfm-marquee-container *::-webkit-scrollbar) {
          display: none !important;
        }
      `}</style>
      <div className='py-12' style={{ backgroundColor: '#171717' }}>
        <div className='w-full px-8' dir="rtl">
          <h2 className='text-2xl sm:text-3xl font-bold text-white mb-8 text-center'>
            اكتشف حسب المنصات
          </h2>
          
          <div className='relative overflow-hidden mb-4'>
            {/* Gradient overlays */}
            <div className='absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#171717] to-transparent z-10 pointer-events-none' />
            <div className='absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#171717] to-transparent z-10 pointer-events-none' />
            
            {/* Scrolling container */}
            <div style={{ direction: 'ltr' }} className='overflow-hidden'>
              <Marquee 
                speed={30}
                pauseOnHover
                gradient={false}
                className='flex'
                style={{ overflow: 'hidden' }}
              >
                {platforms.map((platform, index) => (
                  <div key={`${platform.name}-${index}`} style={{ marginRight: '16px' }}>
                    <Link
                      href={platform.href}
                      className='flex-shrink-0 group block'
                    >
                      <div className='w-48 h-32 rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105 relative'>
                        <Image
                          src={platform.image}
                          alt={platform.name}
                          fill
                          className='object-cover'
                          sizes='(max-width: 768px) 192px, 192px'
                        />
                      </div>
                    </Link>
                  </div>
                ))}
              </Marquee>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


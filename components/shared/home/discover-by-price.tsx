'use client'

import React from 'react'
import Link from 'next/link'

const priceRanges = [
  { label: 'Under $50', maxPrice: 50 },
  { label: 'Under $100', maxPrice: 100 },
  { label: 'Under $200', maxPrice: 200 },
  { label: 'Under $500', maxPrice: 500 },
  { label: 'Under $1000', maxPrice: 1000 },
  { label: 'Under $2000', maxPrice: 2000 },
]

export default function DiscoverByPrice() {
  return (
    <div className='pt-12 pb-12 mb-0' style={{ backgroundColor: '#1f0a4d' }}>
      <div className='w-full px-8'>
        <h2 className='text-2xl sm:text-3xl font-bold text-white mb-8 text-center'>
          Discover by Price
        </h2>
        
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-0'>
          {priceRanges.map((range) => (
            <Link
              key={range.maxPrice}
              href={`/search?maxPrice=${range.maxPrice}`}
              className='group'
            >
              <div className='bg-gray-800 hover:bg-gray-700 rounded-xl p-6 text-center transition-colors duration-300 border border-gray-700 h-[140px] flex items-center justify-center'>
                <p className='text-white font-bold text-base sm:text-lg group-hover:text-purple-400 transition-colors'>
                  {range.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}


'use client'

import React from 'react'
import Link from 'next/link'

const priceRanges = [
  { label: 'أقل من 50 ج.م', maxPrice: 50 },
  { label: 'أقل من 100 ج.م', maxPrice: 100 },
  { label: 'أقل من 200 ج.م', maxPrice: 200 },
  { label: 'أقل من 500 ج.م', maxPrice: 500 },
  { label: 'أقل من 1000 ج.م', maxPrice: 1000 },
  { label: 'أقل من 2000 ج.م', maxPrice: 2000 },
]

export default function DiscoverByPrice() {
  return (
    <div className='py-12' style={{ backgroundColor: '#171717' }}>
      <div className='w-full px-8'>
        <h2 className='text-2xl sm:text-3xl font-bold text-white mb-8 text-center'>
          اكتشف حسب السعر
        </h2>
        
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4'>
          {priceRanges.map((range) => (
            <Link
              key={range.maxPrice}
              href={`/search?maxPrice=${range.maxPrice}`}
              className='group'
            >
              <div className='bg-gray-800 hover:bg-gray-700 rounded-xl p-6 text-center transition-colors duration-300 border border-gray-700 h-[140px] flex items-center justify-center'>
                <p className='text-white font-bold text-base sm:text-lg group-hover:text-green-400 transition-colors'>
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


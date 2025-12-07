'use client'

import TrustpilotWidget from '../trustpilot-widget'
import TrustpilotRating from '../trustpilot-rating'

export default function TrustpilotSection() {
  return (
    <div className='py-12' style={{ backgroundColor: '#1f0a4d' }}>
      <div className='w-full px-8 max-w-7xl mx-auto' dir="ltr">
        {/* Section Header */}
        <div className='text-center mb-8'>
          <h2 className='text-2xl sm:text-3xl font-bold text-white mb-4'>
            Trusted by Gamers Worldwide
          </h2>
          <p className='text-gray-300 text-sm sm:text-base mb-6'>
            See what our customers have to say about their experience with DR.Gamer
          </p>
          
          {/* Rating Badge */}
          <div className='flex justify-center mb-6'>
            <TrustpilotRating 
              rating={4.8} 
              reviewCount={1250} 
              showLogo={true}
              className='bg-gray-900 px-6 py-3 rounded-lg border border-gray-800'
            />
          </div>
        </div>

        {/* Trustpilot Reviews Widget */}
        <div className='max-w-5xl mx-auto'>
          <TrustpilotWidget type='carousel' />
        </div>

        {/* Call to Action */}
        <div className='text-center mt-8'>
          <p className='text-gray-400 text-sm'>
            Have you shopped with us? 
            <a 
              href='https://www.trustpilot.com/review/dr-gamer.net'
              target='_blank'
              rel='noopener noreferrer'
              className='text-purple-400 hover:text-purple-300 font-semibold ml-2 transition-colors'
            >
              Share your experience →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}


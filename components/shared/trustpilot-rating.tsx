'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'

interface TrustpilotRatingProps {
  rating?: number
  reviewCount?: number
  className?: string
  showLogo?: boolean
}

export default function TrustpilotRating({ 
  rating = 4.5, 
  reviewCount = 0,
  className = '',
  showLogo = true 
}: TrustpilotRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  return (
    <Link
      href="https://www.trustpilot.com/review/dr-gamer.net"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 group ${className}`}
    >
      {/* Star Rating */}
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => {
          if (index < fullStars) {
            return (
              <Star
                key={index}
                className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400"
              />
            )
          } else if (index === fullStars && hasHalfStar) {
            return (
              <div key={index} className="relative w-4 h-4 sm:w-5 sm:h-5">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 absolute" />
                <div className="overflow-hidden absolute" style={{ width: '50%' }}>
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            )
          } else {
            return (
              <Star
                key={index}
                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
              />
            )
          }
        })}
      </div>

      {/* Rating Number */}
      <span className="text-sm sm:text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
        {rating.toFixed(1)}
      </span>

      {/* Review Count */}
      {reviewCount > 0 && (
        <span className="text-xs sm:text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
          ({reviewCount.toLocaleString()} reviews)
        </span>
      )}

      {/* Trustpilot Logo */}
      {showLogo && (
        <span className="text-xs sm:text-sm text-gray-400 group-hover:text-purple-300 transition-colors">
          on <strong>Trustpilot</strong>
        </span>
      )}
    </Link>
  )
}


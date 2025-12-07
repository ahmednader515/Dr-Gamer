'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface FAQItemProps {
  question: string
  answer: string
  images?: string[]
  videos?: string[]
  isLast?: boolean
}

export default function FAQItem({ question, answer, images = [], videos = [], isLast }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn(
      "border-b border-gray-700",
      isLast && "border-b-0"
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-6 px-4 text-left hover:bg-gray-800 transition-colors"
      >
        <span className="text-lg font-semibold text-white">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-purple-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-purple-400 flex-shrink-0" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-6 text-gray-300 text-base leading-relaxed text-left space-y-4">
          <div className="whitespace-pre-line">{answer}</div>
          
          {/* Images */}
          {images && images.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-700">
                    <Image
                      src={image}
                      alt={`FAQ image ${index + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {videos && videos.length > 0 && (
            <div className="space-y-3">
              {videos.map((video, index) => (
                <div key={index} className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-700 bg-black">
                  <video
                    src={video}
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


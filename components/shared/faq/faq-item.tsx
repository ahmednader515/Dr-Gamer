'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItemProps {
  question: string
  answer: string
  isLast?: boolean
}

export default function FAQItem({ question, answer, isLast }: FAQItemProps) {
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
        <div className="px-4 pb-6 text-gray-300 text-base leading-relaxed text-left">
          {answer}
        </div>
      )}
    </div>
  )
}


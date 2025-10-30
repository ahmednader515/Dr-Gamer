'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Image from 'next/image'

interface WhatsAppButtonProps {
  phoneNumber: string
  className?: string
}

export default function WhatsAppButton({ 
  phoneNumber, 
  className = ""
}: WhatsAppButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleWhatsAppClick = () => {
    // Format phone number for WhatsApp (remove any non-digit characters except +)
    const formattedNumber = phoneNumber.replace(/[^\d+]/g, '')
    
    // Create WhatsApp URL without message
    const whatsappUrl = `https://wa.me/${formattedNumber}`
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={handleWhatsAppClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          rounded-full shadow-lg hover:shadow-xl transition-all duration-300 
          bg-green-500 hover:bg-green-600 text-white p-3 sm:p-4
          group relative overflow-hidden w-12 h-12 sm:w-14 sm:h-14
          ${className}
        `}
        size="icon"
        aria-label="تواصل معنا عبر واتساب"
      >
        <Image
          src="/icons/whatsapp.png"
          alt="WhatsApp"
          width={24}
          height={24}
          className="w-6 h-6 sm:w-7 sm:h-7"
        />
        
        {/* Tooltip */}
        <div className={`
          absolute right-full mr-3 top-1/2 -translate-y-1/2 
          bg-gray-800 text-white text-sm px-3 py-2 rounded-lg
          whitespace-nowrap opacity-0 group-hover:opacity-100
          transition-opacity duration-300 pointer-events-none
          hidden sm:block
        `}>
          تواصل معنا عبر واتساب
          <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-800 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </div>
      </Button>
    </div>
  )
}

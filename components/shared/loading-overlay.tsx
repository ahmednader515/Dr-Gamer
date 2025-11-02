'use client'

import React from 'react'

interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
  className?: string
}

export default function LoadingOverlay({ 
  isLoading, 
  text = 'جاري التحميل...',
  className = '' 
}: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <div className="bg-gray-900 rounded-lg shadow-xl p-8 text-center max-w-sm mx-4" dir="ltr">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-100">
              {text}
            </h3>
            <p className="text-sm text-gray-300">
              يرجى الانتظار بينما نقوم بتحميل المحتوى
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Smaller inline loading component for buttons and small areas
export function LoadingSpinner({ 
  size = 'md', 
  text = 'جاري التحميل...',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-3',
    lg: 'w-8 h-8 border-4'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`} dir="ltr">
      <div className={`${sizeClasses[size]} border-purple-300 border-t-purple-600 rounded-full animate-spin`}></div>
      {text && (
        <span className="text-sm text-gray-300">
          {text}
        </span>
      )}
    </div>
  )
}

// Full page loading component (alternative to the old loading page)
export function FullPageLoading({ 
  text = 'Reality is overrated. Enter the game world...',
  className = '' 
}: { 
  text?: string
  className?: string
}) {
  return (
    <div 
      className={`min-h-screen flex items-center justify-center ${className}`}
      style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/icons/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="text-center space-y-6">
        {/* Spinning circle with logo in the middle */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <img 
              src="/icons/logo.png" 
              alt="Dr Gamer Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        
        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-100">
            {text}
          </h1>
          <p className="text-lg text-purple-300 font-semibold">
            Loading
          </p>
        </div>
      </div>
    </div>
  )
}

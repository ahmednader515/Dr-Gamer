'use client'

import { useEffect } from 'react'
import Script from 'next/script'

interface TrustpilotWidgetProps {
  type?: 'mini' | 'micro' | 'carousel' | 'grid' | 'list'
  className?: string
}

export default function TrustpilotWidget({ 
  type = 'mini',
  className = ''
}: TrustpilotWidgetProps) {
  // Your Trustpilot Business Unit ID
  // Update this in your .env file: NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID
  const businessUnitId = process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID || 'pe8fdssimHJlnGNA'

  // Template IDs for different widget types
  const templateIds = {
    mini: '53aa8807dec7e10d38f59f32',           // Mini widget
    micro: '5419b637fa0340045cd0c936',          // Micro star rating
    carousel: '53aa8912dec7e10d38f59f36',       // Carousel
    grid: '539adbd6dec7e10e686debee',           // Grid
    list: '539ad0ffdec7e10e686debd7',           // List
  }

  const heights = {
    mini: '150px',
    micro: '20px',
    carousel: '140px',
    grid: '500px',
    list: '500px',
  }

  useEffect(() => {
    // Initialize Trustpilot widgets after component mounts
    if (typeof window !== 'undefined' && (window as any).Trustpilot) {
      (window as any).Trustpilot.loadFromElement(
        document.getElementById(`trustpilot-widget-${type}`),
        true
      )
    }
  }, [type])

  return (
    <>
      {/* Load Trustpilot script */}
      <Script
        src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="lazyOnload"
        onLoad={() => {
          // Reinitialize widget after script loads
          if ((window as any).Trustpilot) {
            (window as any).Trustpilot.loadFromElement(
              document.getElementById(`trustpilot-widget-${type}`),
              true
            )
          }
        }}
      />

      {/* Trustpilot Widget */}
      <div
        id={`trustpilot-widget-${type}`}
        className={`trustpilot-widget ${className}`}
        data-locale="en-US"
        data-template-id={templateIds[type]}
        data-businessunit-id={businessUnitId}
        data-style-height={heights[type]}
        data-style-width="100%"
        data-theme="dark"
        data-stars="4,5"
      >
        <a
          href="https://www.trustpilot.com/review/dr-gamer.net"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          Trustpilot Reviews
        </a>
      </div>
    </>
  )
}


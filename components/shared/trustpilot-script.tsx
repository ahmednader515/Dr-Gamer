'use client'

import Script from 'next/script'
import { useEffect } from 'react'

interface TrustpilotScriptProps {
  businessKey?: string
}

/**
 * Trustpilot Invitation Script
 * This component loads Trustpilot's free invitation script
 * Add this to your layout or specific pages where you want to trigger review invitations
 */
export default function TrustpilotScript({ 
  businessKey = 'pe8fdssimHJlnGNA' 
}: TrustpilotScriptProps) {
  
  useEffect(() => {
    // Initialize Trustpilot after the script loads
    if (typeof window !== 'undefined' && (window as any).tp) {
      try {
        (window as any).tp('register', businessKey)
        console.log('✅ Trustpilot invitation script registered:', businessKey)
      } catch (error) {
        console.error('❌ Trustpilot registration error:', error)
      }
    }
  }, [businessKey])

  return (
    <>
      {/* Load Trustpilot Invitation Script */}
      <Script
        id="trustpilot-invitation-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,r,n){w.TrustpilotObject=n;w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)};
                a=d.createElement(s);a.async=1;a.src=r;a.type='text/java'+s;f=d.getElementsByTagName(s)[0];
                f.parentNode.insertBefore(a,f)})(window,document,'script', 'https://invitejs.trustpilot.com/tp.min.js', 'tp');
                tp('register', '${businessKey}');
          `,
        }}
      />
    </>
  )
}


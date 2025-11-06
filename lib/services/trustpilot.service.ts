'use server'

/**
 * Trustpilot Service (Free Version - No API Required)
 * Uses Trustpilot's free invitation script and direct review links
 */

interface TrustpilotReviewLinkParams {
  customerName?: string
  customerEmail?: string
  orderId?: string
}

/**
 * Generates a Trustpilot review link for DR.Gamer
 * Using the free direct review link - works without API credentials
 */
export function generateTrustpilotReviewLink(params: TrustpilotReviewLinkParams = {}): string {
  // Simple direct link to Trustpilot review page
  // This works for free accounts and doesn't require API
  const baseUrl = 'https://www.trustpilot.com/evaluate/dr-gamer.net'
  const urlParams = new URLSearchParams()

  // Add optional parameters for better UX
  if (params.customerName) {
    urlParams.append('name', params.customerName)
  }
  
  if (params.customerEmail) {
    urlParams.append('email', params.customerEmail)
  }

  // Add order reference for tracking
  if (params.orderId) {
    urlParams.append('ref', params.orderId)
  }

  const queryString = urlParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Get Trustpilot Business Unit Key
 * This is the key from your Trustpilot invitation script
 */
export function getTrustpilotBusinessKey(): string {
  return process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_KEY || 'pe8fdssimHJlnGNA'
}


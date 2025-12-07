import { getActivePromoCodes } from '@/lib/actions/promo-code.actions'
import { Tag } from 'lucide-react'
import PromoBarMobile from './promo-bar-mobile'

export default async function PromoBar() {
  const activePromoCodes = await getActivePromoCodes()

  // Don't render if no active promo codes
  if (!activePromoCodes || activePromoCodes.length === 0) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
      {/* Mobile Layout - Clickable "Promo Codes" text that opens sidebar */}
      <div className="md:hidden h-8">
        <PromoBarMobile promoCodes={activePromoCodes} />
      </div>

      {/* Desktop Layout - Horizontal */}
      <div className="hidden md:block h-9">
        <div className="container mx-auto px-4 lg:px-6 h-full">
          <div className="flex items-center justify-center gap-3 text-sm h-full">
            <Tag className="h-4 w-4 flex-shrink-0" />
            <div className="flex items-center gap-2.5 flex-wrap justify-center">
              <span className="font-semibold whitespace-nowrap">Active Promo Codes:</span>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {activePromoCodes.map((promo: any, index: number) => (
                  <div key={promo.id} className="flex items-center gap-1">
                    <span className="bg-white/20 px-2.5 py-1 rounded text-sm font-semibold backdrop-blur-sm border border-white/30 whitespace-nowrap">
                      {promo.code} - {promo.discountPercent}% OFF
                    </span>
                    {index < activePromoCodes.length - 1 && (
                      <span className="text-white/70 text-xs">•</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


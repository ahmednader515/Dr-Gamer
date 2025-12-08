'use client'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Tag, X } from 'lucide-react'

interface PromoBarMobileProps {
  promoCodes: Array<{
    id: string
    code: string
    discountPercent: number
    assignments: Array<{
      id: string
      type: 'product' | 'category'
      product: {
        id: string
        name: string
      } | null
      category: {
        id: string
        name: string
      } | null
      variationNames: string[]
    }>
  }>
}

export default function PromoBarMobile({ promoCodes }: PromoBarMobileProps) {
  return (
    <Drawer direction="bottom">
      <DrawerTrigger asChild>
        <button className="w-full h-8 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-purple-700/50 transition-colors">
          <Tag className="h-3 w-3 flex-shrink-0" />
          <span className="font-semibold text-xs">Promo Codes</span>
        </button>
      </DrawerTrigger>
      <DrawerContent className="!max-h-[80vh] bg-gray-900 border-t border-gray-700">
        <div className="flex flex-col h-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <DrawerHeader className="border-b border-gray-700 flex-shrink-0 px-4 py-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Tag className="h-5 w-5 text-purple-400" />
                Active Promo Codes
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-gray-800">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Promo Codes List - Scrollable */}
          <div 
            className="flex-1 overflow-y-scroll overflow-x-hidden px-4 pb-4" 
            style={{ 
              WebkitOverflowScrolling: 'touch',
              maxHeight: 'calc(80vh - 80px)',
              height: '100%'
            }}
          >
            <div className="space-y-3">
              {promoCodes.map((promo) => {
                // Collect all applicable products
                const applicableProducts: string[] = []
                
                promo.assignments.forEach((assignment) => {
                  if (assignment.type === 'product' && assignment.product) {
                    const productName = assignment.product.name
                    if (assignment.variationNames.length > 0) {
                      applicableProducts.push(
                        `${productName} (${assignment.variationNames.join(', ')})`
                      )
                    } else {
                      applicableProducts.push(productName)
                    }
                  } else if (assignment.type === 'category' && assignment.category) {
                    applicableProducts.push(`All ${assignment.category.name} products`)
                  }
                })

                return (
                  <div
                    key={promo.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-2">
                          <Tag className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg">{promo.code}</div>
                          <div className="text-sm text-gray-400">Discount Code</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-400 text-xl">{promo.discountPercent}%</div>
                        <div className="text-xs text-gray-400">OFF</div>
                      </div>
                    </div>
                    
                    {/* Applicable Products */}
                    {applicableProducts.length > 0 && (
                      <div className="pt-3 border-t border-gray-700">
                        <div className="text-xs text-gray-400 mb-2">Applicable on:</div>
                        <div className="flex flex-col gap-1.5">
                          {applicableProducts.map((product, index) => (
                            <div key={index} className="text-sm text-gray-300">
                              • {product}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}


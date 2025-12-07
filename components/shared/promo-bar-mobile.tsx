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
        <div className="flex flex-col h-full">
          {/* Header */}
          <DrawerHeader className="border-b border-gray-700">
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

          {/* Promo Codes List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {promoCodes.map((promo) => (
                <div
                  key={promo.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center justify-between">
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}


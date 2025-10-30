'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Save } from 'lucide-react'
import { updateSetting } from '@/lib/actions/setting.actions'
import data from '@/lib/data'

// Import all settings components
import CarouselSettings from './carousel-settings'
import DeliverySettings from './delivery-settings'
import TaxSettings from './tax-settings'
import PricingSettings from './pricing-settings'

interface CarouselItem {
  title: string
  buttonCaption: string
  image: string
  url: string
}

interface DeliverySettings {
  deliveryTimeHours: number
  deliveryPrice: number
  freeShippingThreshold: number
}

interface TaxSettings {
  taxRate: number
  taxIncluded: boolean
  taxExemptCategories: string[]
  taxExemptThreshold: number
}

interface SeasonalDiscount {
  name: string
  startDate: string
  endDate: string
  discountRate: number
  applicableCategories: string[]
}

interface ProductPricing {
  defaultMarkup: number
  bulkDiscountThreshold: number
  bulkDiscountRate: number
  seasonalDiscounts: SeasonalDiscount[]
}

interface SettingsTabsContentProps {
  setting: any
  tab: 'carousel' | 'delivery' | 'tax' | 'pricing'
}

export default function SettingsTabsContent({ setting, tab }: SettingsTabsContentProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  // State for each settings section
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([])
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    deliveryTimeHours: 4,
    deliveryPrice: 4.99,
    freeShippingThreshold: 50,
  })
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    taxRate: 7.5,
    taxIncluded: false,
    taxExemptCategories: ['prescription-medications', 'medical-devices'],
    taxExemptThreshold: 0,
  })
  const [productPricing, setProductPricing] = useState<ProductPricing>({
    defaultMarkup: 30,
    bulkDiscountThreshold: 5,
    bulkDiscountRate: 10,
    seasonalDiscounts: [
      {
        name: 'Winter Sale',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        discountRate: 15,
        applicableCategories: ['vitamins', 'supplements', 'cold-flu'],
      },
      {
        name: 'Summer Wellness',
        startDate: '2024-06-01',
        endDate: '2024-08-31',
        discountRate: 20,
        applicableCategories: ['sunscreen', 'hydration', 'vitamins'],
      },
    ],
  })

  // Initialize settings from props
  useEffect(() => {
    const settings = setting || data.settings[0]
    if (settings) {
      setCarouselItems(settings.carousels || [])
      if (settings.deliverySettings) {
        const delivery = settings.deliverySettings
        if ('deliveryTimeHours' in delivery) {
          setDeliverySettings(delivery)
        } else {
          setDeliverySettings({
            deliveryTimeHours: 4,
            deliveryPrice: delivery.standardDeliveryPrice || 4.99,
            freeShippingThreshold: delivery.freeShippingThreshold || 50,
          })
        }
      }
      if (settings.taxSettings) {
        setTaxSettings(settings.taxSettings)
      }
      if (settings.productPricing) {
        setProductPricing(settings.productPricing)
      }
    }
  }, [setting])

  const handleSubmit = async () => {
    setIsLoading(true)
    
    try {
      // Get existing settings and merge with new data
      const existingSettings = setting || data.settings[0]
      const newSetting = {
        ...existingSettings,
        carousels: carouselItems,
        deliverySettings,
        taxSettings,
        productPricing,
      } as any

      const res = await updateSetting(newSetting)
      if (!res.success) {
        toast({
          title: 'خطأ في الحفظ',
          description: res.message,
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'تم حفظ الإعدادات',
          description: 'تم تحديث إعدادات الموقع بنجاح',
          variant: 'default'
        })
      }
      
    } catch (error) {
      console.error('Settings save error:', error)
      toast({
        title: 'خطأ في الحفظ',
        description: 'فشل في حفظ الإعدادات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderTabContent = () => {
    switch (tab) {
      case 'carousel':
        return (
          <CarouselSettings
            carouselItems={carouselItems}
            onCarouselItemsChange={setCarouselItems}
          />
        )
      case 'delivery':
        return (
          <DeliverySettings
            deliverySettings={deliverySettings}
            onDeliverySettingsChange={setDeliverySettings}
          />
        )
      case 'tax':
        return (
          <TaxSettings
            taxSettings={taxSettings}
            onTaxSettingsChange={setTaxSettings}
          />
        )
      case 'pricing':
        return (
          <PricingSettings
            productPricing={productPricing}
            onProductPricingChange={setProductPricing}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className='space-y-6'>
      {renderTabContent()}
      
      {/* Save Button */}
      <div className='flex justify-end'>
        <Button onClick={handleSubmit} disabled={isLoading} size='lg'>
          <Save className='h-4 w-4 ml-2' />
          {isLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  )
}

'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Save } from 'lucide-react'
import { updateSetting } from '@/lib/actions/setting.actions'
import data from '@/lib/data'
import { PaymentMethod } from '@/types'

// Import all settings components
import CarouselSettings from './carousel-settings'
import DeliverySettings from './delivery-settings'
import TaxSettings from './tax-settings'
import PricingSettings from './pricing-settings'
import PaymentSettings from './payment-settings'

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
  tab: 'carousel' | 'delivery' | 'tax' | 'pricing' | 'payments'
}

const PAYMENT_METHOD_TYPES = ['wallet', 'instapay', 'bank', 'link', 'other'] as const
type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number]

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[_\-]+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')

const templateMap = (() => {
  const map = new Map<string, Partial<PaymentMethod>>()
  data.settings[0].availablePaymentMethods.forEach((method) => {
    map.set(normalizeKey(method.name ?? ''), method)
  })

  const aliasPairs: Array<[string, string]> = [
    ['فودافون كاش', 'Vodafone Cash'],
    ['فودافونكاش', 'Vodafone Cash'],
    ['vodafone', 'Vodafone Cash'],
    ['انستا باي', 'InstaPay'],
    ['انستاباي', 'InstaPay'],
    ['insta pay', 'InstaPay'],
    ['تيلدا', 'Telda'],
    ['الحساب البنكي', 'Bank Account'],
    ['حساب بنكي', 'Bank Account'],
    ['bank', 'Bank Account'],
  ]

  aliasPairs.forEach(([alias, reference]) => {
    const template = map.get(normalizeKey(reference))
    if (template) {
      map.set(normalizeKey(alias), template)
    }
  })

  return map
})()

const fallbackByType: Record<PaymentMethodType, Partial<PaymentMethod>> = {
  wallet: {
    type: 'wallet',
    label: 'Wallet Number / Handle',
    icon: '📱',
    notes:
      'Transfer the amount to the wallet number, then add your payment number and upload the receipt.',
  },
  instapay: {
    type: 'instapay',
    label: 'InstaPay Handle',
    linkLabel: 'Send via InstaPay',
    icon: '💳',
    notes:
      'Send the payment through InstaPay using the handle above, then upload the screenshot.',
  },
  bank: {
    type: 'bank',
    label: 'Bank Account Number',
    icon: '🏦',
    notes:
      'Complete the bank transfer to the account above and provide the transaction details.',
  },
  link: {
    type: 'link',
    label: 'Payment Link',
    linkLabel: 'Pay Now',
    icon: '🔗',
    notes: 'Use the payment link above to complete the transaction.',
  },
  other: {
    type: 'other',
    label: 'Payment Reference',
    notes:
      'Follow the instructions provided by the store to complete your payment.',
  },
}

const sanitizeField = (value?: string | null) =>
  value && value.trim().length ? value : undefined

const normalizePaymentMethod = (method: PaymentMethod): PaymentMethod => {
  const key = normalizeKey(method.name ?? '')
  const template = templateMap.get(key)

  const rawType = sanitizeField(method.type as string | undefined)
  const templateType = template?.type as PaymentMethodType | undefined
  const inferredType = (rawType ??
    templateType ??
    fallbackByType.other.type) as PaymentMethodType

  const fallback = fallbackByType[inferredType]

  const pick = (field: keyof PaymentMethod): string | undefined => {
    const fromMethod = sanitizeField(method[field] as string | undefined)
    if (fromMethod !== undefined) return fromMethod
    const fromTemplate = template
      ? sanitizeField(template[field] as string | undefined)
      : undefined
    if (fromTemplate !== undefined) return fromTemplate
    const fromFallback = fallback
      ? sanitizeField(fallback[field] as string | undefined)
      : undefined
    return fromFallback
  }

  return {
    ...method,
    type: inferredType,
    label: pick('label'),
    number: pick('number'),
    icon: pick('icon'),
    userName: pick('userName'),
    link: pick('link'),
    linkLabel: pick('linkLabel'),
    accountHolder: pick('accountHolder'),
    iban: pick('iban'),
    swift: pick('swift'),
    notes: pick('notes'),
  }
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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('')

  // Initialize settings from props
  useEffect(() => {
    const settings = setting || data.settings[0]
    if (settings) {
      setCarouselItems(settings.carousels || [])
      if (Array.isArray(settings.availablePaymentMethods)) {
        const normalizedMethods = settings.availablePaymentMethods.map(
          (method: PaymentMethod) => normalizePaymentMethod(method),
        )
        setPaymentMethods(normalizedMethods)
      }
      if (settings.defaultPaymentMethod) {
        setDefaultPaymentMethod(settings.defaultPaymentMethod)
      } else if (settings.availablePaymentMethods?.length) {
        setDefaultPaymentMethod(settings.availablePaymentMethods[0].name)
      }
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
    
    const allowedTypes = new Set<string>(PAYMENT_METHOD_TYPES)

    const sanitizedPaymentMethods = paymentMethods
      .map((method) => {
        const trimmedName = method.name?.trim() ?? ''
        const trim = (value?: string | null) => {
          const result = value?.trim()
          return result ? result : undefined
        }
        const typeValue =
          allowedTypes.has((method.type as string) ?? '')
            ? (method.type as string)
            : 'other'

        return {
          name: trimmedName,
          commission: Number.isFinite(method.commission)
            ? method.commission
            : 0,
          type: typeValue as PaymentMethod['type'],
          label: trim(method.label),
          number: trim(method.number),
          icon: trim(method.icon),
          userName: trim(method.userName),
          link: trim(method.link),
          linkLabel: trim(method.linkLabel),
          accountHolder: trim(method.accountHolder),
          iban: trim(method.iban),
          swift: trim(method.swift),
          notes: trim(method.notes),
        }
      })
      .filter((method) => method.name)

    const resolvedDefaultPaymentMethod =
      sanitizedPaymentMethods.find((method) => method.name === defaultPaymentMethod)?.name ??
      sanitizedPaymentMethods[0]?.name ??
      ''

    if (!sanitizedPaymentMethods.length) {
      toast({
        title: 'Validation Error',
        description: 'Please keep at least one payment method with a valid name.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    if (resolvedDefaultPaymentMethod !== defaultPaymentMethod) {
      setDefaultPaymentMethod(resolvedDefaultPaymentMethod)
    }
    setPaymentMethods(sanitizedPaymentMethods)

    try {
      // Get existing settings and merge with new data
      const existingSettings = setting || data.settings[0]
      const newSetting = {
        ...existingSettings,
        carousels: carouselItems,
        availablePaymentMethods: sanitizedPaymentMethods,
        defaultPaymentMethod: resolvedDefaultPaymentMethod,
        deliverySettings,
        taxSettings,
        productPricing,
      } as any

      const res = await updateSetting(newSetting)
      if (!res.success) {
        toast({
          title: 'Save Error',
          description: res.message,
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Settings Saved',
          description: 'Site settings have been updated successfully',
          variant: 'default'
        })
      }
      
    } catch (error) {
      console.error('Settings save error:', error)
      toast({
        title: 'Save Error',
        description: 'Failed to save settings. Please try again.',
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
      case 'payments':
        return (
          <PaymentSettings
            paymentMethods={paymentMethods}
            defaultPaymentMethod={defaultPaymentMethod}
            onPaymentMethodsChange={setPaymentMethods}
            onDefaultPaymentMethodChange={setDefaultPaymentMethod}
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
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}

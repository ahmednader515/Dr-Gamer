'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, DollarSign } from 'lucide-react'

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

interface PricingSettingsProps {
  productPricing: ProductPricing
  onProductPricingChange: (pricing: ProductPricing) => void
}

export default function PricingSettings({ productPricing, onProductPricingChange }: PricingSettingsProps) {
  const addSeasonalDiscount = () => {
    onProductPricingChange({
      ...productPricing,
      seasonalDiscounts: [
        ...productPricing.seasonalDiscounts,
        {
          name: 'خصم جديد',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          discountRate: 10,
          applicableCategories: [],
        }
      ]
    })
  }

  const removeSeasonalDiscount = (index: number) => {
    const newSeasonalDiscounts = productPricing.seasonalDiscounts.filter((_, i) => i !== index)
    onProductPricingChange({
      ...productPricing,
      seasonalDiscounts: newSeasonalDiscounts
    })
  }

  const updateSeasonalDiscount = (index: number, field: keyof SeasonalDiscount, value: any) => {
    const newSeasonalDiscounts = [...productPricing.seasonalDiscounts]
    newSeasonalDiscounts[index] = { ...newSeasonalDiscounts[index], [field]: value }
    onProductPricingChange({
      ...productPricing,
      seasonalDiscounts: newSeasonalDiscounts
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2'>
          <DollarSign className='h-5 w-5' />
          إعدادات تسعير المنتجات
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='space-y-2'>
            <Label htmlFor='defaultMarkup'>الهامش الافتراضي (%)</Label>
            <Input
              id='defaultMarkup'
              type='number'
              min='0'
              step='0.1'
              value={productPricing.defaultMarkup}
              onChange={(e) => onProductPricingChange({
                ...productPricing,
                defaultMarkup: parseFloat(e.target.value) || 0
              })}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='bulkDiscountThreshold'>حد الخصم بالجملة</Label>
            <Input
              id='bulkDiscountThreshold'
              type='number'
              min='1'
              value={productPricing.bulkDiscountThreshold}
              onChange={(e) => onProductPricingChange({
                ...productPricing,
                bulkDiscountThreshold: parseInt(e.target.value) || 1
              })}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='bulkDiscountRate'>نسبة الخصم بالجملة (%)</Label>
            <Input
              id='bulkDiscountRate'
              type='number'
              min='0'
              max='100'
              step='0.1'
              value={productPricing.bulkDiscountRate}
              onChange={(e) => onProductPricingChange({
                ...productPricing,
                bulkDiscountRate: parseFloat(e.target.value) || 0
              })}
            />
          </div>
        </div>

        {/* Seasonal Discounts */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h4 className='font-semibold text-lg'>الخصومات الموسمية</h4>
            <Button onClick={addSeasonalDiscount} size='sm'>
              <Plus className='h-4 w-4 ml-2' />
              إضافة خصم موسمي
            </Button>
          </div>
          
          <div className='space-y-4'>
            {productPricing.seasonalDiscounts.map((discount, index) => (
              <div key={index} className='border rounded-lg p-4 space-y-4'>
                <div className='flex items-center justify-between'>
                  <h5 className='font-medium'>الخصم الموسمي {index + 1}</h5>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => removeSeasonalDiscount(index)}
                  >
                    <Trash2 className='h-4 w-4 ml-2' />
                    حذف
                  </Button>
                </div>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor={`discountName${index}`}>اسم الخصم</Label>
                    <Input
                      id={`discountName${index}`}
                      value={discount.name}
                      onChange={(e) => updateSeasonalDiscount(index, 'name', e.target.value)}
                      placeholder='اسم الخصم'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor={`discountRate${index}`}>نسبة الخصم (%)</Label>
                    <Input
                      id={`discountRate${index}`}
                      type='number'
                      min='0'
                      max='100'
                      step='0.1'
                      value={discount.discountRate}
                      onChange={(e) => updateSeasonalDiscount(index, 'discountRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor={`startDate${index}`}>تاريخ البداية</Label>
                    <Input
                      id={`startDate${index}`}
                      type='date'
                      value={discount.startDate}
                      onChange={(e) => updateSeasonalDiscount(index, 'startDate', e.target.value)}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor={`endDate${index}`}>تاريخ النهاية</Label>
                    <Input
                      id={`endDate${index}`}
                      type='date'
                      value={discount.endDate}
                      onChange={(e) => updateSeasonalDiscount(index, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className='space-y-2'>
                  <Label htmlFor={`applicableCategories${index}`}>الفئات المطبقة</Label>
                  <Textarea
                    id={`applicableCategories${index}`}
                    placeholder='أدخل الفئات مفصولة بفواصل (مثال: vitamins, supplements)'
                    value={discount.applicableCategories.join(', ')}
                    onChange={(e) => updateSeasonalDiscount(index, 'applicableCategories', e.target.value.split(',').map(cat => cat.trim()).filter(cat => cat))}
                    rows={2}
                  />
                </div>
                
                {index < productPricing.seasonalDiscounts.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

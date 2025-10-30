'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Truck } from 'lucide-react'

interface DeliverySettings {
  deliveryTimeHours: number
  deliveryPrice: number
  freeShippingThreshold: number
}

interface DeliverySettingsProps {
  deliverySettings: DeliverySettings
  onDeliverySettingsChange: (settings: DeliverySettings) => void
}

export default function DeliverySettings({ deliverySettings, onDeliverySettingsChange }: DeliverySettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2'>
          <Truck className='h-5 w-5' />
          إعدادات التوصيل
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='space-y-2'>
            <Label htmlFor='deliveryTimeHours'>وقت التوصيل (بالساعات)</Label>
            <Input
              id='deliveryTimeHours'
              type='number'
              min='1'
              value={deliverySettings.deliveryTimeHours}
              onChange={(e) => onDeliverySettingsChange({
                ...deliverySettings,
                deliveryTimeHours: parseInt(e.target.value) || 1
              })}
              placeholder='مثال: 4'
            />
            <p className='text-xs text-muted-foreground'>الوقت المتوقع للتوصيل</p>
          </div>
          
          <div className='space-y-2'>
            <Label htmlFor='deliveryPrice'>سعر التوصيل</Label>
            <Input
              id='deliveryPrice'
              type='number'
              min='0'
              step='0.01'
              value={deliverySettings.deliveryPrice}
              onChange={(e) => onDeliverySettingsChange({
                ...deliverySettings,
                deliveryPrice: parseFloat(e.target.value) || 0
              })}
              placeholder='مثال: 4.99'
            />
            <p className='text-xs text-muted-foreground'>سعر التوصيل لكل طلب</p>
          </div>
          
          <div className='space-y-2'>
            <Label htmlFor='freeShippingThreshold'>حد التوصيل المجاني</Label>
            <Input
              id='freeShippingThreshold'
              type='number'
              min='0'
              step='0.01'
              value={deliverySettings.freeShippingThreshold}
              onChange={(e) => onDeliverySettingsChange({
                ...deliverySettings,
                freeShippingThreshold: parseFloat(e.target.value) || 0
              })}
              placeholder='مثال: 50'
            />
            <p className='text-xs text-muted-foreground'>الحد الأدنى للطلب للحصول على توصيل مجاني</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

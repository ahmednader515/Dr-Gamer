'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calculator } from 'lucide-react'

interface TaxSettings {
  taxRate: number
  taxIncluded: boolean
  taxExemptCategories: string[]
  taxExemptThreshold: number
}

interface TaxSettingsProps {
  taxSettings: TaxSettings
  onTaxSettingsChange: (settings: TaxSettings) => void
}

export default function TaxSettings({ taxSettings, onTaxSettingsChange }: TaxSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2'>
          <Calculator className='h-5 w-5' />
          إعدادات الضرائب
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='taxRate'>معدل الضريبة (%)</Label>
              <Input
                id='taxRate'
                type='number'
                min='0'
                max='100'
                step='0.1'
                value={taxSettings.taxRate}
                onChange={(e) => onTaxSettingsChange({
                  ...taxSettings,
                  taxRate: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='taxExemptThreshold'>حد الإعفاء الضريبي</Label>
              <Input
                id='taxExemptThreshold'
                type='number'
                min='0'
                step='0.01'
                value={taxSettings.taxExemptThreshold}
                onChange={(e) => onTaxSettingsChange({
                  ...taxSettings,
                  taxExemptThreshold: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className='flex items-center space-x-2 rtl:space-x-reverse'>
              <Switch
                id='taxIncluded'
                checked={taxSettings.taxIncluded}
                onCheckedChange={(checked) => onTaxSettingsChange({
                  ...taxSettings,
                  taxIncluded: checked
                })}
              />
              <Label htmlFor='taxIncluded'>الضريبة مشمولة في السعر</Label>
            </div>
          </div>
          
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='taxExemptCategories'>فئات الإعفاء الضريبي</Label>
              <Textarea
                id='taxExemptCategories'
                placeholder='أدخل الفئات مفصولة بفواصل (مثال: prescription-medications, medical-devices)'
                value={taxSettings.taxExemptCategories.join(', ')}
                onChange={(e) => onTaxSettingsChange({
                  ...taxSettings,
                  taxExemptCategories: e.target.value.split(',').map(cat => cat.trim()).filter(cat => cat)
                })}
                rows={4}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

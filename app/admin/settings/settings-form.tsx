'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Plus, Trash2, Save, Image as ImageIcon, Upload, Truck, Calculator, DollarSign } from 'lucide-react'
import data from '@/lib/data'
import { updateSetting } from '@/lib/actions/setting.actions'
import { useUploadThing } from '@/lib/uploadthing'

interface CarouselItem {
  title: string
  buttonCaption: string
  image: string
  url: string
}

interface SeasonalDiscount {
  name: string
  startDate: string
  endDate: string
  discountRate: number
  applicableCategories: string[]
}

export default function SettingsForm({ setting }: { setting: any }) {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([])
  const [deliverySettings, setDeliverySettings] = useState({
    deliveryTimeHours: 4,
    deliveryPrice: 4.99,
    freeShippingThreshold: 50,
  })
  const [taxSettings, setTaxSettings] = useState({
    taxRate: 7.5,
    taxIncluded: false,
    taxExemptCategories: ['prescription-medications', 'medical-devices'],
    taxExemptThreshold: 0,
  })
  const [productPricing, setProductPricing] = useState({
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
    ] as SeasonalDiscount[],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set())

  // UploadThing hook for image uploads
  const { startUpload, isUploading } = useUploadThing('imageUploader')

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

  const handleCarouselChange = (index: number, field: keyof CarouselItem, value: string) => {
    const newCarouselItems = [...carouselItems]
    newCarouselItems[index] = { ...newCarouselItems[index], [field]: value }
    
    // Auto-update URL when title changes
    if (field === 'title') {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      newCarouselItems[index].url = `/search?category=${slug}`
    }
    
    setCarouselItems(newCarouselItems)
  }

  const addCarouselItem = () => {
    const newItem: CarouselItem = {
      title: 'New Title',
      buttonCaption: 'New Button',
      image: '/images/banner1.jpg',
      url: '/search?category=new-title'
    }
    
    setCarouselItems(prev => [...prev, newItem])
  }

  const removeCarouselItem = (index: number) => {
    if (carouselItems.length > 1) {
      const newCarouselItems = carouselItems.filter((_, i) => i !== index)
      setCarouselItems(newCarouselItems)
    } else {
      toast({
        title: 'Cannot Delete',
        description: 'Carousel must contain at least one item',
        variant: 'destructive'
      })
    }
  }

  const handleImageUpload = async (index: number, file: File) => {
    try {
      setUploadingImages(prev => new Set(prev).add(index))
      
      // Upload to UploadThing
      const uploadResult = await startUpload([file])
      
      if (uploadResult && uploadResult[0]) {
        const imageUrl = uploadResult[0].url
        
        const newCarouselItems = [...carouselItems]
        newCarouselItems[index].image = imageUrl
        setCarouselItems(newCarouselItems)
        
        toast({
          title: 'Image Updated',
          description: 'Image uploaded successfully to server',
          variant: 'default'
        })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      toast({
        title: 'Image Upload Error',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setUploadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  const addSeasonalDiscount = () => {
    setProductPricing({
      ...productPricing,
      seasonalDiscounts: [
        ...productPricing.seasonalDiscounts,
        {
          name: 'New Discount',
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
    setProductPricing({
      ...productPricing,
      seasonalDiscounts: newSeasonalDiscounts
    })
  }

  const updateSeasonalDiscount = (index: number, field: keyof SeasonalDiscount, value: any) => {
    const newSeasonalDiscounts = [...productPricing.seasonalDiscounts]
    newSeasonalDiscounts[index] = { ...newSeasonalDiscounts[index], [field]: value }
    setProductPricing({
      ...productPricing,
      seasonalDiscounts: newSeasonalDiscounts
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    
    try {
      // Validate carousel items before submission
      const validCarouselItems = carouselItems.filter(item => 
        item.title.trim() && 
        item.buttonCaption.trim() && 
        item.image.trim() && 
        item.url.trim()
      )

      if (validCarouselItems.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Carousel must contain at least one valid item',
          variant: 'destructive'
        })
        setIsLoading(false)
        return
      }

      // Get existing settings and merge with new data
      const existingSettings = setting || data.settings[0]
      const newSetting = {
        ...existingSettings,
        carousels: validCarouselItems,
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
          description: 'Site settings updated successfully',
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

  return (
    <div className='space-y-6'>
      {/* Carousel Settings */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-xl flex items-center gap-2'>
              <ImageIcon className='h-5 w-5' />
              Carousel Settings
            </CardTitle>
            <Button onClick={addCarouselItem} size='sm'>
              <Plus className='h-4 w-4 ml-2' />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          {carouselItems.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <ImageIcon className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p>No carousel items</p>
              <p className='text-sm'>Click "Add Item" to start adding carousel items</p>
            </div>
          ) : (
            carouselItems.map((item, index) => (
            <div key={index} className='border rounded-lg p-4 space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <h4 className='font-semibold'>Carousel Item {index + 1}</h4>
                  {(!item.title.trim() || !item.buttonCaption.trim() || !item.image.trim() || !item.url.trim()) && (
                    <span className='text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded'>
                      Incomplete
                    </span>
                  )}
                </div>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => removeCarouselItem(index)}
                  disabled={carouselItems.length <= 1}
                >
                  <Trash2 className='h-4 w-4 ml-2' />
                  Delete
                </Button>
              </div>
              
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor={`carouselTitle${index}`}>Title</Label>
                  <Input
                    id={`carouselTitle${index}`}
                    value={item.title}
                    onChange={(e) => handleCarouselChange(index, 'title', e.target.value)}
                    placeholder='Carousel title'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`carouselButton${index}`}>Button Text</Label>
                  <Input
                    id={`carouselButton${index}`}
                    value={item.buttonCaption}
                    onChange={(e) => handleCarouselChange(index, 'buttonCaption', e.target.value)}
                    placeholder='Button text'
                  />
                </div>
              </div>
              
              <div className='space-y-2'>
                <Label htmlFor={`carouselUrl${index}`}>Button URL</Label>
                <Input
                  id={`carouselUrl${index}`}
                  value={item.url}
                  onChange={(e) => handleCarouselChange(index, 'url', e.target.value)}
                  placeholder='/search?category=example'
                />
                <p className='text-xs text-muted-foreground'>
                  URL will be auto-generated when changing the title, or you can edit it manually
                </p>
              </div>
              
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Carousel Image</Label>
                  <div className='flex items-center gap-4'>
                    {/* Current Image Preview */}
                    <div className='w-32 h-20 rounded-lg overflow-hidden border border-gray-200'>
                      <img
                        src={item.image}
                        alt={`Carousel ${index + 1}`}
                        className='w-full h-full object-cover'
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/images/placeholder.jpg'
                        }}
                      />
                    </div>
                    
                    {/* Upload Button */}
                    <div className='space-y-2'>
                      <input
                        type='file'
                        id={`imageUpload${index}`}
                        accept='image/*'
                        className='hidden'
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(index, file)
                          }
                        }}
                      />
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => document.getElementById(`imageUpload${index}`)?.click()}
                        disabled={uploadingImages.has(index) || isUploading}
                      >
                        <Upload className='h-4 w-4 ml-2' />
                        {uploadingImages.has(index) || isUploading ? 'Uploading...' : 'Upload New Image'}
                      </Button>
                      <p className='text-xs text-muted-foreground'>
                        Current image: {item.image.length > 50 ? `${item.image.substring(0, 50)}...` : item.image}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {index < carouselItems.length - 1 && <Separator />}
            </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Delivery Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Truck className='h-5 w-5' />
            Delivery Settings
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='deliveryTimeHours'>Delivery Time (in hours)</Label>
              <Input
                id='deliveryTimeHours'
                type='number'
                min='1'
                value={deliverySettings.deliveryTimeHours}
                onChange={(e) => setDeliverySettings({
                  ...deliverySettings,
                  deliveryTimeHours: parseInt(e.target.value) || 1
                })}
                placeholder='Example: 4'
              />
              <p className='text-xs text-muted-foreground'>Expected delivery time</p>
            </div>
            
            <div className='space-y-2'>
              <Label htmlFor='deliveryPrice'>Delivery Price</Label>
              <Input
                id='deliveryPrice'
                type='number'
                min='0'
                step='0.01'
                value={deliverySettings.deliveryPrice}
                onChange={(e) => setDeliverySettings({
                  ...deliverySettings,
                  deliveryPrice: parseFloat(e.target.value) || 0
                })}
                placeholder='Example: 4.99'
              />
              <p className='text-xs text-muted-foreground'>Delivery price per order</p>
            </div>
            
            <div className='space-y-2'>
              <Label htmlFor='freeShippingThreshold'>Free Shipping Threshold</Label>
              <Input
                id='freeShippingThreshold'
                type='number'
                min='0'
                step='0.01'
                value={deliverySettings.freeShippingThreshold}
                onChange={(e) => setDeliverySettings({
                  ...deliverySettings,
                  freeShippingThreshold: parseFloat(e.target.value) || 0
                })}
                placeholder='Example: 50'
              />
              <p className='text-xs text-muted-foreground'>Minimum order amount for free shipping</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Calculator className='h-5 w-5' />
            Tax Settings
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='taxRate'>Tax Rate (%)</Label>
                <Input
                  id='taxRate'
                  type='number'
                  min='0'
                  max='100'
                  step='0.1'
                  value={taxSettings.taxRate}
                  onChange={(e) => setTaxSettings({
                    ...taxSettings,
                    taxRate: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='taxExemptThreshold'>Tax Exempt Threshold</Label>
                <Input
                  id='taxExemptThreshold'
                  type='number'
                  min='0'
                  step='0.01'
                  value={taxSettings.taxExemptThreshold}
                  onChange={(e) => setTaxSettings({
                    ...taxSettings,
                    taxExemptThreshold: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className='flex items-center space-x-2 ltr:space-x-reverse'>
                <Switch
                  id='taxIncluded'
                  checked={taxSettings.taxIncluded}
                  onCheckedChange={(checked) => setTaxSettings({
                    ...taxSettings,
                    taxIncluded: checked
                  })}
                />
                <Label htmlFor='taxIncluded'>Tax Included in Price</Label>
              </div>
            </div>
            
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='taxExemptCategories'>Tax Exempt Categories</Label>
                <Textarea
                  id='taxExemptCategories'
                  placeholder='Enter categories separated by commas (e.g.: prescription-medications, medical-devices)'
                  value={taxSettings.taxExemptCategories.join(', ')}
                  onChange={(e) => setTaxSettings({
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

      {/* Product Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='text-xl flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Product Pricing Settings
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='defaultMarkup'>Default Markup (%)</Label>
              <Input
                id='defaultMarkup'
                type='number'
                min='0'
                step='0.1'
                value={productPricing.defaultMarkup}
                onChange={(e) => setProductPricing({
                  ...productPricing,
                  defaultMarkup: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='bulkDiscountThreshold'>Bulk Discount Threshold</Label>
              <Input
                id='bulkDiscountThreshold'
                type='number'
                min='1'
                value={productPricing.bulkDiscountThreshold}
                onChange={(e) => setProductPricing({
                  ...productPricing,
                  bulkDiscountThreshold: parseInt(e.target.value) || 1
                })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='bulkDiscountRate'>Bulk Discount Rate (%)</Label>
              <Input
                id='bulkDiscountRate'
                type='number'
                min='0'
                max='100'
                step='0.1'
                value={productPricing.bulkDiscountRate}
                onChange={(e) => setProductPricing({
                  ...productPricing,
                  bulkDiscountRate: parseFloat(e.target.value) || 0
                })}
              />
            </div>
          </div>

          {/* Seasonal Discounts */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold text-lg'>Seasonal Discounts</h4>
              <Button onClick={addSeasonalDiscount} size='sm'>
                <Plus className='h-4 w-4 ml-2' />
                Add Seasonal Discount
              </Button>
            </div>
            
            <div className='space-y-4'>
              {productPricing.seasonalDiscounts.map((discount, index) => (
                <div key={index} className='border rounded-lg p-4 space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h5 className='font-medium'>Seasonal Discount {index + 1}</h5>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => removeSeasonalDiscount(index)}
                    >
                      <Trash2 className='h-4 w-4 ml-2' />
                      Delete
                    </Button>
                  </div>
                  
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor={`discountName${index}`}>Discount Name</Label>
                      <Input
                        id={`discountName${index}`}
                        value={discount.name}
                        onChange={(e) => updateSeasonalDiscount(index, 'name', e.target.value)}
                        placeholder='Discount name'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor={`discountRate${index}`}>Discount Rate (%)</Label>
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
                      <Label htmlFor={`startDate${index}`}>Start Date</Label>
                      <Input
                        id={`startDate${index}`}
                        type='date'
                        value={discount.startDate}
                        onChange={(e) => updateSeasonalDiscount(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor={`endDate${index}`}>End Date</Label>
                      <Input
                        id={`endDate${index}`}
                        type='date'
                        value={discount.endDate}
                        onChange={(e) => updateSeasonalDiscount(index, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className='space-y-2'>
                    <Label htmlFor={`applicableCategories${index}`}>Applicable Categories</Label>
                    <Textarea
                      id={`applicableCategories${index}`}
                      placeholder='Enter categories separated by commas (e.g.: vitamins, supplements)'
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

      {/* Save Button */}
      <div className='flex justify-end'>
        <Button onClick={handleSubmit} disabled={isLoading} size='lg'>
          <Save className='h-4 w-4 ml-2' />
          {isLoading ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  )
}

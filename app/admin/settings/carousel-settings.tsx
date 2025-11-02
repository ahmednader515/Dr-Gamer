'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react'
import { useUploadThing } from '@/lib/uploadthing'

interface CarouselItem {
  title: string
  buttonCaption: string
  image: string
  url: string
}

interface CarouselSettingsProps {
  carouselItems: CarouselItem[]
  onCarouselItemsChange: (items: CarouselItem[]) => void
}

export default function CarouselSettings({ carouselItems, onCarouselItemsChange }: CarouselSettingsProps) {
  const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set())
  const { startUpload, isUploading } = useUploadThing('imageUploader')

  const handleCarouselChange = (index: number, field: keyof CarouselItem, value: string) => {
    const newCarouselItems = [...carouselItems]
    newCarouselItems[index] = { ...newCarouselItems[index], [field]: value }
    
    // Auto-update URL when title changes
    if (field === 'title') {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      newCarouselItems[index].url = `/search?category=${slug}`
    }
    
    onCarouselItemsChange(newCarouselItems)
  }

  const addCarouselItem = () => {
    const newItem: CarouselItem = {
      title: 'New Title',
      buttonCaption: 'New Button',
      image: '/images/banner1.jpg',
      url: '/search?category=new-title'
    }
    
    onCarouselItemsChange([...carouselItems, newItem])
  }

  const removeCarouselItem = (index: number) => {
    if (carouselItems.length > 1) {
      const newCarouselItems = carouselItems.filter((_, i) => i !== index)
      onCarouselItemsChange(newCarouselItems)
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
      
      const uploadResult = await startUpload([file])
      
      if (uploadResult && uploadResult[0]) {
        const imageUrl = uploadResult[0].url
        
        const newCarouselItems = [...carouselItems]
        newCarouselItems[index].image = imageUrl
        onCarouselItemsChange(newCarouselItems)
        
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

  return (
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
  )
}

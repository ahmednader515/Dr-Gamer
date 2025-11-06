'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createProduct, updateProduct } from '@/lib/actions/product.actions'
import { getAllCategories } from '@/lib/actions/category.actions'
import { IProductInput } from '@/types'
import { UploadButton } from '@/lib/uploadthing'
import { ProductInputSchema, ProductUpdateSchema } from '@/lib/validator'
import { Checkbox } from '@/components/ui/checkbox'
import { toSlug, toSlugArabic } from '@/lib/utils'
import { useLoading } from '@/hooks/use-loading'
import { LoadingSpinner } from '@/components/shared/loading-overlay'

const productDefaultValues: IProductInput = {
  name: '',
  slug: '',
  category: '',
  images: [],
  brand: '',
  description: '',
  productType: 'game_code',
  platformType: undefined,
  productCategory: undefined,
  variations: [],
  price: 0,
  listPrice: 0,
  countInStock: 0,
  numReviews: 0,
  avgRating: 0,
  numSales: 0,
  isPublished: false,
  tags: [],
  sizes: [],
  colors: [],
  ratingDistribution: [],
  reviews: [],
}

// Helper function to get variations based on platform and product category
const getVariationOptions = (platformType?: string, productCategory?: string): string[] => {
  if (!platformType || !productCategory) return []
  
  // If Digital Code is selected, don't show any variations
  if (productCategory === 'Digital Code') return []
  
  if (platformType === 'Xbox') {
    if (productCategory === 'Game') {
      return ['Home', 'Sign', 'New Account', 'Personal Account', 'Digital Code']
    } else if (productCategory === 'Subscription') {
      return ['Home', 'Sign', 'Full Account', 'Sign PC Without Call of Duty', 'Sign PC With Call of Duty']
    }
  } else if (platformType === 'Playstation') {
    if (productCategory === 'Game') {
      return ['Full Account', 'Personal Account', 'Digital Code', 'Primary PS5', 'Primary PS4', 'Secondary']
    } else if (productCategory === 'Subscription') {
      return ['Full Account', 'Personal Account', 'Digital Code', 'Primary PS5', 'Primary PS4', 'Secondary']
    }
  } else if (platformType === 'Steam') {
    return []
  }
  
  return []
}

const ProductForm = ({
  type,
  product,
  productId,
}: {
  type: 'Create' | 'Update'
  product?: IProductInput & { id: string }
  productId?: string
}) => {
  const router = useRouter()
  const [categories, setCategories] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const { isLoading: isSubmitting, withLoading } = useLoading()
  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>(product?.platformType)
  const [selectedProductCategory, setSelectedProductCategory] = useState<string | undefined>(product?.productCategory)
  const [selectedVariations, setSelectedVariations] = useState<Set<string>>(
    new Set(
      product?.variations && Array.isArray(product.variations) 
        ? product.variations.map((v: any) => v.name) 
        : []
    )
  )
  const [variationPrices, setVariationPrices] = useState<{ [key: string]: number }>(
    product?.variations && Array.isArray(product.variations)
      ? product.variations.reduce((acc: any, v: any) => ({ ...acc, [v.name]: v.price }), {})
      : {}
  )
  
  const [variationOriginalPrices, setVariationOriginalPrices] = useState<{ [key: string]: number }>(
    product?.variations && Array.isArray(product.variations)
      ? product.variations.reduce((acc: any, v: any) => ({ ...acc, [v.name]: v.originalPrice || 0 }), {})
      : {}
  )
  
  // Check if a variation should have dual pricing (original + discounted)
  const shouldHaveDualPricing = (variationName: string) => {
    return variationName === 'Full Account' || variationName === 'Personal Account'
  }

  const form = useForm<IProductInput>({
    resolver:
      type === 'Update'
        ? zodResolver(ProductUpdateSchema)
        : zodResolver(ProductInputSchema),
    defaultValues:
      product && type === 'Update' ? product : productDefaultValues,
    mode: 'onChange',
    shouldFocusError: false,
    shouldUnregister: false,
  })

  // Fetch categories when component mounts
  useEffect(() => {
    console.log('ProductForm mounted with:', { type, product, productId })
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const categoriesData = await getAllCategories()
        // Extract category names from category objects
        const categoryNames = categoriesData.map((cat: any) => cat.name)
        setCategories(categoryNames)
        
        // If this is an update and the product has a category not in the list, add it
        if (type === 'Update' && product?.category && !categoryNames.includes(product.category)) {
          setCategories(prev => [...prev, product.category!])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [type, product, productId])



  const { toast } = useToast()
  const onSubmit = async (values: IProductInput) => {
    // Validate that category is not a placeholder value
    if (values.category === '__loading__' || values.category === '__no_categories__') {
      toast({
        variant: 'destructive',
        description: 'Please select a valid category',
      })
      return
    }

    // Validate that at least one image is provided
    if (values.images.length === 0) {
      toast({
        variant: 'destructive',
        description: 'Please upload at least one image for the product',
      })
      return
    }

    // Auto-generate slug from product name using Arabic-compatible function
    const productData = {
      ...values,
      slug: toSlugArabic(values.name)
    }

    await withLoading(
      async () => {
        if (type === 'Create') {
          const res = await createProduct(productData)
          if (!res.success) {
            toast({
              variant: 'destructive',
              description: res.message,
            })
          } else {
            toast({
              description: res.message,
            })
            router.push(`/admin/products`)
          }
        }
        if (type === 'Update') {
          if (!productId) {
            router.push(`/admin/products`)
            return
          }
          try {
            const res = await updateProduct({ ...productData, _id: productId })
            
            if (!res.success) {
              toast({
                variant: 'destructive',
                description: res.message,
              })
            } else {
              toast({
                description: res.message,
              })
              router.push(`/admin/products`)
            }
          } catch (error) {
            toast({
              variant: 'destructive',
              description: 'An unexpected error occurred during update',
            })
          }
        }
      }
    )
  }
  const images = form.watch('images')

  return (
    <div className='ltr' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8'
        >
          <div className='flex flex-col gap-5 md:flex-row'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-white font-semibold block text-left w-full'>Product Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      dir="ltr"
                      className='border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500 focus:ring-blue-500 text-left'
                      onChange={(e) => {
                        field.onChange(e)
                        if (type === 'Create') {
                          const generatedSlug = toSlugArabic(e.target.value)
                          form.setValue('slug', generatedSlug)
                        }
                      }}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='slug'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-white font-semibold block text-left w-full'>Slug</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      dir="ltr"
                      className='border-gray-700 bg-gray-900 text-gray-300 focus:border-purple-500 focus:ring-blue-500 text-left'
                      readOnly
                      placeholder='Slug will be auto-generated from product name'
                    />
                  </FormControl>
                  <p className='text-xs text-gray-400'>
                    Slug will be auto-generated from product name
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='flex flex-col gap-5 md:flex-row'>
            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-white font-semibold block text-left w-full'>Category (Optional)</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCategories} dir="ltr">
                      <SelectTrigger className='border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500 focus:ring-blue-500 text-left'>
                        <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select category (optional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCategories ? (
                          <SelectItem value="__loading__" disabled>Loading...</SelectItem>
                        ) : categories.length === 0 ? (
                          <SelectItem value="__no_categories__" disabled>No categories available</SelectItem>
                        ) : (
                          categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Platform Type Selection */}
          <div className='flex flex-col gap-5 md:flex-row'>
            <FormField
              control={form.control}
              name='platformType'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-white font-semibold block text-left w-full'>Platform Type (Optional)</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedPlatform(value)
                        setSelectedProductCategory(undefined)
                        form.setValue('productCategory', undefined)
                        form.setValue('variations', [])
                        setVariationPrices({})
                      }} 
                      value={field.value} 
                      dir="ltr"
                    >
                      <SelectTrigger className='border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500 focus:ring-blue-500 text-left'>
                        <SelectValue placeholder="Select platform type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Xbox">Xbox</SelectItem>
                        <SelectItem value="Playstation">Playstation</SelectItem>
                        <SelectItem value="Steam">Steam</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Category Selection */}
            {selectedPlatform && (
              <FormField
                control={form.control}
                name='productCategory'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-white font-semibold block text-left w-full'>Product Category (Optional)</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value)
                          setSelectedProductCategory(value)
                          form.setValue('variations', [])
                          setVariationPrices({})
                        }} 
                        value={field.value} 
                        dir="ltr"
                      >
                        <SelectTrigger className='border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500 focus:ring-blue-500 text-left'>
                          <SelectValue placeholder="Select product category (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Game">Game</SelectItem>
                          <SelectItem value="Subscription">Subscription</SelectItem>
                          <SelectItem value="Digital Code">Digital Code</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Variations with Checkboxes and Prices */}
          {selectedPlatform && selectedProductCategory && getVariationOptions(selectedPlatform, selectedProductCategory).length > 0 && (
            <div className='border border-gray-700 rounded-lg p-4'>
              <h3 className='text-white font-semibold mb-4'>Product Variations & Prices</h3>
              <p className='text-gray-400 text-sm mb-4'>
                Select the variations you want to offer and set their prices. The lowest and highest prices will be displayed as a range on product cards.
              </p>
              <div className='space-y-4'>
                {getVariationOptions(selectedPlatform, selectedProductCategory).map((variation) => {
                  const isSelected = selectedVariations.has(variation)
                  
                  return (
                    <div key={variation} className='border border-gray-600 rounded-lg p-4'>
                      <div className='flex items-center gap-3 mb-3'>
                        <Checkbox
                          id={`variation-${variation}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedVariations)
                            if (checked) {
                              newSelected.add(variation)
                            } else {
                              newSelected.delete(variation)
                              // Remove prices when unchecked
                              const newPrices = { ...variationPrices }
                              const newOriginalPrices = { ...variationOriginalPrices }
                              delete newPrices[variation]
                              delete newOriginalPrices[variation]
                              setVariationPrices(newPrices)
                              setVariationOriginalPrices(newOriginalPrices)
                            }
                            setSelectedVariations(newSelected)
                            
                            // Update form variations
                            const variations = Array.from(newSelected)
                              .map(name => {
                                const variation: any = {
                                  name,
                                  price: variationPrices[name] || 0,
                                }
                                // Only add originalPrice for variations that should have dual pricing
                                if (shouldHaveDualPricing(name) && variationOriginalPrices[name]) {
                                  variation.originalPrice = variationOriginalPrices[name]
                                }
                                return variation
                              })
                              .filter(v => v.price > 0)
                            form.setValue('variations', variations)
                            
                            // Update main price fields with min/max
                            if (variations.length > 0) {
                              const prices = variations.map(v => v.price)
                              const minPrice = Math.min(...prices)
                              const maxPrice = Math.max(...prices)
                              form.setValue('price', minPrice)
                              form.setValue('listPrice', maxPrice)
                            }
                          }}
                        />
                        <label 
                          htmlFor={`variation-${variation}`}
                          className='text-white text-base font-medium cursor-pointer flex-1'
                        >
                          {variation}
                        </label>
                      </div>
                      
                      {isSelected && (
                        <div className='ml-6 space-y-3'>
                          {shouldHaveDualPricing(variation) ? (
                            <>
                              <div>
                                <label className='text-gray-400 text-sm mb-2 block'>Original Price (EGP)</label>
                                <Input
                                  type='number'
                                  step='0.01'
                                  placeholder='Enter original price'
                                  value={variationOriginalPrices[variation] || ''}
                                  onChange={(e) => {
                                    const originalPrice = parseFloat(e.target.value) || 0
                                    const newOriginalPrices = { ...variationOriginalPrices, [variation]: originalPrice }
                                    setVariationOriginalPrices(newOriginalPrices)
                                    
                                    // Update form variations
                                    const variations = Array.from(selectedVariations)
                                      .map(name => {
                                        const variation: any = {
                                          name,
                                          price: variationPrices[name] || 0,
                                        }
                                        // Only add originalPrice for variations that should have dual pricing
                                        if (shouldHaveDualPricing(name) && newOriginalPrices[name]) {
                                          variation.originalPrice = newOriginalPrices[name]
                                        }
                                        return variation
                                      })
                                      .filter(v => v.price > 0)
                                    form.setValue('variations', variations)
                                    
                                    // Update main price fields with min/max
                                    if (variations.length > 0) {
                                      const prices = variations.map(v => v.price)
                                      const minPrice = Math.min(...prices)
                                      const maxPrice = Math.max(...prices)
                                      form.setValue('price', minPrice)
                                      form.setValue('listPrice', maxPrice)
                                    }
                                  }}
                                  className='border-gray-700 bg-gray-800 text-gray-200'
                                />
                              </div>
                              <div>
                                <label className='text-gray-400 text-sm mb-2 block'>Discounted Price (EGP)</label>
                                <Input
                                  type='number'
                                  step='0.01'
                                  placeholder='Enter discounted price'
                                  value={variationPrices[variation] || ''}
                                  onChange={(e) => {
                                    const price = parseFloat(e.target.value) || 0
                                    const newPrices = { ...variationPrices, [variation]: price }
                                    setVariationPrices(newPrices)
                                    
                                    // Update form variations
                                    const variations = Array.from(selectedVariations)
                                      .map(name => {
                                        const variation: any = {
                                          name,
                                          price: newPrices[name] || 0,
                                        }
                                        // Only add originalPrice for variations that should have dual pricing
                                        if (shouldHaveDualPricing(name) && variationOriginalPrices[name]) {
                                          variation.originalPrice = variationOriginalPrices[name]
                                        }
                                        return variation
                                      })
                                      .filter(v => v.price > 0)
                                    form.setValue('variations', variations)
                                    
                                    // Update main price fields with min/max
                                    if (variations.length > 0) {
                                      const prices = variations.map(v => v.price)
                                      const minPrice = Math.min(...prices)
                                      const maxPrice = Math.max(...prices)
                                      form.setValue('price', minPrice)
                                      form.setValue('listPrice', maxPrice)
                                    }
                                  }}
                                  className='border-gray-700 bg-gray-800 text-gray-200'
                                />
                                {variationOriginalPrices[variation] > 0 && variationPrices[variation] > 0 && variationPrices[variation] < variationOriginalPrices[variation] && (
                                  <p className='text-xs text-green-400 mt-1'>
                                    {Math.round(((variationOriginalPrices[variation] - variationPrices[variation]) / variationOriginalPrices[variation]) * 100)}% discount
                                  </p>
                                )}
                              </div>
                            </>
                          ) : (
                            <div>
                              <label className='text-gray-400 text-sm mb-2 block'>Price (EGP)</label>
                              <Input
                                type='number'
                                step='0.01'
                                placeholder='Enter price'
                                value={variationPrices[variation] || ''}
                                onChange={(e) => {
                                  const price = parseFloat(e.target.value) || 0
                                  const newPrices = { ...variationPrices, [variation]: price }
                                  setVariationPrices(newPrices)
                                  
                                  // Update form variations
                                  const variations = Array.from(selectedVariations)
                                    .map(name => {
                                      const variation: any = {
                                        name,
                                        price: newPrices[name] || 0,
                                      }
                                      // Only add originalPrice for variations that should have dual pricing
                                      if (shouldHaveDualPricing(name) && variationOriginalPrices[name]) {
                                        variation.originalPrice = variationOriginalPrices[name]
                                      }
                                      return variation
                                    })
                                    .filter(v => v.price > 0)
                                  form.setValue('variations', variations)
                                  
                                  // Update main price fields with min/max
                                  if (variations.length > 0) {
                                    const prices = variations.map(v => v.price)
                                    const minPrice = Math.min(...prices)
                                    const maxPrice = Math.max(...prices)
                                    form.setValue('price', minPrice)
                                    form.setValue('listPrice', maxPrice)
                                  }
                                }}
                                className='border-gray-700 bg-gray-800 text-gray-200'
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {selectedVariations.size > 0 && Array.from(selectedVariations).some(v => variationPrices[v] > 0) && (
                <div className='mt-4 p-3 bg-gray-800 rounded-lg'>
                  <p className='text-sm text-gray-300'>
                    <span className='font-semibold'>Selected Variations:</span> {Array.from(selectedVariations).filter(v => variationPrices[v] > 0).length}
                  </p>
                  <p className='text-sm text-gray-300 mt-1'>
                    <span className='font-semibold'>Price Range:</span> {
                      (() => {
                        const prices = Array.from(selectedVariations)
                          .map(v => variationPrices[v])
                          .filter(p => p > 0)
                        if (prices.length === 0) return 'No prices set'
                        const min = Math.min(...prices)
                        const max = Math.max(...prices)
                        return min === max ? `${min.toFixed(2)} EGP` : `${min.toFixed(2)} - ${max.toFixed(2)} EGP`
                      })()
                    }
                  </p>
                </div>
              )}
            </div>
          )}
          <div className='flex flex-col gap-5 md:flex-row'>
            <FormField
              control={form.control}
              name='brand'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-white font-semibold block text-left w-full'>Brand</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      dir="ltr"
                      className='border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500 focus:ring-blue-500 text-left'
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='countInStock'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-white font-semibold block text-left w-full'>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      {...field}
                      dir="ltr"
                      className='border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500 focus:ring-blue-500 text-left'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Price fields - only show when no variations are selected */}
          {(!selectedPlatform || !selectedProductCategory || selectedVariations.size === 0) && (
            <div className='flex flex-col gap-5 md:flex-row'>
              <FormField
                control={form.control}
                name='price'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-white font-semibold block text-left w-full'>Price</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        type='number'
                        step='0.01'
                        dir="ltr"
                        className='border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500 focus:ring-blue-500 text-left'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='listPrice'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-white font-semibold block text-left w-full'>List Price (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        type='number'
                        step='0.01'
                        dir="ltr"
                        className='border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500 focus:ring-blue-500 text-left'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <div className='flex flex-col gap-5 md:flex-row'>
            <FormField
              control={form.control}
              name='images'
              render={() => (
                <FormItem className='w-full'>
                  <FormLabel className='text-white font-semibold block text-left w-full'>Images</FormLabel>
                  <Card>
                    <CardContent className='space-y-2 mt-2 min-h-48'>
                      {images.length === 0 ? (
                        <div className='flex items-center justify-center h-32 text-gray-400'>
                          No images uploaded yet
                        </div>
                      ) : (
                        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'>
                          {images.map((image: string, index: number) => (
                            <div
                              key={image || `empty-${index}`}
                              className='relative group cursor-move transition-all duration-200 hover:scale-105'
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', index.toString())
                                e.currentTarget.classList.add('opacity-50')
                              }}
                              onDragEnd={(e) => {
                                e.currentTarget.classList.remove('opacity-50')
                              }}
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.currentTarget.classList.add('ring-2', 'ring-blue-500')
                              }}
                              onDragLeave={(e) => {
                                e.currentTarget.classList.remove('ring-2', 'ring-blue-500')
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                e.currentTarget.classList.remove('ring-2', 'ring-blue-500')
                                const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'))
                                const newImages = [...images]
                                const [draggedImage] = newImages.splice(draggedIndex, 1)
                                newImages.splice(index, 0, draggedImage)
                                form.setValue('images', newImages)
                              }}
                            >
                              {image ? (
                                <Image
                                  src={image}
                                  alt={`Product image ${index + 1}`}
                                  className='w-full h-24 object-cover object-center rounded-sm border'
                                  width={100}
                                  height={100}
                                />
                              ) : (
                                <div className='w-full h-24 bg-gray-700 rounded-sm border flex items-center justify-center text-gray-400 text-xs'>
                                  Empty image
                                </div>
                              )}
                              <button
                                type='button'
                                onClick={() => {
                                  const newImages = images.filter((_, i) => i !== index)
                                  form.setValue('images', newImages)
                                }}
                                className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100'
                              >
                                ×
                              </button>
                              <div className='absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1'>
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className='flex flex-col items-center pt-4 space-y-2'>
                        <p className='text-sm text-gray-400 text-center'>
                          {images.length === 0 
                            ? 'Upload first product image' 
                            : 'Drag and drop to reorder images • Click × to delete'
                          }
                        </p>
                        <FormControl>
                          <UploadButton
                            endpoint='imageUploader'
                            onClientUploadComplete={(res: { url: string }[]) => {
                              form.setValue('images', [...images, res[0].url])
                            }}
                            onUploadError={(error: Error) => {
                              toast({
                                variant: 'destructive',
                                description: `Error! ${error.message}`,
                              })
                            }}
                          />
                        </FormControl>
                      </div>
                    </CardContent>
                  </Card>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-white font-semibold block text-left w-full'>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      dir="ltr"
                      rows={8}
                      className='resize-y border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500 focus:ring-blue-500 text-left min-h-[150px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name='isPublished'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center space-x-2 space-y-0'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className='text-white font-semibold text-left'>Published?</FormLabel>
                </FormItem>
              )}
            />
          </div>
          <div>
                  <Button
          type='button'
          size='lg'
          disabled={isSubmitting}
          onClick={() => {
            const values = form.getValues()
            onSubmit(values)
          }}
          className='button col-span-2 w-full bg-purple-600 hover:bg-purple-700 text-white'
        >
          {isSubmitting ? 'Submitting...' : `${type === 'Create' ? 'Create' : 'Update'} Product`}
        </Button>
        {isSubmitting && (
          <p className='text-sm text-gray-400 text-center'>
            {type === 'Update' ? 'Updating product...' : 'Creating product...'}
          </p>
        )}
        </div>
        </form>
      </Form>
    </div>
  )
}

export default ProductForm

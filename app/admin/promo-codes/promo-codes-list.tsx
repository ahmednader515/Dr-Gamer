'use client'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'
import DeleteDialog from '@/components/shared/delete-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Search, Loader2, Plus } from 'lucide-react'
import ProductPrice from '@/components/shared/product/product-price'
import { getAllProductsForAdmin } from '@/lib/actions/product.actions'

const ALL_CATEGORIES_VALUE = '__all__'
const UNCATEGORIZED_VALUE = '__uncategorized__'

type ProductOption = {
  id: string
  name: string
  price: number
  categoryId?: string | null
  categoryName?: string
  variations: string[]
}

type CategoryOption = {
  id: string
  name: string
}

type PromoCode = {
  id: string
  code: string
  discountPercent: number
  minPurchaseAmount: number | null
  isActive: boolean
  expiresAt: string | null
  usageLimit: number | null
  usageCount: number
  createdAt: string
  assignments: Array<{
    id: string
    type: 'product' | 'category'
    maxDiscountAmount: number | null
    variationNames: string[]
    product: (ProductOption & { variations: string[] }) | null
    category: CategoryOption | null
  }>
}

type PromoCodesListProps = {
  initialPromoCodes: PromoCode[]
  products: ProductOption[]
  categories: CategoryOption[]
}

type SelectedEntry =
  | {
      id: string
      type: 'product'
      product: ProductOption
      maxDiscountAmount: string
      selectedVariations: string[]
    }
  | {
      id: string
      type: 'category'
      category: CategoryOption
      maxDiscountAmount: string
    }

export default function PromoCodesList({
  initialPromoCodes,
  products,
  categories,
}: PromoCodesListProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(initialPromoCodes)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    code: '',
    discountPercent: '',
    minPurchaseAmount: '',
    expiresAt: '',
    usageLimit: '',
  })
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedEntries, setSelectedEntries] = useState<SelectedEntry[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('')
  
  // Product search states
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [productSuggestions, setProductSuggestions] = useState<any[]>([])
  const [isLoadingProductSuggestions, setIsLoadingProductSuggestions] = useState(false)
  const [showProductSuggestions, setShowProductSuggestions] = useState(false)
  const productSearchInputRef = useRef<HTMLInputElement>(null)
  const productSuggestionsRef = useRef<HTMLDivElement>(null)

  const createSelectedProductEntry = (product: ProductOption): SelectedEntry => ({
    id: `product-${product.id}`,
    type: 'product',
    product,
    maxDiscountAmount: product.price ? product.price.toString() : '',
    selectedVariations: [],
  })

  const createSelectedCategoryEntry = (category: CategoryOption): SelectedEntry => ({
    id: `category-${category.id}`,
    type: 'category',
    category,
    maxDiscountAmount: '',
  })

  const categorySelectOptions = useMemo(() => {
    const baseOptions = categories.map((category) => ({
      id: category.id,
      name: category.name,
    }))

    const hasUncategorizedProducts = products.some(
      (product) => !product.categoryId && !product.categoryName,
    )

    return [
      { id: ALL_CATEGORIES_VALUE, name: 'All Categories' },
      ...baseOptions,
      ...(hasUncategorizedProducts
        ? [{ id: UNCATEGORIZED_VALUE, name: 'Uncategorized' }]
        : []),
    ]
  }, [categories, products])

  // Debounced search for product suggestions
  const debouncedProductSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          if (query.trim().length >= 2) {
            setIsLoadingProductSuggestions(true)
            try {
              const result = await getAllProductsForAdmin({
                query: query.trim(),
                page: 1,
                sort: 'latest',
                limit: 10,
              })

              // Filter out already selected products
              const filtered = result.products.filter((p: any) => {
                const isAlreadySelected = selectedEntries.some(
                  (entry) => entry.type === 'product' && entry.product.id === p.id
                )
                return !isAlreadySelected && p.isPublished
              })
              
              // Map to ProductOption format
              const mapped = filtered.map((p: any) => {
                // Safely extract category name as string
                let categoryName: string | null = null
                if (typeof p.category === 'string') {
                  categoryName = p.category
                } else if (p.category?.name && typeof p.category.name === 'string') {
                  categoryName = p.category.name
                } else if (p.categoryRelation?.name && typeof p.categoryRelation.name === 'string') {
                  categoryName = p.categoryRelation.name
                }
                
                // Normalize variations - ensure they're always an array of strings or objects
                let variations: any[] = []
                if (p.variations) {
                  try {
                    if (Array.isArray(p.variations)) {
                      variations = p.variations
                    } else if (typeof p.variations === 'string') {
                      variations = JSON.parse(p.variations)
                    }
                  } catch (e) {
                    variations = []
                  }
                }
                
                return {
                  id: p.id,
                  name: String(p.name || ''),
                  price: Number(p.price) || 0,
                  categoryId: p.categoryId || null,
                  categoryName: categoryName,
                  variations: variations,
                }
              })
              
              setProductSuggestions(mapped)
              setShowProductSuggestions(true)
            } catch (error) {
              console.error('Product suggestions error:', error)
              setProductSuggestions([])
            } finally {
              setIsLoadingProductSuggestions(false)
            }
          } else {
            setProductSuggestions([])
            setShowProductSuggestions(false)
          }
        }, 300) // 300ms debounce
      }
    })(),
    [selectedEntries]
  )

  // Handle product search query change with suggestions
  useEffect(() => {
    if (productSearchQuery.trim().length >= 2) {
      debouncedProductSearch(productSearchQuery)
    } else {
      setProductSuggestions([])
      setShowProductSuggestions(false)
    }
  }, [productSearchQuery, debouncedProductSearch])

  // Close product suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productSuggestionsRef.current &&
        !productSuggestionsRef.current.contains(event.target as Node) &&
        productSearchInputRef.current &&
        !productSearchInputRef.current.contains(event.target as Node)
      ) {
        setShowProductSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const filteredProducts = useMemo(() => {
    if (selectedCategoryIds.length === 0) {
      return products
    }

    return products.filter((product) => {
      const normalizedCategory = product.categoryId ?? UNCATEGORIZED_VALUE
      return selectedCategoryIds.includes(normalizedCategory)
    })
  }, [products, selectedCategoryIds])

  const categoryBulkOptions = useMemo(
    () => categorySelectOptions.filter((option) => option.id !== ALL_CATEGORIES_VALUE),
    [categorySelectOptions],
  )

  useEffect(() => {
    if (!bulkCategoryId) return
    const stillExists = categoryBulkOptions.some((option) => option.id === bulkCategoryId)
    if (!stillExists) {
      setBulkCategoryId('')
    }
  }, [categoryBulkOptions, bulkCategoryId])

  const renderExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 'No limit'
    const date = new Date(expiresAt)
    if (Number.isNaN(date.getTime())) return 'Invalid date'

    const formatted = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    const diffMs = date.getTime() - Date.now()
    if (Math.abs(diffMs) < 60_000) {
      return `${formatted} (${diffMs >= 0 ? 'in < 1 minute' : '< 1 minute ago'})`
    }

    return formatted
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assignments: selectedEntries.map((entry) => {
            if (entry.type === 'product') {
              return {
                type: 'product',
                productId: entry.product.id,
                maxDiscountAmount: entry.maxDiscountAmount
                  ? parseFloat(entry.maxDiscountAmount)
                  : null,
                variationNames: entry.selectedVariations,
              }
            }
            return {
              type: 'category',
              categoryId: entry.category.id,
              maxDiscountAmount: entry.maxDiscountAmount
                ? parseFloat(entry.maxDiscountAmount)
                : null,
            }
          }),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        })
        setPromoCodes([result.data, ...promoCodes])
        setFormData({ code: '', discountPercent: '', minPurchaseAmount: '', expiresAt: '', usageLimit: '' })
        setSelectedEntries([])
        setSelectedProductId('')
        setBulkCategoryId('')
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error creating promo code',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddProduct = (product?: ProductOption) => {
    const productToAdd = product || products.find((p) => p.id === selectedProductId)
    if (!productToAdd) return
    const exists = selectedEntries.some(
      (entry) => entry.type === 'product' && entry.product.id === productToAdd.id,
    )
    if (exists) {
      toast({
        title: 'Notice',
        description: 'This product is already added to the promo code.',
      })
      return
    }
    setSelectedEntries((prev) => [...prev, createSelectedProductEntry(productToAdd)])
    setSelectedProductId('')
    setProductSearchQuery('')
    setShowProductSuggestions(false)
    setProductSuggestions([])
  }

  const handleRemoveEntry = (entryId: string) => {
    setSelectedEntries((prev) => prev.filter((entry) => entry.id !== entryId))
  }

  const handleMaxDiscountChange = (entryId: string, value: string) => {
    setSelectedEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? { ...entry, maxDiscountAmount: value }
          : entry,
      ),
    )
  }

  const handleVariationSelect = (entryId: string, value: string) => {
    setSelectedEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId || entry.type !== 'product') return entry
        if (value === '__all__') {
          return { ...entry, selectedVariations: [] }
        }
        return { ...entry, selectedVariations: [value] }
      }),
    )
  }

  const formatProductPrice = (price: number) =>
    Number.isFinite(price) ? price : Number(price || 0)

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/promo-codes/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        })
        setPromoCodes(promoCodes.filter((code) => code.id !== id))
        return { success: true, message: result.message }
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
        return { success: false, message: result.message }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error deleting promo code',
        variant: 'destructive',
      })
      return { success: false, message: 'An error occurred' }
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })

      const result = await response.json()

      if (result.success) {
        setPromoCodes(
          promoCodes.map((code) =>
            code.id === id ? { ...code, isActive } : code
          )
        )
        toast({
          title: 'Success',
          description: result.message,
        })
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error updating code',
        variant: 'destructive',
      })
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    if (categoryId === ALL_CATEGORIES_VALUE) {
      // Toggle all categories
      if (selectedCategoryIds.length === categoryBulkOptions.length) {
        setSelectedCategoryIds([])
      } else {
        setSelectedCategoryIds(categoryBulkOptions.map(c => c.id))
      }
    } else {
      // Toggle individual category
      setSelectedCategoryIds((prev) => {
        if (prev.includes(categoryId)) {
          return prev.filter(id => id !== categoryId)
        } else {
          return [...prev, categoryId]
        }
      })
    }
  }

  const handleAddCategoryEntry = () => {
    if (selectedCategoryIds.length === 0) {
      toast({
        title: 'Notice',
        description: 'Please select at least one category to add.',
      })
      return
    }

    // Add all selected categories that aren't already added
    const categoriesToAdd = selectedCategoryIds
      .map(categoryId => categorySelectOptions.find(opt => opt.id === categoryId))
      .filter((category): category is CategoryOption => {
        if (!category || category.id === ALL_CATEGORIES_VALUE || category.id === UNCATEGORIZED_VALUE) {
          return false
        }
        // Check if already added
        return !selectedEntries.some(
          (entry) => entry.type === 'category' && entry.category.id === category.id
        )
      })

    if (categoriesToAdd.length === 0) {
      toast({
        title: 'Notice',
        description: 'All selected categories are already added to the promo code.',
      })
      return
    }

    // Add all categories at once to avoid multiple state updates
    setSelectedEntries((prev) => [
      ...prev,
      ...categoriesToAdd.map(category => createSelectedCategoryEntry(category))
    ])

    toast({
      title: 'Categories Added',
      description: `Added ${categoriesToAdd.length} categor${categoriesToAdd.length === 1 ? 'y' : 'ies'}.`,
    })

    setSelectedCategoryIds([])
    setBulkCategoryId('')
  }

  return (
    <div className='space-y-6 ltr text-left' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <h1 className='h1-bold text-white'>Manage Promo Codes</h1>

      {/* Create Promo Code Form */}
      <Card className='border-2 border-purple-600 bg-gray-900'>
        <CardHeader>
          <CardTitle className='text-white'>Create New Promo Code</CardTitle>
          <CardDescription className='text-gray-300'>Add a new discount code for customers</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='code' className='text-white'>Code *</Label>
                <Input
                  id='code'
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder='Example: SUMMER2024'
                  required
                  className='bg-gray-800 text-white border-gray-700'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='discountPercent' className='text-white'>Discount Percentage (%) *</Label>
                <Input
                  id='discountPercent'
                  type='number'
                  min='1'
                  max='100'
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                  placeholder='Example: 20'
                  required
                  className='bg-gray-800 text-white border-gray-700'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='minPurchaseAmount' className='text-white'>Minimum Purchase Amount (EGP) (Optional)</Label>
                <Input
                  id='minPurchaseAmount'
                  type='number'
                  min='0'
                  step='0.01'
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                  placeholder='Example: 100 or 500'
                  className='bg-gray-800 text-white border-gray-700'
                />
                <p className='text-xs text-gray-400'>
                  Minimum total purchase amount required to use this code. Leave empty for no minimum.
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='expiresAt' className='text-white'>Expiry Date (Optional)</Label>
                <Input
                  id='expiresAt'
                  type='datetime-local'
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className='bg-gray-800 text-white border-gray-700'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='usageLimit' className='text-white'>Usage Limit (Optional)</Label>
                <Input
                  id='usageLimit'
                  type='number'
                  min='1'
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder='Example: 100'
                  className='bg-gray-800 text-white border-gray-700'
                />
              </div>
            </div>

            <div className='space-y-3 border-t border-gray-800 pt-4'>
              <div className='space-y-2'>
                <Label className='text-white'>Apply to Specific Products (optional)</Label>
                <p className='text-xs text-gray-400'>
                  Select one or more products that this promo code should work with. Leave empty to allow the code for any product.
                </p>
                
                {/* Category Multi-Select */}
                <div className='space-y-2'>
                  <Label className='text-sm text-gray-300'>Filter by Categories (optional)</Label>
                  <div className='bg-gray-800 border border-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto'>
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id='select-all-categories'
                          checked={selectedCategoryIds.length === categoryBulkOptions.length && categoryBulkOptions.length > 0}
                          onCheckedChange={() => handleCategoryToggle(ALL_CATEGORIES_VALUE)}
                          className='border-gray-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600'
                        />
                        <Label
                          htmlFor='select-all-categories'
                          className='text-sm font-medium text-white cursor-pointer'
                        >
                          Select All Categories
                        </Label>
                      </div>
                      {categoryBulkOptions.map((category) => (
                        <div key={category.id} className='flex items-center space-x-2'>
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={selectedCategoryIds.includes(category.id)}
                            onCheckedChange={() => handleCategoryToggle(category.id)}
                            className='border-gray-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600'
                          />
                          <Label
                            htmlFor={`category-${category.id}`}
                            className='text-sm text-gray-300 cursor-pointer'
                          >
                            {category.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Product Search Bar */}
                <div className='space-y-2'>
                  <Label className='text-sm text-gray-300'>Search and Add Products</Label>
                  <div className='relative'>
                    <div className='flex gap-2'>
                      <div className='relative flex-1'>
                        <Input
                          ref={productSearchInputRef}
                          placeholder='Type to search products (suggestions will appear)...'
                          value={productSearchQuery}
                          onChange={(e) => {
                            setProductSearchQuery(e.target.value)
                            if (e.target.value.trim().length >= 2) {
                              setShowProductSuggestions(true)
                            }
                          }}
                          onFocus={() => {
                            if (productSuggestions.length > 0) {
                              setShowProductSuggestions(true)
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (productSuggestions.length > 0 && showProductSuggestions) {
                                handleAddProduct(productSuggestions[0])
                              }
                            } else if (e.key === 'Escape') {
                              setShowProductSuggestions(false)
                            }
                          }}
                          className='bg-gray-800 text-white border-gray-700 pr-10'
                        />
                        {isLoadingProductSuggestions && (
                          <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                            <Loader2 className='h-4 w-4 animate-spin text-gray-400' />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Suggestions Dropdown */}
                    {showProductSuggestions && productSuggestions.length > 0 && (
                      <div
                        ref={productSuggestionsRef}
                        className='absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto'
                      >
                        <div className='p-2'>
                          <div className='flex items-center justify-between mb-2 px-2'>
                            <Label className='text-xs text-gray-400'>Suggestions</Label>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800'
                              onClick={() => {
                                setShowProductSuggestions(false)
                                setProductSearchQuery('')
                              }}
                            >
                              <X className='h-3 w-3' />
                            </Button>
                          </div>
                          {productSuggestions.map((product) => (
                            <button
                              key={product.id}
                              type='button'
                              onClick={() => handleAddProduct(product)}
                              className='w-full flex items-center justify-between p-2 rounded hover:bg-gray-800 transition-colors text-left'
                            >
                              <div className='flex-1 min-w-0'>
                                <p className='font-medium text-sm truncate text-white'>{product.name}</p>
                                <p className='text-xs text-gray-400 truncate'>
                                  {String(product.categoryName || 'Uncategorized')} • {Number(product.price).toFixed(2)} EGP
                                </p>
                              </div>
                              <Plus className='h-4 w-4 ml-2 flex-shrink-0 text-gray-400' />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No suggestions message */}
                    {showProductSuggestions && !isLoadingProductSuggestions && productSuggestions.length === 0 && productSearchQuery.trim().length >= 2 && (
                      <div className='absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-4'>
                        <p className='text-sm text-gray-400 text-center'>
                          No products found. Try a different search term.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Categories Button */}
                <div className='flex flex-col sm:flex-row gap-2 sm:justify-end'>
                  <Button
                    type='button'
                    variant='outline'
                    className='bg-green-600/20 border-green-600 text-green-200 hover:bg-green-600/30'
                    onClick={handleAddCategoryEntry}
                    disabled={selectedCategoryIds.length === 0}
                  >
                    Add Selected Categories ({selectedCategoryIds.length})
                  </Button>
                </div>
              </div>

              {selectedEntries.length > 0 && (
                <div className='space-y-3'>
                  {selectedEntries.map((entry) => {
                    if (entry.type === 'product') {
                      const { product } = entry
                      return (
                        <div
                          key={entry.id}
                          className='flex flex-col gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3'
                        >
                          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                            <div>
                              <p className='text-white font-medium'>{product.name}</p>
                              <p className='text-xs text-gray-400'>
                                Category: {String(product.categoryName ?? 'Uncategorized')}
                              </p>
                              <p className='text-xs text-gray-400'>
                                Price:{' '}
                                <ProductPrice price={formatProductPrice(product.price)} plain />
                              </p>
                            </div>
                      <div className='flex flex-col sm:flex-row sm:items-end gap-3'>
                        <div className='space-y-1 sm:w-40'>
                          <Label className='text-sm text-gray-300'>
                            Max Discount Amount (EGP)
                          </Label>
                          <Input
                            type='number'
                            min='0'
                            step='0.01'
                            value={entry.maxDiscountAmount}
                            onChange={(event) =>
                              handleMaxDiscountChange(entry.id, event.target.value)
                            }
                            className='bg-gray-900 border-gray-700 text-white'
                            placeholder='No limit'
                          />
                          <p className='text-xs text-gray-400'>
                            Leave empty for no limit.
                          </p>
                        </div>
                        <div className='space-y-1 sm:flex-1'>
                          <Label className='text-sm text-gray-300'>
                            Restrict to Variation
                          </Label>
                          <Select
                            value={
                              entry.selectedVariations.length > 0
                                ? entry.selectedVariations[0]
                                : '__all__'
                            }
                            onValueChange={(value) =>
                              handleVariationSelect(entry.id, value)
                            }
                          >
                            <SelectTrigger className='bg-gray-900 border-gray-700 text-white'>
                              <SelectValue placeholder='All variations' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='__all__'>All variations</SelectItem>
                              {product.variations.map((variation: any, varIndex: number) => {
                                // Handle both string and object variations
                                const variationName = typeof variation === 'string' 
                                  ? variation 
                                  : (variation?.name || String(variation))
                                const variationValue = typeof variation === 'string'
                                  ? variation
                                  : (variation?.name || String(variation))
                                return (
                                  <SelectItem key={`${variationValue}-${varIndex}`} value={variationValue}>
                                    {variationName}
                                  </SelectItem>
                                )
                              })}
                              {product.variations.length === 0 && (
                                <SelectItem value='__no_variations__' disabled>
                                  No variations defined
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <p className='text-xs text-gray-500'>
                            Select a specific variation to limit the promo discount, or leave
                            as "All variations".
                          </p>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          className='text-red-400 hover:text-red-300 hover:bg-red-900/20'
                          onClick={() => handleRemoveEntry(entry.id)}
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={entry.id}
                        className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3'
                      >
                        <div>
                          <p className='text-white font-medium'>
                            Category: {entry.category.name}
                          </p>
                          {entry.category.id === UNCATEGORIZED_VALUE && (
                            <p className='text-xs text-gray-400'>
                              Applies to products without an assigned category.
                            </p>
                          )}
                        </div>
                        <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
                          <div className='space-y-1'>
                            <Label className='text-sm text-gray-300'>
                              Max Discount Amount (EGP)
                            </Label>
                            <Input
                              type='number'
                              min='0'
                              step='0.01'
                              value={entry.maxDiscountAmount}
                              onChange={(event) =>
                                handleMaxDiscountChange(entry.id, event.target.value)
                              }
                              className='bg-gray-900 border-gray-700 text-white w-full sm:w-36'
                              placeholder='No limit'
                            />
                          </div>
                          <p className='text-xs text-gray-400 sm:w-40'>
                            Leave empty for no limit.
                          </p>
                          <Button
                            type='button'
                            variant='ghost'
                            className='text-red-400 hover:text-red-300 hover:bg-red-900/20'
                            onClick={() => handleRemoveEntry(entry.id)}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <Button type='submit' disabled={isCreating} className='bg-purple-600 hover:bg-purple-700'>
              {isCreating ? 'Creating...' : 'Create Promo Code'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Promo Codes List */}
      <Card className='border-2 border-purple-600 bg-gray-900'>
        <CardHeader>
          <CardTitle className='text-white'>Current Promo Codes</CardTitle>
          <CardDescription className='text-gray-300'>
            Total Codes: {promoCodes.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table className='admin-table border border-gray-700 rounded-lg'>
              <TableHeader>
                <TableRow className='bg-gray-800 border-b-2 border-gray-700'>
                  <TableHead className='text-left text-purple-400'>Code</TableHead>
                  <TableHead className='text-left text-purple-400'>Discount</TableHead>
                  <TableHead className='text-left text-purple-400'>Min Purchase</TableHead>
                  <TableHead className='text-left text-purple-400'>Products</TableHead>
                  <TableHead className='text-left text-purple-400'>Status</TableHead>
                  <TableHead className='text-left text-purple-400'>Usage</TableHead>
                  <TableHead className='text-left text-purple-400'>Expires</TableHead>
                  <TableHead className='text-left text-purple-400'>Created</TableHead>
                  <TableHead className='text-left text-purple-400'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((code) => (
                  <TableRow key={code.id} className='bg-gray-800 hover:bg-gray-700 border-b border-gray-700'>
                    <TableCell className='font-bold text-white'>{code.code}</TableCell>
                    <TableCell className='text-purple-400'>{code.discountPercent}%</TableCell>
                    <TableCell className='text-gray-300'>
                      {code.assignments.length === 0 ? (
                        <span className='text-sm text-gray-400'>All products</span>
                      ) : (
                        <div className='space-y-2'>
                          {code.assignments.map((assignment, index) => {
                            if (assignment.type === 'product' && assignment.product) {
                              return (
                                <div key={assignment.id || `product-${assignment.product.id}-${index}`} className='flex flex-col text-sm gap-1'>
                                  <span className='font-medium text-white'>
                                    {assignment.product.name}
                                  </span>
                                  <span className='text-xs text-gray-400'>
                                    Category:{' '}
                                    {String(assignment.product.categoryName ?? 'Uncategorized')}
                                  </span>
                                  <span className='text-xs text-gray-400'>
                                    Price:{' '}
                                    <ProductPrice
                                      price={formatProductPrice(assignment.product.price)}
                                      plain
                                    />
                                  </span>
                                  {assignment.variationNames.length > 0 && (
                                    <span className='text-xs text-purple-300'>
                                      Variations:{' '}
                                      {assignment.variationNames.join(', ')}
                                    </span>
                                  )}
                                  <span className='text-xs text-purple-300'>
                                    Max discount:{' '}
                                    {assignment.maxDiscountAmount !== null ? (
                                      <ProductPrice
                                        price={formatProductPrice(assignment.maxDiscountAmount)}
                                        plain
                                      />
                                    ) : (
                                      <span className='text-gray-500'>No max limit</span>
                                    )}
                                  </span>
                                </div>
                              )
                            }

                            if (assignment.type === 'category' && assignment.category) {
                              return (
                                <div key={assignment.id || `category-${assignment.category.id}-${index}`} className='flex flex-col text-sm gap-1'>
                                  <span className='font-medium text-white'>
                                    Category: {assignment.category.name}
                                  </span>
                                  <span className='text-xs text-purple-300'>
                                    Max discount:{' '}
                                    {assignment.maxDiscountAmount !== null ? (
                                      <ProductPrice
                                        price={formatProductPrice(assignment.maxDiscountAmount)}
                                        plain
                                      />
                                    ) : (
                                      <span className='text-gray-500'>No max limit</span>
                                    )}
                                  </span>
                                </div>
                              )
                            }

                            return null
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleToggleActive(code.id, !code.isActive)}
                        className={`min-w-[100px] ${
                          code.isActive
                            ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        }`}
                      >
                        {code.isActive ? '✓ Active' : '✕ Inactive'}
                      </Button>
                    </TableCell>
                    <TableCell className='text-gray-300'>
                      {code.usageCount} / {code.usageLimit || '∞'}
                    </TableCell>
                    <TableCell className='text-gray-300'>
                      {renderExpiry(code.expiresAt)}
                    </TableCell>
                    <TableCell className='text-gray-300'>
                      {formatDateTime(new Date(code.createdAt)).dateTime}
                    </TableCell>
                    <TableCell>
                      <DeleteDialog id={code.id} action={handleDelete} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {promoCodes.length === 0 && (
            <div className='text-center py-8 text-gray-400'>
              No promo codes currently
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchFiltersProps {
  categories: string[]
  tags?: string[]
  maxPrice: number
}

export default function SearchFilters({ categories, tags, maxPrice }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Default to collapsed on mobile (screen width < 1024px which is lg breakpoint)
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 // lg breakpoint
    }
    return false // Default to collapsed for SSR
  })
  const [priceRange, setPriceRange] = useState([0, maxPrice])
  
  // Update isOpen state on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true) // Always open on desktop
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Get current filter values
  const currentCategory = searchParams.get('category') || ''
  const currentMinPrice = searchParams.get('minPrice') || '0'
  const currentMaxPrice = searchParams.get('maxPrice') || maxPrice.toString()

  // English translations
  const translations = {
    filters: 'Filters',
    category: 'Category',
    tags: 'Tags',
    priceRange: 'Price Range',
    clearAll: 'Clear All',
    apply: 'Apply',
    showFilters: 'Show Filters',
    hideFilters: 'Hide Filters',
    allCategories: 'All Categories',
    allTags: 'All Tags',
    price: 'Price',
    egp: '$',
    from: 'From',
    to: 'To',
    noResults: 'No Results',
    results: 'result',
    resultsPlural: 'results'
  }

  const updateFilters = (newParams: Record<string, string | string[]>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.delete(key)
        value.forEach(v => params.append(key, v))
      } else {
        params.set(key, value)
      }
    })
    
    params.set('page', '1') // Reset to first page when filters change
    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams()
    if (currentCategory) params.set('category', currentCategory)
    router.push(`/search?${params.toString()}`)
  }

  const handleCategoryChange = (category: string) => {
    if (category === currentCategory) {
      updateFilters({ category: '' })
    } else {
      updateFilters({ category })
    }
  }

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values)
  }

  const applyPriceFilter = () => {
    updateFilters({
      minPrice: priceRange[0].toString(),
      maxPrice: priceRange[1].toString()
    })
  }

  const removeFilter = (key: string, value?: string) => {
    if (key === 'category') {
      updateFilters({ category: '' })
    } else if (key === 'price') {
      updateFilters({ minPrice: '', maxPrice: '' })
      setPriceRange([0, maxPrice])
    }
  }

  const activeFilters = [
    ...(currentCategory ? [{ key: 'category', value: currentCategory, label: currentCategory }] : []),
    ...(currentMinPrice !== '0' || currentMaxPrice !== maxPrice.toString() ? [{ key: 'price', value: '', label: `${currentMinPrice} - ${currentMaxPrice} ${translations.egp}` }] : [])
  ]

  return (
    <div className="bg-gray-900 rounded-xl shadow-sm border-0 p-4 sm:p-6 lg:sticky lg:top-6" dir="ltr">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
          <h3 className="font-semibold text-lg sm:text-xl text-white">{translations.filters}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 sm:p-2 rounded-lg lg:hidden"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Always show filters on desktop, toggle on mobile */}
      <div className={isOpen ? 'block' : 'hidden lg:block'}>
        <>
          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-medium text-gray-300">{translations.filters}:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  {translations.clearAll}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 text-xs"
                  >
                    {filter.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(filter.key, filter.value)}
                      className="h-3 w-3 sm:h-4 sm:w-4 p-0"
                    >
                      <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="mb-4 sm:mb-6">
            <Label className="text-sm font-semibold mb-3 sm:mb-4 block text-white">{translations.category}</Label>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-categories"
                  checked={!currentCategory}
                  onCheckedChange={() => handleCategoryChange('')}
                  className="text-purple-500"
                />
                <Label htmlFor="all-categories" className="text-xs sm:text-sm text-gray-300 cursor-pointer">
                  {translations.allCategories}
                </Label>
              </div>
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={currentCategory === category}
                    onCheckedChange={() => handleCategoryChange(category)}
                    className="text-purple-500"
                  />
                  <Label htmlFor={category} className="text-xs sm:text-sm text-gray-300 cursor-pointer">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-4 sm:my-6" />

          {/* Price Range Filter */}
          <div className="mb-4 sm:mb-6">
            <Label className="text-sm font-semibold mb-3 sm:mb-4 block text-white">{translations.priceRange}</Label>
            <div className="space-y-3 sm:space-y-4">
              <Slider
                value={priceRange}
                onValueChange={handlePriceChange}
                max={maxPrice}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full sm:w-auto">
                  <Label className="text-xs text-gray-300 mb-2 block">{translations.from}</Label>
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="text-xs sm:text-sm bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500 input-mobile"
                    min={0}
                    max={priceRange[1]}
                  />
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <Label className="text-xs text-gray-300 mb-2 block">{translations.to}</Label>
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || maxPrice])}
                    className="text-xs sm:text-sm bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500 input-mobile"
                    min={priceRange[0]}
                    max={maxPrice}
                  />
                </div>
              </div>
              <Button
                onClick={applyPriceFilter}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white btn-mobile"
                size="sm"
              >
                {translations.apply}
              </Button>
            </div>
          </div>
        </>
      </div>
    </div>
  )
}

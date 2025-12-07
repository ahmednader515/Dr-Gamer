'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Plus, Trash2, Search, X, RefreshCw, Loader2 } from 'lucide-react'
import { getAllProductsForAdmin } from '@/lib/actions/product.actions'

interface NewlyAddedProductsSettingsProps {
  newlyAddedProducts: string[] // Array of product IDs
  onNewlyAddedProductsChange: (products: string[]) => void
}

export default function NewlyAddedProductsSettings({ 
  newlyAddedProducts, 
  onNewlyAddedProductsChange 
}: NewlyAddedProductsSettingsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fetch selected products details
  useEffect(() => {
    const fetchSelectedProducts = async () => {
      if (newlyAddedProducts.length === 0) {
        setSelectedProducts([])
        return
      }

      try {
        const result = await getAllProductsForAdmin({
          query: 'all',
          page: 1,
          sort: 'latest',
          limit: 1000,
        })

        const products = result.products.filter((p: any) => 
          newlyAddedProducts.includes(p.id)
        )
        // Sort by creation date (newest first)
        products.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime()
          const dateB = new Date(b.createdAt || 0).getTime()
          return dateB - dateA
        })
        setSelectedProducts(products)
      } catch (error) {
        console.error('Error fetching selected products:', error)
      }
    }

    fetchSelectedProducts()
  }, [newlyAddedProducts])

  // Debounced search for suggestions
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          if (query.trim().length >= 2) {
            setIsLoadingSuggestions(true)
            try {
              const result = await getAllProductsForAdmin({
                query: query.trim(),
                page: 1,
                sort: 'latest',
                limit: 10, // Limit suggestions to 10 for better performance
              })

              const filtered = result.products.filter((p: any) => 
                !newlyAddedProducts.includes(p.id) && p.isPublished
              )
              setSuggestions(filtered)
              setShowSuggestions(true)
            } catch (error) {
              console.error('Suggestions error:', error)
              setSuggestions([])
            } finally {
              setIsLoadingSuggestions(false)
            }
          } else {
            setSuggestions([])
            setShowSuggestions(false)
          }
        }, 300) // 300ms debounce
      }
    })(),
    [newlyAddedProducts]
  )

  // Handle search query change with suggestions
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery, debouncedSearch])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleAutoPopulate = async () => {
    try {
      const result = await getAllProductsForAdmin({
        query: 'all',
        page: 1,
        sort: 'latest',
        limit: 20,
      })

      const latestProducts = result.products
        .filter((p: any) => p.isPublished)
        .slice(0, 20)
        .map((p: any) => p.id)

      onNewlyAddedProductsChange(latestProducts)
      toast({
        title: 'Auto-Populated',
        description: 'Latest 20 products have been loaded',
        variant: 'default'
      })
    } catch (error) {
      console.error('Auto-populate error:', error)
      toast({
        title: 'Error',
        description: 'Failed to auto-populate products. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Search Error',
        description: 'Please enter a search query',
        variant: 'destructive'
      })
      return
    }

    setIsSearching(true)
    try {
      const result = await getAllProductsForAdmin({
        query: searchQuery,
        page: 1,
        sort: 'latest',
        limit: 50,
      })

      // Filter out already selected products
      const filtered = result.products.filter((p: any) => 
        !newlyAddedProducts.includes(p.id) && p.isPublished
      )
      setSearchResults(filtered)
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: 'Search Error',
        description: 'Failed to search products. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSearching(false)
    }
  }

  const addProduct = (product: any) => {
    if (newlyAddedProducts.includes(product.id)) {
      toast({
        title: 'Already Added',
        description: 'This product is already in the list',
        variant: 'default'
      })
      return
    }

    const newProducts = [...newlyAddedProducts, product.id]
    onNewlyAddedProductsChange(newProducts)
    setSearchResults(searchResults.filter(p => p.id !== product.id))
    setSuggestions(suggestions.filter(p => p.id !== product.id))
    setSearchQuery('')
    setShowSuggestions(false)
    toast({
      title: 'Product Added',
      description: `${product.name} has been added`,
      variant: 'default'
    })
  }

  const removeProduct = (productId: string) => {
    const newProducts = newlyAddedProducts.filter(id => id !== productId)
    onNewlyAddedProductsChange(newProducts)
    toast({
      title: 'Product Removed',
      description: 'Product has been removed from the list',
      variant: 'default'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2'>
          Newly Added Products
        </CardTitle>
        <p className='text-sm text-muted-foreground'>
          Manage products shown in the "Newly Added" section. Auto-populate will load the latest 20 products, but you can customize the list.
        </p>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Auto-Populate Button */}
        <div className='flex justify-end'>
          <Button onClick={handleAutoPopulate} variant='outline'>
            <RefreshCw className='h-4 w-4 ml-2' />
            Auto-Populate Latest 20 Products
          </Button>
        </div>

        {/* Search Section */}
        <div className='space-y-4'>
          <div className='relative'>
            <div className='flex gap-2'>
              <div className='relative flex-1'>
                <Input
                  ref={searchInputRef}
                  placeholder='Type to search products (suggestions will appear)...'
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (e.target.value.trim().length >= 2) {
                      setShowSuggestions(true)
                    }
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (suggestions.length > 0 && showSuggestions) {
                        // Add first suggestion on Enter
                        addProduct(suggestions[0])
                      } else {
                        handleSearch()
                      }
                    } else if (e.key === 'Escape') {
                      setShowSuggestions(false)
                    }
                  }}
                  className='pr-10'
                />
                {isLoadingSuggestions && (
                  <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                    <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                  </div>
                )}
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                <Search className='h-4 w-4 ml-2' />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
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
                        setShowSuggestions(false)
                        setSearchQuery('')
                      }}
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </div>
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      type='button'
                      onClick={() => addProduct(product)}
                      className='w-full flex items-center justify-between p-2 rounded hover:bg-gray-800 transition-colors text-left'
                    >
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-sm truncate text-white'>{product.name}</p>
                        <p className='text-xs text-gray-400 truncate'>
                          {product.category} • {Number(product.price).toFixed(2)} EGP
                        </p>
                      </div>
                      <Plus className='h-4 w-4 ml-2 flex-shrink-0 text-gray-400' />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No suggestions message */}
            {showSuggestions && !isLoadingSuggestions && suggestions.length === 0 && searchQuery.trim().length >= 2 && (
              <div className='absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-4'>
                <p className='text-sm text-gray-400 text-center'>
                  No products found. Try a different search term.
                </p>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className='border border-gray-700 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto bg-gray-900'>
              <div className='flex items-center justify-between mb-2'>
                <Label className='text-white'>Search Results</Label>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-gray-400 hover:text-white hover:bg-gray-800'
                  onClick={() => {
                    setSearchResults([])
                    setSearchQuery('')
                  }}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className='flex items-center justify-between p-2 border border-gray-700 rounded hover:bg-gray-800 transition-colors'
                >
                  <div className='flex-1'>
                    <p className='font-medium text-white'>{product.name}</p>
                    <p className='text-sm text-gray-400'>
                      {product.category} • {Number(product.price).toFixed(2)} EGP
                    </p>
                  </div>
                  <Button
                    size='sm'
                    onClick={() => addProduct(product)}
                  >
                    <Plus className='h-4 w-4 ml-1' />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Products */}
        <div className='space-y-4'>
          <Label>Newly Added Products ({selectedProducts.length})</Label>
          {selectedProducts.length === 0 ? (
            <div className='text-center py-8 text-gray-400 border border-gray-700 rounded-lg'>
              <p className='text-white'>No products yet</p>
              <p className='text-sm text-gray-400'>Click "Auto-Populate" to load the latest 20 products or search and add manually</p>
            </div>
          ) : (
            <div className='space-y-2 max-h-96 overflow-y-auto'>
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className='flex items-center justify-between p-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors'
                >
                  <div className='flex-1'>
                    <p className='font-medium text-white'>{product.name}</p>
                    <p className='text-sm text-gray-400'>
                      {product.category} • {Number(product.price).toFixed(2)} EGP
                      {product.createdAt && (
                        <span className='ml-2'>
                          • Added {new Date(product.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => removeProduct(product.id)}
                  >
                    <Trash2 className='h-4 w-4 ml-1' />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


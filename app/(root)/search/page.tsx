import React, { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import ProductCard from '@/components/shared/product/product-card'
import ProductSortSelector from '@/components/shared/product/product-sort-selector'
import SearchFilters from '@/components/shared/search-filters'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
    page?: string
    tag?: string | string[]
  }>
}

// Loading skeleton components
function SearchHeaderSkeleton() {
  return (
    <div className='mb-6 sm:mb-8 bg-gray-900 rounded-xl p-4 sm:p-6 shadow-sm'>
      <div className='h-6 sm:h-8 bg-gray-700 rounded w-3/4 mb-2 sm:mb-3 animate-pulse'></div>
      <div className='h-4 sm:h-6 bg-gray-700 rounded w-1/2 animate-pulse'></div>
    </div>
  )
}

function ProductGridSkeleton() {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10 mb-6 sm:mb-8'>
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className='overflow-hidden'>
          <CardContent className='p-3 sm:p-4'>
            <div className='w-full h-36 sm:h-48 bg-gray-200 rounded-lg mb-2 sm:mb-3 animate-pulse'></div>
            <div className='h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse'></div>
            <div className='h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse'></div>
            <div className='h-4 sm:h-6 bg-gray-200 rounded w-1/3 animate-pulse'></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function FiltersSkeleton() {
  return (
    <div className='w-full'>
      <Card>
        <CardContent className='p-3 sm:p-4'>
          <div className='h-5 sm:h-6 bg-gray-200 rounded w-20 sm:w-24 mb-3 sm:mb-4 animate-pulse'></div>
          <div className='space-y-2 sm:space-y-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='h-3 sm:h-4 bg-gray-200 rounded w-full animate-pulse'></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Async components for progressive loading
async function SearchHeader({ params, translations }: { 
  params: any, 
  translations: any 
}) {
  const {
    q = '',
    category = '',
    minPrice = '',
    maxPrice = '',
    tag = '',
    platformType = '',
    productCategory = '',
  } = params

  // Build the same where clause to get the count
  const where: any = { isPublished: true }
  
  if (q && q !== 'all') {
    where.name = { contains: q, mode: 'insensitive' }
  }
  
  // Handle multiple categories in SearchHeader too - support both formats
  let categories: string[] = []
  if (Array.isArray(category)) {
    categories = category
  } else if (category) {
    // Check if it's comma-separated
    categories = category.includes(',') ? category.split(',').map(c => c.trim()) : [category]
  }
  const validCategories = categories.filter(c => c && c !== 'all' && c !== '')
  
  if (validCategories.length > 0) {
    const categoryRecords = await prisma.category.findMany({
      where: { 
        name: { in: validCategories },
        isActive: true 
      },
      select: { id: true, name: true }
    })
    
    if (categoryRecords.length > 0) {
      const categoryIds = categoryRecords.map(c => c.id)
      const categoryNames = categoryRecords.map(c => c.name)
      
      where.OR = [
        { categoryId: { in: categoryIds } },
        { category: { in: categoryNames } }
      ]
    } else {
      where.category = { in: validCategories }
    }
  }
  
  if (tag && tag !== 'all') {
    if (Array.isArray(tag)) {
      where.tags = { hasSome: tag }
    } else {
      where.tags = { has: tag }
    }
  }
  
  if (platformType && platformType !== 'all') {
    where.platformType = { equals: platformType, mode: 'insensitive' }
  }
  
  if (productCategory && productCategory !== 'all') {
    where.productCategory = { equals: productCategory, mode: 'insensitive' }
  }
  
  if (minPrice || maxPrice) {
    const priceFilter: any = {}
    if (minPrice) {
      const parsed = Number(minPrice)
      if (!Number.isNaN(parsed)) {
        priceFilter.gte = new Prisma.Decimal(parsed.toFixed(2))
      }
    }
    if (maxPrice) {
      const parsed = Number(maxPrice)
      if (!Number.isNaN(parsed)) {
        priceFilter.lte = new Prisma.Decimal(parsed.toFixed(2))
      }
    }
    if (Object.keys(priceFilter).length > 0) {
      where.price = priceFilter
    }
  }

  // Get the total count
  const totalProducts = await (prisma as any).product.count({ where })

  if (totalProducts === 0) {
    return (
      <div className='text-center py-8 sm:py-12'>
        <h3 className='text-base sm:text-lg font-semibold mb-2'>{translations.noProductsFound}</h3>
        <p className='text-sm sm:text-base text-muted-foreground px-4'>
          {translations.tryAdjustingSearch}
        </p>
      </div>
    )
  }

  // Determine what to display in the heading
  let displayTitle = ''
  if (q) {
    displayTitle = `${translations.searchResults} "${q}"`
  } else if (validCategories.length > 0) {
    // Show multiple categories
    if (validCategories.length === 1) {
      displayTitle = `${translations.productsIn} ${validCategories[0]}`
    } else {
      displayTitle = `${translations.productsIn} ${validCategories.length} Categories`
    }
  } else if (platformType) {
    displayTitle = `${translations.productsIn} ${platformType}`
  } else if (productCategory) {
    displayTitle = `${translations.productsIn} ${productCategory}`
  } else {
    displayTitle = translations.productsIn
  }

  return (
    <div className='mb-6 sm:mb-8 bg-gray-900 rounded-xl p-4 sm:p-6 shadow-sm'>
      <h1 className='text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-left text-white'>
        {displayTitle}
      </h1>
      <p className='text-sm sm:text-base text-gray-300 text-left'>
        {translations.found} {totalProducts} {totalProducts === 1 ? translations.product : translations.products}
      </p>
    </div>
  )
}

async function ProductResults({ params, translations }: { 
  params: any, 
  translations: any 
}) {
  const {
    q = '',
    category = '',
    minPrice = '',
    maxPrice = '',
    sort = 'newest',
    page = '1',
    tag = '',
    platformType = '',
    productCategory = '',
  } = params

  const currentPage = parseInt(page)
  const limit = 12
  const skip = (currentPage - 1) * limit

  // Build Prisma where clause
  const where: any = { isPublished: true }
  
  if (q && q !== 'all') {
    where.name = { contains: q, mode: 'insensitive' }
  }
  
  // Handle multiple categories - support both array and comma-separated formats
  let categories: string[] = []
  if (Array.isArray(category)) {
    categories = category
  } else if (category) {
    // Check if it's comma-separated
    categories = category.includes(',') ? category.split(',').map(c => c.trim()) : [category]
  }
  const validCategories = categories.filter(c => c && c !== 'all' && c !== '')
  
  if (validCategories.length > 0) {
    // Look up categories by name to get IDs
    const categoryRecords = await prisma.category.findMany({
      where: { 
        name: { in: validCategories },
        isActive: true 
      },
      select: { id: true, name: true }
    })
    
    if (categoryRecords.length > 0) {
      const categoryIds = categoryRecords.map(c => c.id)
      const categoryNames = categoryRecords.map(c => c.name)
      
      where.OR = [
        { categoryId: { in: categoryIds } },
        { category: { in: categoryNames } } // Fallback for products not yet migrated
      ]
    } else {
      // Fallback to old system if categories not found in new system
      where.category = { in: validCategories }
    }
  }
  
  if (tag && tag !== 'all') {
    if (Array.isArray(tag)) {
      where.tags = { hasSome: tag }
    } else {
      where.tags = { has: tag }
    }
  }
  
  if (platformType && platformType !== 'all') {
    where.platformType = { equals: platformType, mode: 'insensitive' }
  }
  
  if (productCategory && productCategory !== 'all') {
    where.productCategory = { equals: productCategory, mode: 'insensitive' }
  }
  
  if (minPrice || maxPrice) {
    const priceFilter: any = {}
    if (minPrice) {
      const parsed = Number(minPrice)
      if (!Number.isNaN(parsed)) {
        priceFilter.gte = new Prisma.Decimal(parsed.toFixed(2))
      }
    }
    if (maxPrice) {
      const parsed = Number(maxPrice)
      if (!Number.isNaN(parsed)) {
        priceFilter.lte = new Prisma.Decimal(parsed.toFixed(2))
      }
    }
    if (Object.keys(priceFilter).length > 0) {
      where.price = priceFilter
    }
  }

  // Build order by clause
  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'best-selling') {
    orderBy = { numSales: 'desc' }
  } else if (sort === 'price-low-to-high') {
    orderBy = { price: 'asc' }
  } else if (sort === 'price-high-to-low') {
    orderBy = { price: 'desc' }
  } else if (sort === 'avg-customer-review') {
    orderBy = { avgRating: 'desc' }
  }

  // Direct database queries
  const products = await (prisma as any).product.findMany({
    where,
    orderBy,
    skip,
    take: limit,
  })
  
  const totalProducts = await (prisma as any).product.count({ where })

  // Convert Decimal values to numbers for client components and parse variations
  const normalizedProducts = products.map((product: any) => {
    // Parse variations if they're stored as JSON string
    let variations = null
    if (product.variations) {
      try {
        variations = typeof product.variations === 'string' 
          ? JSON.parse(product.variations)
          : product.variations
      } catch (e) {
        console.error('Error parsing variations:', e)
        variations = null
      }
    }
    
    return {
      ...product,
      price: Number(product.price),
      listPrice: Number(product.listPrice),
      originalPrice: Number(product.originalPrice),
      itemsPrice: Number(product.itemsPrice ?? product.price),
      avgRating: Number(product.avgRating),
      numReviews: Number(product.numReviews),
      variations: variations,
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
    }
  })

  const priceMinValue = minPrice ? Number(minPrice) : undefined
  const priceMaxValue = maxPrice ? Number(maxPrice) : undefined

  const filteredProducts = normalizedProducts.filter((product: any) => {
    if (priceMinValue === undefined && priceMaxValue === undefined) {
      return true
    }

    const candidatePrices: number[] = []
    const basePrice = Number(product.price)
    if (!Number.isNaN(basePrice)) {
      candidatePrices.push(basePrice)
    }

    if (product.variations && Array.isArray(product.variations)) {
      product.variations.forEach((variation: any) => {
        const variationPrice = Number(variation.price)
        if (!Number.isNaN(variationPrice)) {
          candidatePrices.push(variationPrice)
        }
      })
    }

    if (candidatePrices.length === 0) {
      return false
    }

    return candidatePrices.some((price) => {
      if (priceMinValue !== undefined && price < priceMinValue) {
        return false
      }
      if (priceMaxValue !== undefined && price > priceMaxValue) {
        return false
      }
      return true
    })
  })

  const resultProducts = filteredProducts
  const hasResults = resultProducts.length > 0
  const displayTotalProducts = hasResults ? totalProducts : 0
  const totalPages = hasResults ? Math.max(1, Math.ceil(displayTotalProducts / limit)) : 1
  const from = hasResults ? skip + 1 : 0
  const to = hasResults ? Math.min(skip + resultProducts.length, displayTotalProducts) : 0

  return (
    <>
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 bg-gray-900 rounded-xl p-3 sm:p-4 shadow-sm'>
        <ProductSortSelector 
          sortOrders={[
            { value: 'newest', name: translations.newest },
            { value: 'price-low-to-high', name: translations.priceLowToHigh },
            { value: 'price-high-to-low', name: translations.priceHighToLow },
            { value: 'best-selling', name: translations.bestSelling },
            { value: 'avg-customer-review', name: translations.avgCustomerReview }
          ]}
          sort={sort}
          params={params}
        />
        <p className='text-xs sm:text-sm text-gray-300 text-left'>
          {translations.showing} {from}-{to} {translations.of} {displayTotalProducts} {translations.products}
        </p>
      </div>

      {resultProducts.length === 0 ? (
        <div className='text-center py-8 sm:py-12'>
          <h3 className='text-base sm:text-lg font-semibold mb-2'>{translations.noProductsFound}</h3>
          <p className='text-sm sm:text-base text-muted-foreground px-4'>
            {translations.tryAdjustingSearch}
          </p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10 mb-6 sm:mb-8 items-stretch'>
            {resultProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Simple pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              {currentPage > 1 && (
                <a 
                  href={`/search?${new URLSearchParams({
                    ...params,
                    page: (currentPage - 1).toString()
                  })}`}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Previous
                </a>
              )}
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              {currentPage < totalPages && (
                <a 
                  href={`/search?${new URLSearchParams({
                    ...params,
                    page: (currentPage + 1).toString()
                  })}`}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}

async function SearchFiltersSection({ params }: { params: any }) {
  // Get categories from the new category table
  const categories = await (prisma as any).category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
  
  const categoryList = categories.map((c: any) => c.name)

  return (
    <div className='w-full'>
      <SearchFilters 
        categories={categoryList}
        maxPrice={1000}
      />
    </div>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const {
    q = '',
    category = '',
    minPrice = '',
    maxPrice = '',
    platformType = '',
    productCategory = '',
    tag = '',
  } = params

  // Check if we have any valid search criteria
  let hasCategory = false
  if (Array.isArray(category)) {
    hasCategory = category.some(c => c && c !== '' && c !== 'all')
  } else if (category) {
    // Handle comma-separated or single category
    const cats = category.includes(',') ? category.split(',') : [category]
    hasCategory = cats.some(c => c.trim() !== '' && c.trim() !== 'all')
  }

  const hasPriceFilter =
    (typeof minPrice === 'string' && minPrice.trim() !== '') ||
    (typeof maxPrice === 'string' && maxPrice.trim() !== '')

  const hasTagFilter = Array.isArray(tag)
    ? tag.some((value) => value && value !== '' && value !== 'all')
    : Boolean(tag && tag !== '' && tag !== 'all')
  
  // Allow "all" as a valid search to show all products
  if (
    !q &&
    !hasCategory &&
    !platformType &&
    !productCategory &&
    !hasPriceFilter &&
    !hasTagFilter
  ) {
    notFound()
  }

  // English translations
  const translations = {
    searchResults: 'Search Results',
    productsIn: 'Products in',
    found: 'Found',
    product: 'product',
    products: 'products',
    loading: '...',
    filters: 'Filters',
    filterOptionsComingSoon: 'Filter options coming soon...',
    showing: 'Showing',
    of: 'of',
    noProductsFound: 'No products found',
    tryAdjustingSearch: 'Try adjusting your search criteria or browse all products',
    sortBy: 'Sort by',
    newest: 'Newest',
    priceLowToHigh: 'Price: Low to High',
    priceHighToLow: 'Price: High to Low',
    bestSelling: 'Best Selling',
    avgCustomerReview: 'Average Customer Review'
  }

  return (
    <div className='container mx-auto px-4 py-6 sm:py-8' dir="ltr">
      {/* Search Header - Load first */}
      <Suspense fallback={<SearchHeaderSkeleton />}>
        <SearchHeader params={params} translations={translations} />
      </Suspense>

      {/* Desktop Layout: Side-by-side filters and products */}
      <div className='hidden lg:flex gap-6'>
        {/* Left Sidebar - Filters */}
        <div className='w-80 flex-shrink-0'>
          <Suspense fallback={<FiltersSkeleton />}>
            <SearchFiltersSection params={params} />
          </Suspense>
        </div>

        {/* Right Side - Main Content */}
        <div className='flex-1 min-w-0'>
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductResults params={params} translations={translations} />
          </Suspense>
        </div>
      </div>

      {/* Mobile Layout: Filters on top, products below */}
      <div className='lg:hidden'>
        {/* Filters Section - Load second, positioned at top */}
        <div className='mb-6 sm:mb-8'>
          <Suspense fallback={<FiltersSkeleton />}>
            <SearchFiltersSection params={params} />
          </Suspense>
        </div>

        {/* Main Content - Load third, full width */}
        <div className='w-full'>
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductResults params={params} translations={translations} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

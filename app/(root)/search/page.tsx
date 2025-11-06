import React, { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
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
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8'>
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
  
  if (category && category !== 'all') {
    const categoryRecord = await prisma.category.findFirst({
      where: { name: category, isActive: true },
      select: { id: true }
    })
    
    if (categoryRecord) {
      where.OR = [
        { categoryId: categoryRecord.id },
        { category: category }
      ]
    } else {
      where.category = category
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
    where.price = { }
    if (minPrice) {
      where.price.gte = parseFloat(minPrice)
    }
    if (maxPrice) {
      where.price.lte = parseFloat(maxPrice)
    }
  }

  // Get the total count
  const totalProducts = await (prisma as any).product.count({ where })

  // Determine what to display in the heading
  let displayTitle = ''
  if (q) {
    displayTitle = `${translations.searchResults} "${q}"`
  } else if (category) {
    displayTitle = `${translations.productsIn} ${category}`
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
  
  if (category && category !== 'all') {
    // Look up category by name to get ID
    const categoryRecord = await prisma.category.findFirst({
      where: { name: category, isActive: true },
      select: { id: true }
    })
    
    if (categoryRecord) {
      where.OR = [
        { categoryId: categoryRecord.id },
        { category: category } // Fallback for products not yet migrated
      ]
    } else {
      // Fallback to old system if category not found in new system
      where.category = category
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
    where.price = { }
    if (minPrice) {
      where.price.gte = parseFloat(minPrice)
    }
    if (maxPrice) {
      where.price.lte = parseFloat(maxPrice)
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
      avgRating: Number(product.avgRating),
      numReviews: Number(product.numReviews),
      variations: variations,
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
    }
  })

  const totalPages = Math.ceil(totalProducts / limit)
  const from = skip + 1
  const to = Math.min(skip + limit, totalProducts)

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
          {translations.showing} {from}-{to} {translations.of} {totalProducts} {translations.products}
        </p>
      </div>

      {products.length === 0 ? (
        <div className='text-center py-8 sm:py-12'>
          <h3 className='text-base sm:text-lg font-semibold mb-2'>{translations.noProductsFound}</h3>
          <p className='text-sm sm:text-base text-muted-foreground px-4'>
            {translations.tryAdjustingSearch}
          </p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-10 mb-6 sm:mb-8 items-stretch'>
            {normalizedProducts.map((product: any) => (
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
    platformType = '',
    productCategory = '',
  } = params

  if (!q && !category && !platformType && !productCategory) {
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

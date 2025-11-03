import HomeCarousel from '@/components/shared/home/home-carousel'
import ProductSlider from '@/components/shared/product/product-slider'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import React, { Suspense } from 'react'
import { prisma } from '@/lib/db'
import { getBestSellingProducts } from '@/lib/actions/product.actions'
import PlatformsSection from '@/components/shared/home/platforms-section'
import DiscoverByPrice from '@/components/shared/home/discover-by-price'
import ProductsSection from '@/components/shared/home/products-section'

export const runtime = 'nodejs'

// Loading skeleton for categories
function CategoriesSkeleton() {
  return (
    <Card className='w-full rounded-xl shadow-sm border-2 border-purple-600 bg-gray-900'>
      <CardContent className='card-mobile'>
        <div className='h-6 sm:h-8 bg-gray-700 rounded w-32 sm:w-48 mb-4 sm:mb-6 animate-pulse'></div>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex flex-col items-center'>
              <div className='w-20 h-20 sm:w-24 sm:h-24 bg-gray-700 rounded-lg mb-2 sm:mb-3 animate-pulse'></div>
              <div className='h-3 sm:h-4 bg-gray-700 rounded w-12 sm:w-16 animate-pulse'></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ProductSliderSkeleton({ title }: { title: string }) {
  return (
    <Card className='w-full rounded-xl shadow-sm border-2 border-purple-600 bg-gray-900'>
      <CardContent className='card-mobile'>
        <div className='h-6 sm:h-8 bg-gray-700 rounded w-24 sm:w-32 mb-4 sm:mb-6 animate-pulse'></div>
        <div className='flex space-x-3 sm:space-x-4 overflow-hidden'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='flex-shrink-0 w-32 sm:w-48'>
              <div className='w-full h-24 sm:h-32 bg-gray-700 rounded-lg mb-2 animate-pulse'></div>
              <div className='h-3 sm:h-4 bg-gray-700 rounded w-3/4 mb-2 animate-pulse'></div>
              <div className='h-3 sm:h-4 bg-gray-700 rounded w-1/2 animate-pulse'></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Categories with L-shape around carousel
async function CategoriesBesideCarousel({ categories }: { categories: { id: string, name: string, image?: string }[] }) {
  return (
    <div className='w-full space-y-3'>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/search?category=${category.name}`}
          className='group relative block rounded-xl overflow-hidden'
        >
          <div className='relative w-full h-[75px] sm:h-[92px] md:h-[125px] lg:h-[159px]'>
            {category.image ? (
              <Image
                src={category.image}
                alt={category.name}
                fill
                className='object-cover'
                sizes='(max-width: 768px) 100vw, 33vw'
                priority={false}
              />
            ) : (
              <div className='w-full h-full bg-gray-800' />
            )}
            <div className='absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors' />
          </div>
        </Link>
      ))}
    </div>
  )
}

// Most purchased products section
async function MostPurchasedSection() {
  try {
    const bestSellingProducts = await getBestSellingProducts()
    
    // Convert to the format needed by ProductSlider
    const formattedProducts = bestSellingProducts.map(product => ({
      id: product.id || '',
      name: product.name,
      slug: product.slug,
      image: product.image,
      images: product.images,
      price: Number(product.price),
      listPrice: Number(product.listPrice),
      avgRating: Number(product.avgRating),
      numReviews: Number(product.numReviews),
      productType: product.productType,
      platformType: product.platformType,
      productCategory: product.productCategory,
      variations: product.variations,
      countInStock: product.countInStock,
      brand: product.brand,
    }))

    if (formattedProducts.length === 0) return null
    
    return (
      <Card className='w-full rounded-xl bg-transparent border-0 shadow-none'>
        <CardContent className='card-mobile p-0'>
          <h2 className='text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-right text-white'>Best Selling Products</h2>
          <ProductSlider 
            title={undefined}
            products={formattedProducts} 
            hideDetails={false}
          />
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error('Error loading most purchased products:', error)
    return null
  }
}

async function FirstCategorySection({ categories }: { categories: string[] }) {
  try {
    const firstCategory = categories[0]
    if (!firstCategory) return null

    const categoryRecords = await prisma.category.findMany({
      where: { name: firstCategory, isActive: true },
      select: { id: true, name: true }
    })

    const categoryRecord = categoryRecords[0]
    const categoryIdToName = categoryRecord ? { [categoryRecord.id]: categoryRecord.name } : {}

    const allProducts = await prisma.product.findMany({
      where: {
        OR: categoryRecord ? [
          { categoryId: categoryRecord.id },
          { category: firstCategory }
        ] : [{ category: firstCategory }],
        isPublished: true,
      },
      orderBy: [{ numSales: 'desc' }, { avgRating: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        price: true,
        listPrice: true,
        avgRating: true,
        numReviews: true,
        category: true,
        categoryId: true,
        productType: true,
        platformType: true,
        productCategory: true,
        variations: true,
        countInStock: true,
        brand: true,
      }
    })

    const products = allProducts.slice(0, 8).map(product => {
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
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '',
        images: Array.isArray(product.images) ? product.images : [],
        price: Number(product.price),
        listPrice: Number(product.listPrice),
        avgRating: Number(product.avgRating),
        numReviews: Number(product.numReviews),
        productType: (product as any).productType || 'game_code',
        platformType: (product as any).platformType,
        productCategory: (product as any).productCategory,
        variations: variations,
        countInStock: (product as any).countInStock,
        brand: (product as any).brand,
      }
    })

    if (products.length === 0) return null

    return (
      <Card className='w-full rounded-xl bg-transparent border-0 shadow-none'>
        <CardContent className='card-mobile p-0'>
          <ProductSlider title={firstCategory} products={products} />
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error('Error loading first category products:', error)
    return null
  }
}

async function RemainingCategoriesSection({ categories }: { categories: string[] }) {
  try {
    const remainingCategories = categories.slice(1)
    if (remainingCategories.length === 0) return null

    const categoryRecords = await prisma.category.findMany({
      where: { name: { in: remainingCategories }, isActive: true },
      select: { id: true, name: true }
    })

    const categoryIds = categoryRecords.map(cat => cat.id)
    const categoryIdToName = Object.fromEntries(categoryRecords.map(cat => [cat.id, cat.name]))

    const allProducts = await prisma.product.findMany({
      where: {
        OR: [{ categoryId: { in: categoryIds } }, { category: { in: remainingCategories } }],
        isPublished: true,
      },
      orderBy: [{ numSales: 'desc' }, { avgRating: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        price: true,
        listPrice: true,
        avgRating: true,
        numReviews: true,
        category: true,
        categoryId: true,
        productType: true,
        platformType: true,
        productCategory: true,
        variations: true,
        countInStock: true,
        brand: true,
      }
    })

    const productsByCategory = remainingCategories.reduce((acc, category) => {
      acc[category] = allProducts
        .filter(product => {
          const categoryName = product.categoryId ? categoryIdToName[product.categoryId] : product.category
          return categoryName === category
        })
        .slice(0, 8)
        .map(product => {
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
            id: product.id,
            name: product.name,
            slug: product.slug,
            image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '',
            images: Array.isArray(product.images) ? product.images : [],
            price: Number(product.price),
            listPrice: Number(product.listPrice),
            avgRating: Number(product.avgRating),
            numReviews: Number(product.numReviews),
            productType: (product as any).productType || 'game_code',
            platformType: (product as any).platformType,
            productCategory: (product as any).productCategory,
            variations: variations,
            countInStock: (product as any).countInStock,
            brand: (product as any).brand,
          }
        })
      return acc
    }, {} as Record<string, any[]>)
    
    return (
      <>
        {remainingCategories.map((category: string, index: number) => {
          const products = productsByCategory[category] || []
          if (products.length === 0) return null
          
          return (
            <React.Fragment key={category}>
              <Card className='w-full rounded-xl bg-transparent border-0 shadow-none'>
                <CardContent className='card-mobile p-0'>
                  <ProductSlider title={category} products={products} />
                </CardContent>
              </Card>
            </React.Fragment>
          )
        })}
      </>
    )
  } catch (error) {
    console.error('Error loading remaining category products:', error)
    return <ProductSliderSkeleton title="Products" />
  }
}

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, image: true },
  })

  const categoryList = categories.map(c => c.name)
  const setting = await prisma.setting.findFirst()
  
  // Split categories for L-shape: some beside carousel, rest below
  const categoriesBeside = categories.slice(0, 3)
  const categoriesBelow = categories.slice(3)

  return (
    <div className='font-cairo text-white overflow-x-hidden' dir='ltr'>
      {/* --- HERO SECTION --- */}
      <div className='relative pt-4 md:pt-6 pb-8'>
        <div className='max-w-[80%] mx-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 items-start'>
            {/* Left: Categories beside carousel */}
            <div className='lg:col-span-1 order-2 lg:order-1'>
              <Suspense fallback={<CategoriesSkeleton />}>
                <CategoriesBesideCarousel categories={categoriesBeside} />
              </Suspense>
            </div>

            {/* Right: Main Carousel */}
            <div className='lg:col-span-2 rounded-xl overflow-hidden shadow-lg order-1 lg:order-2'>
              <HomeCarousel carousels={setting?.carousels as any[] || []} />
            </div>
          </div>
          
          {/* Categories below carousel in a horizontal grid */}
          {categoriesBelow.length > 0 && (
            <div className='mt-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                {categoriesBelow.map((category) => (
                  <Link
                    key={category.id}
                    href={`/search?category=${category.name}`}
                    className='group relative block rounded-xl overflow-hidden'
                  >
                    <div className='relative w-full h-[75px] sm:h-[92px] md:h-[125px] lg:h-[159px]'>
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className='object-cover'
                          sizes='(max-width: 1024px) 50vw, 33vw'
                        />
                      ) : (
                        <div className='w-full h-full bg-gray-800' />
                      )}
                      <div className='absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors' />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MOST PURCHASED PRODUCTS --- */}
      <div id="offers" className='py-8'>
        <div className='max-w-[80%] mx-auto'>
          <Suspense fallback={<ProductSliderSkeleton title='Best Selling Products' />}>
            <MostPurchasedSection />
          </Suspense>
        </div>
      </div>

      {/* --- PLATFORMS SECTION --- */}
      <PlatformsSection />

      {/* --- PRODUCTS SECTION --- */}
      <div className="mt-8">
        <ProductsSection />
      </div>

      {/* --- PRODUCT SLIDERS --- */}
      <div className='p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8'>
        <div className='max-w-[80%] mx-auto'>
          <Suspense fallback={<ProductSliderSkeleton title='Products' />}>
            <FirstCategorySection categories={categoryList} />
          </Suspense>
        </div>
      </div>

      {/* --- REMAINING PRODUCT SLIDERS --- */}
      <div className='p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8'>
        <div className='max-w-[80%] mx-auto'>
          <Suspense fallback={<ProductSliderSkeleton title='Products' />}>
            <RemainingCategoriesSection categories={categoryList} />
          </Suspense>
        </div>
      </div>

      {/* --- DISCOVER BY PRICE SECTION --- */}
      <div className='-mx-4 sm:-mx-6 lg:-mx-8 mb-0'>
        <div className='w-screen' style={{ marginLeft: 'calc((100% - 100vw) / 2)', marginRight: 'calc((100% - 100vw) / 2)' }}>
          <DiscoverByPrice />
        </div>
      </div>
    </div>
  )
}

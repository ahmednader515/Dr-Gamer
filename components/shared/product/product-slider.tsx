'use client'

import * as React from 'react'
import ProductCard from './product-card'
import { IProductInput } from '@/types'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default function ProductSlider({
  title,
  products,
  hideDetails = false,
}: {
  title?: string
  products: (IProductInput & { id: string })[]
  hideDetails?: boolean
}) {
  const [swiperInstance, setSwiperInstance] = React.useState<any>(null)
  const [isBeginning, setIsBeginning] = React.useState(true)
  const [isEnd, setIsEnd] = React.useState(true)
  const navigationPrevRef = React.useRef(null)
  const navigationNextRef = React.useRef(null)

  React.useEffect(() => {
    if (swiperInstance && navigationPrevRef.current && navigationNextRef.current) {
      swiperInstance.params.navigation.prevEl = navigationPrevRef.current
      swiperInstance.params.navigation.nextEl = navigationNextRef.current
      swiperInstance.navigation.init()
      swiperInstance.navigation.update()
    }
  }, [swiperInstance])

  const slidesPerView = hideDetails ? 6 : 5

  React.useEffect(() => {
    if (swiperInstance) {
      setIsBeginning(swiperInstance.isBeginning)
      setIsEnd(swiperInstance.isEnd)
    }
  }, [swiperInstance])

  const handleSlideChange = (swiper: any) => {
    setIsBeginning(swiper.isBeginning)
    setIsEnd(swiper.isEnd)
  }

  React.useEffect(() => {
    if (swiperInstance) {
      swiperInstance.on('slideChange', handleSlideChange)
      return () => {
        swiperInstance.off('slideChange', handleSlideChange)
      }
    }
  }, [swiperInstance])

  return (
    <div className='w-full font-cairo rounded-xl p-4 sm:p-6 overflow-visible' dir="rtl">
      {title && (
        <h2 className='text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-right text-white'>{title}</h2>
      )}
      
      <div className="relative px-2 py-4">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={16}
          slidesPerView={1}
          onSwiper={setSwiperInstance}
          onSlideChange={handleSlideChange}
          navigation={{
            prevEl: navigationPrevRef.current,
            nextEl: navigationNextRef.current,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
            enabled: true,
          }}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            768: {
              slidesPerView: hideDetails ? 3 : 2,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: hideDetails ? 4 : 3,
              spaceBetween: 24,
            },
            1280: {
              slidesPerView: hideDetails ? 5 : 4,
              spaceBetween: 24,
            },
            1536: {
              slidesPerView: hideDetails ? 6 : 5,
              spaceBetween: 24,
            },
          }}
          loop={products.length > slidesPerView}
          autoplay={{
            delay: 5000,
            disableOnInteraction: true,
            pauseOnMouseEnter: true,
          }}
          dir="rtl"
          className="product-swiper"
        >
          {products.map((product) => (
            <SwiperSlide key={product.slug}>
              <ProductCard
                hideDetails={hideDetails}
                hideAddToCart
                hideBorder
                product={product}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Buttons */}
        <button
          ref={navigationNextRef}
          className={`absolute -left-10 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200 border-2 ${
            isEnd 
              ? 'bg-gray-800/50 text-gray-400 border-gray-700 cursor-not-allowed' 
              : 'bg-gray-800/90 hover:bg-green-600 text-white hover:scale-110 border-gray-700 hover:border-green-500 cursor-pointer'
          }`}
          aria-label="Next slide"
          disabled={isEnd}
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        
        <button
          ref={navigationPrevRef}
          className={`absolute -right-10 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200 border-2 ${
            isBeginning 
              ? 'bg-gray-800/50 text-gray-400 border-gray-700 cursor-not-allowed' 
              : 'bg-gray-800/90 hover:bg-green-600 text-white hover:scale-110 border-gray-700 hover:border-green-500 cursor-pointer'
          }`}
          aria-label="Previous slide"
          disabled={isBeginning}
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      <style jsx global>{`
        .product-swiper {
          padding-bottom: 50px !important;
        }
        
        .product-swiper .swiper-pagination {
          bottom: 10px !important;
          position: absolute !important;
          z-index: 10 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }
        
        .product-swiper .swiper-pagination-bullet {
          width: 10px !important;
          height: 10px !important;
          background: #4b5563 !important;
          opacity: 1 !important;
          transition: all 0.3s ease !important;
          margin: 0 4px !important;
          cursor: pointer !important;
        }
        
        .product-swiper .swiper-pagination-bullet-active {
          background: #10b981 !important;
          width: 28px !important;
          border-radius: 5px !important;
          opacity: 1 !important;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6) !important;
        }
        
        .product-swiper .swiper-pagination-bullet:hover {
          background: #6ee7b7 !important;
          opacity: 1 !important;
          transform: scale(1.2);
        }
        
        .product-swiper .swiper-pagination-bullet-active-main {
          background: #10b981 !important;
        }
        
        .product-swiper .swiper-pagination-bullet-active-prev,
        .product-swiper .swiper-pagination-bullet-active-next {
          background: #059669 !important;
          width: 8px !important;
          height: 8px !important;
        }
      `}</style>
    </div>
  )
}

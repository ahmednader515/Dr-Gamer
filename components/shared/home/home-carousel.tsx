'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

interface CarouselItem {
  image: string
  title: string
  url: string
  buttonCaption: string
}

interface HomeCarouselProps {
  carousels: CarouselItem[]
}

export default function HomeCarousel({ carousels }: HomeCarouselProps) {
  const [swiperInstance, setSwiperInstance] = React.useState<any>(null)

  // Early return if no carousels
  if (!carousels || carousels.length === 0) {
    return null;
  }

  return (
    <div 
      className="font-cairo relative overflow-hidden" 
      dir="rtl"
    >
      <div className="relative w-full h-[250px] sm:h-[300px] md:h-[400px] lg:h-[500px]">
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectFade]}
          spaceBetween={0}
          slidesPerView={1}
          onSwiper={setSwiperInstance}
          pagination={{
            clickable: true,
            dynamicBullets: false,
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          loop={carousels.length > 1}
          effect="fade"
          fadeEffect={{
            crossFade: true
          }}
          className="home-carousel h-full"
        >
          {carousels.map((carousel, index) => (
            <SwiperSlide key={index}>
              <div className="relative h-full w-full">
                {carousel.image ? (
                  <Image
                    src={carousel.image}
                    alt={carousel.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-lg">لا توجد صورة</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center text-white px-4">
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold mb-3 sm:mb-4 font-cairo">
                      {carousel.title}
                    </h2>
                    <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                      <Link href={carousel.url}>
                        {carousel.buttonCaption}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Custom Navigation Arrows */}
        <button
          onClick={() => swiperInstance?.slideNext()}
          className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-gray-900/20 hover:bg-purple-600/80 text-white border-0 backdrop-blur-sm transition-all duration-200 hover:scale-110 shadow-lg flex items-center justify-center"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
        </button>
        
        <button
          onClick={() => swiperInstance?.slidePrev()}
          className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-gray-900/20 hover:bg-purple-600/80 text-white border-0 backdrop-blur-sm transition-all duration-200 hover:scale-110 shadow-lg flex items-center justify-center"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
        </button>
      </div>

      <style jsx global>{`
        .home-carousel .swiper-pagination {
          bottom: 12px !important;
          position: absolute !important;
          z-index: 10 !important;
        }
        
        .home-carousel .swiper-pagination-bullet {
          width: 12px !important;
          height: 12px !important;
          background: rgba(255, 255, 255, 0.5) !important;
          opacity: 1 !important;
          transition: all 0.3s ease !important;
          border: 2px solid transparent !important;
          margin: 0 4px !important;
        }
        
        .home-carousel .swiper-pagination-bullet-active {
          background: #9d60e9 !important;
          width: 32px !important;
          border-radius: 6px !important;
          border-color: #9d60e9 !important;
          box-shadow: 0 0 10px rgba(157, 96, 233, 0.5) !important;
        }
        
        .home-carousel .swiper-pagination-bullet:hover {
          background: #b894e9 !important;
          transform: scale(1.2);
        }
        
        @media (min-width: 640px) {
          .home-carousel .swiper-pagination {
            bottom: 24px !important;
          }
          
          .home-carousel .swiper-pagination-bullet {
            width: 14px !important;
            height: 14px !important;
          }
          
          .home-carousel .swiper-pagination-bullet-active {
            width: 40px !important;
          }
        }
      `}</style>
    </div>
  )
}

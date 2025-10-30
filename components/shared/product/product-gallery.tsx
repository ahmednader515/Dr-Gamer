'use client'

import { useState } from 'react'
import Image from 'next/image'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
export default function ProductGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(0)
  return (
    <div className='flex gap-2'>
      <div className='flex flex-col gap-2 mt-8'>
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => {
              setSelectedImage(index)
            }}
            onMouseOver={() => {
              setSelectedImage(index)
            }}
            className={`bg-gray-900 rounded-lg overflow-hidden ${
              selectedImage === index
                ? 'ring-2 ring-blue-500'
                : 'ring-1 ring-gray-300'
            }`}
          >
            {image ? (
              <Image src={image} alt={'product image'} width={48} height={48} />
            ) : (
              <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-xs">IMG</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className='w-full'>
        <Zoom>
          <div className='relative h-[500px]'>
            {images[selectedImage] ? (
              <Image
                src={images[selectedImage]}
                alt={'product image'}
                fill
                sizes='90vw'
                className='object-contain'
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">لا توجد صورة</span>
              </div>
            )}
          </div>
        </Zoom>
      </div>
    </div>
  )
}

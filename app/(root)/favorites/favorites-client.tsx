'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/shared/product/product-card'
import { useFavorites } from '@/hooks/use-favorites'

function FavoritesGridSkeleton() {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className='h-96 bg-gray-200 rounded-xl animate-pulse' />
      ))}
    </div>
  )
}

export default function FavoritesClient() {
  const [favorites, setFavorites] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { favoriteIds } = useFavorites()

  useEffect(() => {
    loadFavorites()
    
    const handleUpdate = () => {
      loadFavorites()
    }
    
    window.addEventListener('favorites-updated', handleUpdate)
    return () => window.removeEventListener('favorites-updated', handleUpdate)
  }, [favoriteIds])

  const loadFavorites = async () => {
    try {
      setIsLoading(true)
      
      if (favoriteIds.length > 0) {
        const response = await fetch(`/api/products?ids=${favoriteIds.join(',')}`)
        if (response.ok) {
          const products = await response.json()
          setFavorites(products)
        } else {
          setFavorites([])
        }
      } else {
        setFavorites([])
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
      setFavorites([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <FavoritesGridSkeleton />
  }

  if (favorites.length === 0) {
    return (
      <div className='text-center py-16'>
        <h2 className='text-2xl font-bold text-white mb-4'>No favorites yet</h2>
        <p className='text-gray-400 mb-8'>Start adding products to your favorites list!</p>
        <Link 
          href='/'
          className='inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors'
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='text-xl sm:text-2xl font-bold text-white'>
          {favorites.length} {favorites.length === 1 ? 'Favorite' : 'Favorites'}
        </h2>
      </div>
      
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'>
        {favorites.map((product: any) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </div>
  )
}


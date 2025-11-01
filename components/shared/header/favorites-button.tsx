'use client'

import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/hooks/use-favorites'

export default function FavoritesButton() {
  const [favorites, setFavorites] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { favoriteIds } = useFavorites()

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setIsLoading(true)
        
        // Get fresh favoriteIds from localStorage in case state hasn't updated yet
        const stored = localStorage.getItem('favorites')
        const currentFavoriteIds = stored ? JSON.parse(stored) : []
        
        if (currentFavoriteIds.length > 0) {
          // Fetch product details for favorites
          const response = await fetch(`/api/products?ids=${currentFavoriteIds.join(',')}`)
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
    
    loadFavorites()
    
    // Listen for storage changes to update favorites
    // Use setTimeout to defer state updates outside of render cycle
    const handleStorageChange = () => {
      setTimeout(() => {
        loadFavorites()
      }, 0)
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('favorites-updated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('favorites-updated', handleStorageChange)
    }
  }, [favoriteIds])

  const favoritesCount = favoriteIds.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="px-1 header-button relative">
          <div className="flex items-end text-xs">
            <Heart className="h-8 w-8 text-gray-300" />
            {favoritesCount > 0 && (
              <span className="absolute left-[10px] top-[-4px] bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center z-10">
                {favoritesCount >= 10 ? '9+' : favoritesCount}
              </span>
            )}
            <span className="font-bold">Favorites</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-[500px] overflow-y-auto bg-gray-900 border-gray-700"
      >
        {isLoading ? (
          <div className="p-4 text-center text-gray-400">Loading...</div>
        ) : favorites.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-400 mb-2">No favorites yet</p>
            <p className="text-sm text-gray-500">Start adding products to your favorites!</p>
          </div>
        ) : (
          <>
            <div className="p-2 border-b border-gray-700">
              <h3 className="font-semibold text-white">
                {favorites.length} {favorites.length === 1 ? 'Favorite' : 'Favorites'}
              </h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {favorites.map((product: any) => (
                <DropdownMenuItem key={product.id} asChild>
                  <Link
                    href={`/product/${product.slug}`}
                    className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer"
                  >
                    <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                      {product.images && product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <span className="text-xs text-gray-400">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">${Number(product.price).toFixed(2)}</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem asChild>
              <Link
                href="/favorites"
                className="p-3 text-center text-purple-400 hover:text-purple-300 font-medium"
              >
                View All Favorites
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


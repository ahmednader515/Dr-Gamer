'use client'

import { useState, useEffect, useCallback } from 'react'

const FAVORITES_STORAGE_KEY = 'favorites'

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  useEffect(() => {
    // Load favorites from localStorage on mount
    const loadFromStorage = () => {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setFavoriteIds(parsed)
        } catch (e) {
          console.error('Error parsing favorites from localStorage:', e)
          setFavoriteIds([])
        }
      } else {
        setFavoriteIds([])
      }
    }

    loadFromStorage()

    // Listen for favorites-updated events to sync state
    const handleUpdate = () => {
      loadFromStorage()
    }
    
    window.addEventListener('favorites-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    
    return () => {
      window.removeEventListener('favorites-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const addFavorite = useCallback((productId: string) => {
    setFavoriteIds(prev => {
      if (prev.includes(productId)) return prev
      const updated = [...prev, productId]
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated))
      // Defer event dispatch to avoid state updates during render
      setTimeout(() => {
        window.dispatchEvent(new Event('favorites-updated'))
      }, 0)
      return updated
    })
  }, [])

  const removeFavorite = useCallback((productId: string) => {
    setFavoriteIds(prev => {
      const updated = prev.filter(id => id !== productId)
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated))
      // Defer event dispatch to avoid state updates during render
      setTimeout(() => {
        window.dispatchEvent(new Event('favorites-updated'))
      }, 0)
      return updated
    })
  }, [])

  const toggleFavorite = useCallback((productId: string) => {
    setFavoriteIds(prev => {
      const isFavorited = prev.includes(productId)
      const updated = isFavorited 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated))
      // Defer event dispatch to avoid state updates during render
      setTimeout(() => {
        window.dispatchEvent(new Event('favorites-updated'))
      }, 0)
      return updated
    })
  }, [])

  const isFavorited = useCallback((productId: string) => {
    return favoriteIds.includes(productId)
  }, [favoriteIds])

  return {
    favoriteIds,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
  }
}


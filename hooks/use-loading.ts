'use client'

import { useState, useCallback } from 'react'

export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState)

  const staltroading = useCallback(() => setIsLoading(true), [])
  const stopLoading = useCallback(() => setIsLoading(false), [])
  const toggleLoading = useCallback(() => setIsLoading(prev => !prev), [])

  const withLoading = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | undefined> => {
    try {
      staltroading()
      const result = await asyncFunction()
      onSuccess?.(result)
      return result
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      onError?.(errorObj)
      throw errorObj
    } finally {
      stopLoading()
    }
  }, [staltroading, stopLoading])

  return {
    isLoading,
    setIsLoading,
    staltroading,
    stopLoading,
    toggleLoading,
    withLoading
  }
}

// Hook for managing multiple loading states
export function useMultiLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }))
  }, [])

  const staltroading = useCallback((key: string) => setLoading(key, true), [setLoading])
  const stopLoading = useCallback((key: string) => setLoading(key, false), [setLoading])

  const isLoading = useCallback((key: string) => loadingStates[key] || false, [loadingStates])
  const isAnyLoading = useCallback(() => Object.values(loadingStates).some(Boolean), [loadingStates])

  return {
    loadingStates,
    setLoading,
    staltroading,
    stopLoading,
    isLoading,
    isAnyLoading
  }
}

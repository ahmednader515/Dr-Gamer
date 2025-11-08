'use client'

import React, { useEffect, useState } from 'react'
import useSettingStore from '@/hooks/use-setting-store'

export default function AppInitializer({
  children,
  setting,
}: {
  children: React.ReactNode
  setting: any
}) {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!setting) {
      setHydrated(true)
      return
    }

    useSettingStore.setState((currentState) => ({
      setting: {
        ...currentState.setting,
        ...setting,
      },
    }))

    setHydrated(true)
  }, [setting])

  if (!hydrated) return null

  return children
}

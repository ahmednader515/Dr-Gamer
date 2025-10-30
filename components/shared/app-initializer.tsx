import React, { useEffect, useState } from 'react'
import useSettingStore from '@/hooks/use-setting-store'

export default function AppInitializer({
  children,
  setting,
}: {
  children: React.ReactNode
  setting: any
}) {
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    setRendered(true)
  }, [setting])

  if (!rendered) {
    useSettingStore.setState({
      setting,
    })
  }

  return children
}

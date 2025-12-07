'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getFilterUrl } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import React from 'react'

export default function ProductSortSelector({
  sortOrders,
  sort,
  params,
}: {
  sortOrders: { value: string; name: string }[]
  sort: string
  params: {
    q?: string
    category?: string
    price?: string
    rating?: string
    sort?: string
    page?: string
    tag?: string | string[]
  }
}) {
  const router = useRouter()
  
  // English translations
  const translations = {
    sortBy: 'Sort by'
  }
  
  return (
    <Select
      onValueChange={(v) => {
        router.push(getFilterUrl({ params, sort: v }))
      }}
      value={sort}
    >
      <SelectTrigger className="text-left bg-gray-800 border-gray-700 text-white" dir="ltr">
        <SelectValue>
          {translations.sortBy}: {sortOrders.find((s) => s.value === sort)!.name}
        </SelectValue>
      </SelectTrigger>

      <SelectContent className="text-left bg-gray-800 border-gray-700" dir="ltr">
        {sortOrders.map((s) => (
          <SelectItem key={s.value} value={s.value} className="text-white focus:bg-gray-700">
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

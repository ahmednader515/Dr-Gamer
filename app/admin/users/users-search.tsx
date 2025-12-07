'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface UsersSearchProps {
  initialSearch?: string
}

export default function UsersSearch({ initialSearch = '' }: UsersSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)
  const [isPending, startTransition] = useTransition()

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (search.trim()) {
        params.set('search', search.trim())
        params.set('page', '1') // Reset to first page on new search
      } else {
        params.delete('search')
        params.set('page', '1')
      }
      router.push(`/admin/users?${params.toString()}`)
    })
  }

  const handleClear = () => {
    setSearch('')
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('search')
      params.set('page', '1')
      router.push(`/admin/users?${params.toString()}`)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className='flex gap-2 items-center'>
      <div className='relative flex-1 max-w-md'>
        <Input
          type='text'
          placeholder='Search by email...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className='bg-gray-800 text-white border-gray-700 pr-10'
        />
        {search && (
          <Button
            variant='ghost'
            size='sm'
            className='absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-white'
            onClick={handleClear}
          >
            <X className='h-4 w-4' />
          </Button>
        )}
      </div>
      <Button
        onClick={handleSearch}
        disabled={isPending}
        className='bg-purple-600 hover:bg-purple-700 text-white'
      >
        <Search className='h-4 w-4 mr-2' />
        {isPending ? 'Searching...' : 'Search'}
      </Button>
    </div>
  )
}


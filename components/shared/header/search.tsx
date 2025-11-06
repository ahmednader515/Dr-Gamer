'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search as SearchIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function Search() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
      setQuery('')
    }
  }

  return (
    <>
      {/* Desktop Search Bar */}
      <form onSubmit={handleSubmit} className="hidden md:block">
        <div className="relative w-full md:w-80 lg:w-[550px] xl:w-[600px]">
          <Input
            type="text"
            placeholder="Search for products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 md:pl-12 pr-4 md:pr-6 py-3 md:py-4 lg:py-5 text-base md:text-lg lg:text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-500"
          />
          <SearchIcon className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-5 md:h-6 w-5 md:w-6 text-gray-500 pointer-events-none" />
        </div>
      </form>

      {/* Mobile Full-Width Search Bar */}
      <form onSubmit={handleSubmit} className="md:hidden w-full">
        <div className="relative w-full">
          <Input
            type="text"
            placeholder="Search for products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800 text-white placeholder:text-gray-400"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
      </form>
    </>
  )
}

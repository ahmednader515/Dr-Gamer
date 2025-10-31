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
        <div className="relative w-96 lg:w-[550px] xl:w-[600px]">
          <Input
            type="text"
            placeholder="ابحث عن المنتجات..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 sm:py-5 text-lg sm:text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-500"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500 pointer-events-none" />
        </div>
      </form>

      {/* Mobile Search Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="md:hidden flex items-center p-0 bg-transparent border-0 text-gray-300 hover:text-gray-100 transition-colors duration-200">
            <SearchIcon className="w-6 h-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-right text-white">البحث عن المنتجات</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="ابحث عن المنتجات..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-base border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800 text-white"
                autoFocus
              />
              <div className="absolute inset-y-0 left-2 pr-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!query.trim()}
              >
                بحث
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

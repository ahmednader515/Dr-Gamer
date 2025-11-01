import { Metadata } from 'next'
import Link from 'next/link'
import FavoritesClient from './favorites-client'

const PAGE_TITLE = 'My Favorites'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}

export default function FavoritesPage() {
  return (
    <div className='container mx-auto px-4 py-8' dir="ltr">
      <div className='mb-6'>
        <Link href='/' className='text-purple-400 hover:text-purple-300 mb-2 inline-block'>
          ← Back to Home
        </Link>
      </div>
      
      <h1 className='text-3xl sm:text-4xl font-bold text-white mb-8'>{PAGE_TITLE}</h1>
      
      <FavoritesClient />
    </div>
  )
}


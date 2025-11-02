import Link from 'next/link'

import DeleteDialog from '@/components/shared/delete-dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatId } from '@/lib/utils'
import { Metadata } from 'next'
import { deleteWebPage, getAllWebPages } from '@/lib/actions/web-page.actions'
import { IWebPageInput } from '@/types'

export const metadata: Metadata = {
  title: 'Admin Web Pages',
}

export default async function WebPageAdminPage() {
  const webPages = await getAllWebPages()
  return (
    <div className='space-y-4 ltr text-left' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className='flex-between'>
        <h1 className='h1-bold'>Web Pages</h1>
        <Button asChild variant='default'>
          <Link href='/admin/web-pages/create'>Create Web Page</Link>
        </Button>
      </div>
      
      {/* Desktop Table - Hidden on mobile */}
      <div className='hidden md:block'>
        <Table className="admin-table border border-gray-300 rounded-lg overflow-hidden shadow-lg">
          <TableHeader>
            <TableRow className="bg-gray-100 border-b-2 border-gray-300">
              <TableHead className='text-left bg-gray-100 text-gray-800 font-semibold py-4 px-4'>Name</TableHead>
              <TableHead className='text-left bg-gray-100 text-gray-800 font-semibold py-4 px-4'>Slug</TableHead>
              <TableHead className='text-left bg-gray-100 text-gray-800 font-semibold py-4 px-4'>Published</TableHead>
              <TableHead className='w-[120px] text-left bg-gray-100 text-gray-800 font-semibold py-4 px-4'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webPages.map((webPage: IWebPageInput & { id: string }) => (
              <TableRow key={webPage.id} className="bg-gray-800 hover:bg-gray-700 border-b border-gray-700">
                <TableCell className='text-left py-4 px-4 font-medium'>{webPage.title}</TableCell>
                <TableCell className='text-left py-4 px-4 text-gray-700 font-mono text-sm'>{webPage.slug}</TableCell>
                <TableCell className='text-left py-4 px-4'>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    webPage.isPublished ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {webPage.isPublished ? 'Yes' : 'No'}
                  </span>
                </TableCell>
                <TableCell className='py-4 px-4'>
                  <div className='flex flex-row gap-2 items-center'>
                    <Button asChild variant='default' size='sm' className='bg-purple-600 hover:bg-purple-700 shadow-sm border border-gray-200'>
                      <Link href={`/admin/web-pages/${webPage.id}`}>Edit</Link>
                    </Button>
                    <DeleteDialog id={webPage.id} action={deleteWebPage} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards - Visible only on mobile */}
      <div className='md:hidden space-y-4'>
        {webPages.map((webPage: IWebPageInput & { id: string }) => (
          <div key={webPage.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
            {/* Web Page Header */}
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-900">{webPage.title}</div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                webPage.isPublished ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {webPage.isPublished ? 'Published' : 'Unpublished'}
              </span>
            </div>

            {/* Web Page Slug */}
            <div className="border-t border-gray-100 pt-3">
              <div className="text-sm text-gray-600 mb-1">Slug:</div>
              <div className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded">
                {webPage.slug}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 pt-3 flex gap-2">
              <Button asChild size='sm' className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Link href={`/admin/web-pages/${webPage.id}`}>
                  Edit
                </Link>
              </Button>
              <DeleteDialog id={webPage.id} action={deleteWebPage} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

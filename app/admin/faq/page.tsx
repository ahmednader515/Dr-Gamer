import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getAllFAQCategories } from '@/lib/actions/faq.actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import DeleteDialog from '@/components/shared/delete-dialog'
import { deleteFAQCategory } from '@/lib/actions/faq.actions'

export const metadata: Metadata = {
  title: 'Admin FAQ',
}

export default async function FAQAdminPage() {
  const categories = await getAllFAQCategories()

  return (
    <div className='space-y-4 rtl text-right' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className='flex-between'>
        <h1 className='h1-bold'>إدارة الأسئلة الشائعة</h1>
        <div className="flex gap-2">
          <Button asChild variant='default'>
            <Link href='/admin/faq/categories/create'>إضافة فئة</Link>
          </Button>
          <Button asChild variant='outline'>
            <Link href='/faq'>عرض الصفحة</Link>
          </Button>
        </div>
      </div>
      
      {/* Desktop Table - Hidden on mobile */}
      <div className='hidden md:block'>
        <Table className="admin-table border border-gray-300 rounded-lg overflow-hidden shadow-lg">
          <TableHeader>
            <TableRow className="bg-gray-100 border-b-2 border-gray-300">
              <TableHead className='text-right bg-gray-100 text-gray-800 font-semibold py-4 px-4'>الفئة</TableHead>
              <TableHead className='text-right bg-gray-100 text-gray-800 font-semibold py-4 px-4'>عدد الأسئلة</TableHead>
              <TableHead className='text-right bg-gray-100 text-gray-800 font-semibold py-4 px-4'>حالة</TableHead>
              <TableHead className='w-[200px] text-right bg-gray-100 text-gray-800 font-semibold py-4 px-4'>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category: any) => (
              <TableRow key={category.id} className="hover:bg-gray-50 border-b border-gray-200">
                <TableCell className='text-right py-4 px-4 font-medium'>{category.title}</TableCell>
                <TableCell className='text-right py-4 px-4'>{category.questions?.length || 0}</TableCell>
                <TableCell className='text-right py-4 px-4'>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    category.isActive ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.isActive ? 'نشط' : 'معطل'}
                  </span>
                </TableCell>
                <TableCell className='py-4 px-4'>
                  <div className='flex flex-row gap-2 items-center'>
                    <Button asChild variant='default' size='sm' className='bg-purple-600 hover:bg-purple-700'>
                      <Link href={`/admin/faq/categories/${category.id}`}>تعديل</Link>
                    </Button>
                    <DeleteDialog id={category.id} action={deleteFAQCategory} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards - Visible only on mobile */}
      <div className='md:hidden space-y-4'>
        {categories.map((category: any) => (
          <div key={category.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-900">{category.title}</div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                category.isActive ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {category.isActive ? 'نشط' : 'معطل'}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="text-sm text-gray-600 mb-1">عدد الأسئلة: {category.questions?.length || 0}</div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex gap-2">
              <Button asChild size='sm' className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Link href={`/admin/faq/categories/${category.id}`}>
                  تعديل
                </Link>
              </Button>
              <DeleteDialog id={category.id} action={deleteFAQCategory} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


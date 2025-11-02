import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getFAQCategoryById } from '@/lib/actions/faq.actions'
import Link from 'next/link'
import FAQCategoryForm from '../../faq-category-form'

export const metadata: Metadata = {
  title: 'Edit FAQ Category',
}

type UpdateFAQCategoryProps = {
  params: Promise<{
    id: string
  }>
}

const UpdateFAQCategory = async (props: UpdateFAQCategoryProps) => {
  const params = await props.params
  const { id } = params

  const category = await getFAQCategoryById(id)
  if (!category) notFound()
  
  return (
    <main className='max-w-6xl mx-auto p-4'>
      <div className='space-y-4 ltr text-left' style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div className='flex mb-4'>
          <Link href='/admin/faq'>FAQ</Link>
          <span className='mx-1'>›</span>
          <Link href={`/admin/faq/categories/${category.id}`}>{category.title}</Link>
        </div>

        <h1 className='h1-bold'>Edit FAQ Category</h1>

        <div className='my-8'>
          <FAQCategoryForm type='Update' category={category} categoryId={category.id} />
        </div>
      </div>
    </main>
  )
}

export default UpdateFAQCategory


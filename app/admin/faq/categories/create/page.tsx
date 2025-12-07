import { Metadata } from 'next'
import FAQCategoryForm from '../../faq-category-form'

export const metadata: Metadata = {
  title: 'Create FAQ Category',
}

export default function CreateFAQCategoryPage() {
  return (
    <div className='space-y-4 ltr text-left' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <h1 className='h1-bold'>Create FAQ Category</h1>

      <div className='my-8'>
        <FAQCategoryForm type='Create' />
      </div>
    </div>
  )
}


import { Metadata } from 'next'
import FAQCategoryForm from '../../faq-category-form'

export const metadata: Metadata = {
  title: 'إنشاء فئة أسئلة شائعة',
}

export default function CreateFAQCategoryPage() {
  return (
    <div className='space-y-4 rtl text-right' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <h1 className='h1-bold'>إنشاء فئة أسئلة شائعة</h1>

      <div className='my-8'>
        <FAQCategoryForm type='Create' />
      </div>
    </div>
  )
}


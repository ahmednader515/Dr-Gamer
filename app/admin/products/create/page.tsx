import Link from 'next/link'
import ProductForm from '../product-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Product',
}

const CreateProductPage = () => {
  return (
    <main className='max-w-6xl mx-auto p-4 ltr' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className='flex mb-4 text-left'>
        <Link href='/admin/products' className='text-purple-600 hover:text-purple-800'>Products</Link>
        <span className='mx-1'>›</span>
        <Link href='/admin/products/create' className='text-gray-600'>Create</Link>
      </div>

      <div className='my-8'>
        <ProductForm type='Create' />
      </div>
    </main>
  )
}

export default CreateProductPage

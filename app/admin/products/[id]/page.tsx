import { notFound } from 'next/navigation'

import { getProductById } from '@/lib/actions/product.actions'
import Link from 'next/link'
import ProductForm from '../product-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Product',
}

type UpdateProductProps = {
  params: Promise<{
    id: string
  }>
}

const UpdateProduct = async (props: UpdateProductProps) => {
  const params = await props.params

  const { id } = params

  const product = await getProductById(id)
  if (!product) notFound()
  
  // Parse variations if they're stored as JSON string
  let parsedProduct = { ...product }
  if (product.variations) {
    try {
      parsedProduct.variations = typeof product.variations === 'string' 
        ? JSON.parse(product.variations)
        : product.variations
    } catch (e) {
      console.error('Error parsing variations:', e)
      parsedProduct.variations = []
    }
  }
  
  return (
    <main className='max-w-6xl mx-auto p-4 ltr' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className='flex mb-4 text-left'>
        <Link href='/admin/products'>Products</Link>
        <span className='mx-1'>›</span>
        <Link href={`/admin/products/${parsedProduct.id}`}>{parsedProduct.id}</Link>
      </div>

      <div className='my-8'>
        <ProductForm type='Update' product={parsedProduct} productId={parsedProduct.id} />
      </div>
    </main>
  )
}

export default UpdateProduct

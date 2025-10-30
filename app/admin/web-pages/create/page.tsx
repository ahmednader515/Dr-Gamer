import { Metadata } from 'next'
import WebPageForm from '../web-page-form'

export const metadata: Metadata = {
  title: 'إنشاء صفحة ويب',
}

export default function CreateWebPagePage() {
  return (
    <div className='space-y-4 rtl text-right' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <h1 className='h1-bold'>إنشاء صفحة ويب</h1>

      <div className='my-8'>
        <WebPageForm type='Create' />
      </div>
    </div>
  )
}

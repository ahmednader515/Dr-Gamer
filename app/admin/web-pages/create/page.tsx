import { Metadata } from 'next'
import WebPageForm from '../web-page-form'

export const metadata: Metadata = {
  title: 'Create Web Page',
}

export default function CreateWebPagePage() {
  return (
    <div className='space-y-4 ltr text-left' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <h1 className='h1-bold'>Create Web Page</h1>

      <div className='my-8'>
        <WebPageForm type='Create' />
      </div>
    </div>
  )
}

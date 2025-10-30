import { notFound } from 'next/navigation'
import { Metadata } from 'next'

import { getWebPageById } from '@/lib/actions/web-page.actions'
import Link from 'next/link'
import WebPageForm from '../web-page-form'

export const metadata: Metadata = {
  title: 'تعديل صفحة الويب',
}

type UpdateWebPageProps = {
  params: Promise<{
    id: string
  }>
}

const UpdateWebPage = async (props: UpdateWebPageProps) => {
  const params = await props.params

  const { id } = params

  const webPage = await getWebPageById(id)
  if (!webPage) notFound()
  return (
    <main className='max-w-6xl mx-auto p-4'>
      <div className='space-y-4 rtl text-right' style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div className='flex mb-4'>
          <Link href='/admin/web-pages'>صفحات الويب</Link>
          <span className='mx-1'>›</span>
          <Link href={`/admin/web-pages/${webPage.id}`}>{webPage.title}</Link>
        </div>

        <h1 className='h1-bold'>تعديل صفحة الويب</h1>

        <div className='my-8'>
          <WebPageForm type='Update' webPage={webPage} webPageId={webPage.id} />
        </div>
      </div>
    </main>
  )
}

export default UpdateWebPage

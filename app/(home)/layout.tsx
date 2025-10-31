import Header from '@/components/shared/header'
import Footer from '@/components/shared/footer'
import WhatsAppButton from '@/components/shared/whatsapp-button'

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col min-h-screen font-cairo' dir="rtl">
      <Header />
      <main className='flex-1 flex flex-col pt-24 md:pt-36'>{children}</main>
      <Footer />
    </div>
  )
}

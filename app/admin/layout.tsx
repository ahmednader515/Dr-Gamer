import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AdminNav from './admin-nav'
import Footer from '@/components/shared/footer'
import data from '@/lib/data'
import DesktopNav from './desktop-nav'

const allNavigation = [
  { name: 'نظرة عامة', href: '/admin/overview', roles: ['Admin'] },
  { name: 'المنتجات', href: '/admin/products', roles: ['Admin', 'Moderator'] },
  { name: 'الطلبات', href: '/admin/orders', roles: ['Admin'] },
  { name: 'المستخدمون', href: '/admin/users', roles: ['Admin'] },
  { name: 'أكواد الخصم', href: '/admin/promo-codes', roles: ['Admin'] },
  { name: 'صفحات الويب', href: '/admin/web-pages', roles: ['Admin', 'Moderator'] },
  { name: 'الأسئلة الشائعة', href: '/admin/faq', roles: ['Admin', 'Moderator'] },
  { name: 'الإعدادات', href: '/admin/settings', roles: ['Admin', 'Moderator'] },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const userRole = session?.user.role
  
  // Allow both Admin and Moderator
  if (userRole !== 'Admin' && userRole !== 'Moderator') redirect('/')
  
  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => 
    item.roles.includes(userRole as string)
  )
  
  const { site } = data.settings[0];
  
  return (
    <>
      <div className='flex flex-col min-h-screen rtl admin-container' style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div className='bg-black text-white relative'>
          <div className='flex items-center justify-between h-16 px-4 py-2'>
            {/* Menu button on the left - visible only on mobile */}
            <div className='md:hidden'>
              <AdminNav userRole={userRole as string} />
            </div>
            
            {/* Desktop Navigation Links - hidden on mobile */}
            <DesktopNav navigation={navigation} />
            
            {/* Logo on the right */}
            <Link href='/' className='flex items-center'>
              <Image
                src='/icons/logo.png'
                width={48}
                height={48}
                alt={`${site.name} logo`}
                className='w-10 h-10 sm:w-12 sm:h-12'
              />
            </Link>
          </div>
        </div>
        <main className='flex-1 p-3 sm:p-4 lg:p-6 rtl admin-container' style={{ fontFamily: 'Cairo, sans-serif' }}>{children}</main>
        <Footer />
      </div>
    </>
  )
}

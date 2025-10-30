import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CategoryManagement from './category-management'
import SettingsTabsContent from './settings-tabs-content'
import { getSetting } from '@/lib/actions/setting.actions'

export const metadata: Metadata = {
  title: 'إعدادات الموقع - لوحة الإدارة',
}

export default async function SettingsPage() {
  const session = await auth()
  // Allow both Admin and Moderator
  if (session?.user.role !== 'Admin' && session?.user.role !== 'Moderator') redirect('/')

  const setting = await getSetting()

  return (
    <div className='space-y-6 rtl text-right' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div>
        <h1 className='text-3xl font-bold mb-2'>إعدادات الموقع</h1>
        <p className='text-muted-foreground'>
          قم بإدارة إعدادات الموقع والفئات والمنتجات
        </p>
      </div>
      
      <Tabs defaultValue="carousel" className="w-full" dir="rtl">
        <div className="mb-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 h-auto">
            <TabsTrigger value="carousel" className="flex items-center gap-1 text-xs sm:text-sm px-2 py-3 whitespace-nowrap">
              <span className="hidden sm:inline">الكاروسيل</span>
              <span className="sm:hidden">كاروسيل</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1 text-xs sm:text-sm px-2 py-3 whitespace-nowrap">
              <span className="hidden sm:inline">إدارة الفئات</span>
              <span className="sm:hidden">فئات</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-1 text-xs sm:text-sm px-2 py-3 whitespace-nowrap">
              <span className="hidden sm:inline">التوصيل</span>
              <span className="sm:hidden">توصيل</span>
            </TabsTrigger>
            <TabsTrigger value="tax" className="flex items-center gap-1 text-xs sm:text-sm px-2 py-3 whitespace-nowrap">
              <span className="hidden sm:inline">الضرائب</span>
              <span className="sm:hidden">ضرائب</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-1 text-xs sm:text-sm px-2 py-3 whitespace-nowrap">
              <span className="hidden sm:inline">التسعير</span>
              <span className="sm:hidden">سعر</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="carousel" className="space-y-6">
          <SettingsTabsContent setting={setting} tab="carousel" />
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-6">
          <CategoryManagement />
        </TabsContent>
        
        <TabsContent value="delivery" className="space-y-6">
          <SettingsTabsContent setting={setting} tab="delivery" />
        </TabsContent>
        
        <TabsContent value="tax" className="space-y-6">
          <SettingsTabsContent setting={setting} tab="tax" />
        </TabsContent>
        
        <TabsContent value="pricing" className="space-y-6">
          <SettingsTabsContent setting={setting} tab="pricing" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

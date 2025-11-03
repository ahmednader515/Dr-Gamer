import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CategoryManagement from './category-management'
import SettingsTabsContent from './settings-tabs-content'
import { getSetting } from '@/lib/actions/setting.actions'

export const metadata: Metadata = {
  title: 'Site Settings - Admin Panel',
}

export default async function SettingsPage() {
  const session = await auth()
  // Allow both Admin and Moderator
  if (session?.user.role !== 'Admin' && session?.user.role !== 'Moderator') redirect('/')

  const setting = await getSetting()

  return (
    <div className='space-y-6 ltr text-left' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div>
        <h1 className='text-3xl font-bold mb-2'>Site Settings</h1>
        <p className='text-muted-foreground'>
          Manage site settings, categories and products
        </p>
      </div>
      
      <Tabs defaultValue="carousel" className="w-full" dir="ltr">
        <div className="mb-6">
          <TabsList className="grid w-full grid-cols-2 gap-1 h-auto">
            <TabsTrigger value="carousel" className="flex items-center gap-1 text-xs sm:text-sm px-2 py-3 whitespace-nowrap">
              <span className="hidden sm:inline">Carousel</span>
              <span className="sm:hidden">Carousel</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1 text-xs sm:text-sm px-2 py-3 whitespace-nowrap">
              <span className="hidden sm:inline">Manage Categories</span>
              <span className="sm:hidden">Categories</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="carousel" className="space-y-6">
          <SettingsTabsContent setting={setting} tab="carousel" />
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-6">
          <CategoryManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

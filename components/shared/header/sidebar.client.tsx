'use client'
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Menu, ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import { SignOut } from "@/lib/actions/user.actions";

const categoryTranslations: { [key: string]: string } = {
  'Pain Relief': 'تسكين الآلام',
  'Vitamins & Supplements': 'فيتامينات ومكملات غذائية',
  'Allergy & Sinus': 'الحساسية والجيوب الأنفية',
  'Digestive Health': 'صحة الجهاز الهضمي',
  'Cold & Flu': 'نزلات البرد والإنفلونزا',
  'Prescription Medications': 'الأدوية الموصوفة',
  'Over-the-Counter': 'الأدوية المتاحة بدون وصفة',
  'Personal Care': 'العناية الشخصية',
  'Health & Wellness': 'الصحة والعافية',
  'First Aid': 'الإسعافات الأولية',
  'Baby Care': 'العناية بالطفل',
  'Elderly Care': 'العناية بالمسنين',
  'Diabetes Care': 'العناية بمرضى السكري',
  'Heart Health': 'صحة القلب',
  'Mental Health': 'الصحة النفسية',
  "Women's Health": 'صحة المرأة',
  "Men's Health": 'صحة الرجل',
  'Skin Care': 'العناية بالبشرة',
  'Hair Care': 'العناية بالشعر',
  'Oral Care': 'العناية بالفم والأسنان'
};

export default function SidebarClient({ 
  categories,
  session
}: { 
  categories: string[]
  session: { name: string; role?: string } | null
}) {
  const handleSignOut = async () => {
    try {
      await SignOut()
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
      window.location.reload()
    }
  }

  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 transition-all duration-200 hover:scale-105 shadow-sm">
          <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="!mt-0 !top-0 w-full max-w-sm !h-screen left-0 right-auto bg-gray-900 border-0 border-r rounded-none">
        <div className="flex flex-col h-full bg-gray-900 text-white">
          {/* Header with Title and Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <DrawerTitle className="text-lg font-semibold text-left">
              Menu
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-gray-800">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </div>
          
          {/* Categories Section */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-left mb-4">
                Categories
              </h2>
            </div>
            <nav className="flex flex-col space-y-2">
              {categories.map((category) => (
                <DrawerClose asChild key={category}>
                  <Link
                    href={`/search?category=${category}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="text-left flex-1">{categoryTranslations[category] || category}</span>
                  </Link>
                </DrawerClose>
              ))}
            </nav>
          </div>

          {/* Sign Out Button and Admin/Moderator Link - Bottom (sticky for mobile visibility) */}
          {session && (
            <div className="p-4 border-t border-gray-700 sticky bottom-0 bg-gray-900 space-y-2">
              {/* Admin/Moderator Panel Link */}
              {(session.role === 'Admin' || session.role === 'Moderator') && (
                <DrawerClose asChild>
                  <Link
                    href={session.role === 'Admin' ? '/admin/overview' : '/admin/products'}
                    className="w-full block"
                  >
                    <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 font-medium">
                      {session.role === 'Admin' ? 'Admin Panel' : 'Moderator Panel'}
                    </Button>
                  </Link>
                </DrawerClose>
              )}
              
              {/* Sign Out Button */}
              <Button
                className="w-full bg-purple-600 text-white hover:bg-purple-700 font-medium"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}



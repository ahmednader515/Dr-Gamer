import Image from "next/image";
import Link from "next/link";
import { getAllCategories } from "@/lib/actions/product.actions";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Search from "./search";
import Menu from "./menu";
import Sidebar from "./sidebar";
import data from "@/lib/data";
import { ShoppingCart, User, Package, Home, Shield, Tag } from "lucide-react";
import MobileCartCount from './mobile-cart-count'

// Arabic translations for categories
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
  'Women\'s Health': 'صحة المرأة',
  'Men\'s Health': 'صحة الرجل',
  'Skin Care': 'العناية بالبشرة',
  'Hair Care': 'العناية بالشعر',
  'Oral Care': 'العناية بالفم والأسنان'
};

export default async function Header() {
  // Get categories from the new category table
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });
  
  const { site } = data.settings[0];
  const session = await auth();
  
  // Ensure categories is an array of strings
  const categoryList = categories.map(cat => cat.name);
  
  return (
    <header className="bg-gray-900 text-gray-100 font-cairo" dir="rtl">
      {/* Main Header - Clean Design */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="container mx-auto px-4 pt-2 pb-2">
          {/* Header Row */}
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Left Side - Hamburger Menu on mobile, Logo on desktop */}
            <div className="flex items-center justify-start">
              <div className="block md:hidden">
                <Sidebar />
              </div>
              <div className="hidden md:block">
                <Link
                  href="/"
                  className="flex items-center"
                >
                  <Image
                    src={site.logo}
                    width={80}
                    height={80}
                    alt={`${site.name} logo`}
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                  />
                </Link>
              </div>
            </div>
            
            {/* Center - Search Component */}
            <div className="flex items-center justify-center">
              <Search />
            </div>
            
            {/* Right Side - Mobile menu on mobile, Desktop menu on desktop */}
            <div className="flex items-center justify-end">
              <div className="block md:hidden">
                {/* Mobile: Show hamburger menu on right side too */}
                <div className="w-6"></div>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <Menu />
              </div>
            </div>
          </div>
          
          {/* Mobile Navigation Icons Row - Simplified */}
          <div className="flex items-center justify-center gap-6 sm:gap-8 mt-4 md:hidden">
            {/* Logo - Mobile */}
            <Link href="/" className="flex items-center">
              <Image
                src={site.logo}
                width={60}
                height={60}
                alt={`${site.name} logo`}
                className="w-8 h-8"
              />
            </Link>
            
            {/* Homepage Button */}
            <Link href="/" className="flex flex-col items-center gap-1">
              <Home className="w-6 h-6 text-gray-300" />
              <span className="text-xs text-gray-300">الرئيسية</span>
            </Link>
            
            {/* Shopping Cart */}
            <Link href="/cart" className="flex flex-col items-center gap-1">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-gray-300" />
                <MobileCartCount />
              </div>
              <span className="text-xs text-gray-300">السلة</span>
            </Link>
            
            {/* User Actions */}
            {session ? (
              <>
                {/* Account Button */}
                <Link href="/account" className="flex flex-col items-center gap-1">
                  <User className="w-6 h-6 text-gray-300" />
                  <span className="text-xs text-gray-300">حسابي</span>
                </Link>
                
                {/* Orders Button */}
                <Link href="/account/orders" className="flex flex-col items-center gap-1">
                  <Package className="w-6 h-6 text-gray-300" />
                  <span className="text-xs text-gray-300">طلباتي</span>
                </Link>
                
                {/* Admin/Moderator Button - Show for Admin and Moderator users */}
                {(session.user.role === 'Admin' || session.user.role === 'Moderator') && (
                  <Link 
                    href={session.user.role === 'Admin' ? '/admin/overview' : '/admin/products'} 
                    className="flex flex-col items-center gap-1"
                  >
                    <Shield className="w-6 h-6 text-purple-500" />
                    <span className="text-xs text-purple-500 font-medium">
                      {session.user.role === 'Admin' ? 'الإدارة' : 'لوحة المشرف'}
                    </span>
                  </Link>
                )}
              </>
            ) : (
              /* Sign In Button */
              <Link href="/sign-in" className="flex flex-col items-center gap-1">
                <User className="w-6 h-6 text-gray-300" />
                <span className="text-xs text-gray-300">تسجيل الدخول</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Categories Section - Hidden on mobile, shown on desktop */}
      <div className="hidden md:block bg-[#111827] text-white border-b border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center flex-wrap gap-2 lg:gap-4">
              {/* Offers Button */}
              <Link
                href="/#offers"
                className="px-3 lg:px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors duration-200 whitespace-nowrap"
              >
                العروض
              </Link>
              
              {/* Home Page Link */}
              <Link
                href="/"
                className="px-3 lg:px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors duration-200 whitespace-nowrap"
              >
                الصفحة الرئيسية
              </Link>
              
              {/* Category Links */}
              {categoryList.slice(0, 7).map((category) => (
                <Link
                  href={`/search?category=${category}`}
                  key={category}
                  className="px-3 lg:px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                >
                  {categoryTranslations[category] || category}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

import Image from "next/image";
import Link from "next/link";
import { getAllCategories } from "@/lib/actions/product.actions";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Search from "./search";
import Menu from "./menu";
import Sidebar from "./sidebar";
import data from "@/lib/data";
import { ShoppingCart, User, Package, Shield, Tag } from "lucide-react";
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-gray-100 font-cairo" dir="ltr">
      {/* Main Header - Clean Design */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="container mx-auto px-4 pt-2 pb-3">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Side - Menu on desktop, Menu + Logo + DR.Gamer on mobile */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Mobile: Menu button + Logo + DR.Gamer */}
              <div className="flex items-center gap-2 sm:gap-3 md:hidden">
                <Sidebar />
                <Link href="/" className="flex items-center">
                  <Image
                    src={site.logo}
                    width={120}
                    height={120}
                    alt={`${site.name} logo`}
                    className="w-20 h-20 sm:w-24 sm:h-24"
                  />
                </Link>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xl sm:text-2xl">
                    <span className="text-white">DR.</span>
                    <span className="text-purple-400">Gamer</span>
                  </span>
                  <span className="text-xs sm:text-sm">
                    by <span className="text-blue-400">Mina</span> & <span className="text-green-400">Hamaki</span>
                  </span>
                </div>
              </div>
              
              {/* Desktop: Menu */}
              <div className="hidden md:block">
                <Menu />
              </div>
            </div>
            
            {/* Center - Search on desktop */}
            <div className="hidden md:flex items-center justify-center flex-1">
              <Search />
            </div>
            
            {/* Right Side - Logo + DR.Gamer on desktop, Navigation Icons on mobile */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Desktop: Logo + DR.Gamer */}
              <div className="hidden md:flex items-center gap-3">
                <Link href="/" className="flex items-center gap-3">
                  <Image
                    src={site.logo}
                    width={80}
                    height={80}
                    alt={`${site.name} logo`}
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                  />
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-xl lg:text-2xl">
                      <span className="text-white">DR.</span>
                      <span className="text-purple-400">Gamer</span>
                    </span>
                    <span className="text-xs sm:text-sm">
                      by <span className="text-blue-400">Mina</span> & <span className="text-green-400">Hamaki</span>
                    </span>
                  </div>
                </Link>
              </div>
              
              {/* Mobile Navigation Links - All on one line */}
              <div className="flex items-center gap-4 sm:gap-5 md:hidden">
                {/* Shopping Cart */}
                <Link href="/cart" className="flex items-center">
                  <div className="relative">
                    <ShoppingCart className="w-6 h-6 text-gray-300" />
                    <MobileCartCount />
                  </div>
                </Link>
                
                {/* User Actions */}
                {session ? (
                  <>
                    {/* Orders Button */}
                    <Link href="/account/orders" className="flex items-center">
                      <Package className="w-6 h-6 text-gray-300" />
                    </Link>
                    
                    {/* Search Icon */}
                    <div className="flex items-center">
                      <Search />
                    </div>
                    
                    {/* Admin/Moderator Button - Show for Admin and Moderator users */}
                    {(session.user.role === 'Admin' || session.user.role === 'Moderator') && (
                      <Link 
                        href={session.user.role === 'Admin' ? '/admin/overview' : '/admin/products'} 
                        className="flex items-center"
                      >
                        <Shield className="w-6 h-6 text-purple-500" />
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    {/* Search Icon - For non-logged in users */}
                    <div className="flex items-center">
                      <Search />
                    </div>
                    {/* Sign In Button */}
                    <Link href="/sign-in" className="flex items-center">
                      <User className="w-6 h-6 text-gray-300" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section - Hidden on mobile, shown on desktop */}
      <div className="hidden md:block bg-[#111827] text-white border-b border-gray-700">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center flex-wrap gap-2 lg:gap-4">
              {/* Offers Button */}
              <Link
                href="/#offers"
                className="px-3 lg:px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors duration-200 whitespace-nowrap"
              >
                Offers
              </Link>
              
              {/* Home Page Link */}
              <Link
                href="/"
                className="px-3 lg:px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors duration-200 whitespace-nowrap"
              >
                Homepage
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

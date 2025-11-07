import React from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import data from '@/lib/data'
import { prisma } from '@/lib/prisma'

export default async function Footer() {
  const { site } = data.settings[0];

  // Fetch published web pages from database
  const webPages = await prisma.webPage.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
    }
  })

  // Group pages by category for better organization
  const customerServicePages = webPages.filter(page => 
    ['contact-us', 'help', 'support'].some(keyword => page.slug.includes(keyword))
  )
  
  const legalPages = webPages.filter(page => 
    ['privacy', 'terms', 'conditions', 'policy'].some(keyword => page.slug.includes(keyword))
  )
  
  const otherPages = webPages.filter(page => 
    !customerServicePages.find(p => p.id === page.id) && 
    !legalPages.find(p => p.id === page.id)
  )

  return (
    <footer className="bg-gray-800 text-white border-t font-cairo" dir="ltr">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-left">About Us</h3>
            <p className="text-xs sm:text-sm text-gray-300 text-left">
              {site.description}
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-left">Quick Links</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-left">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Homepage
                </Link>
              </li>
              <li>
                <Link href="/search?category=all" className="text-gray-300 hover:text-white transition-colors duration-200">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors duration-200">
                  FAQ
                </Link>
              </li>
              {/* Dynamic other pages */}
              {otherPages.slice(0, 3).map(page => (
                <li key={page.id}>
                  <Link href={`/page/${page.slug}`} className="text-gray-300 hover:text-white transition-colors duration-200">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-left">Customer Service</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-left">
              {/* Dynamic customer service pages */}
              {customerServicePages.map(page => (
                <li key={page.id}>
                  <Link href={`/page/${page.slug}`} className="text-gray-300 hover:text-white transition-colors duration-200">
                    {page.title}
                  </Link>
                </li>
              ))}
              {/* Fallback if no customer service pages */}
              {customerServicePages.length === 0 && (
                <>
                  <li>
                    <Link href="/page/contact-us" className="text-gray-300 hover:text-white transition-colors duration-200">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/page/help" className="text-gray-300 hover:text-white transition-colors duration-200">
                      Help
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors duration-200">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-left">Legal</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-left">
              {/* Dynamic legal pages */}
              {legalPages.map(page => (
                <li key={page.id}>
                  <Link href={`/page/${page.slug}`} className="text-gray-300 hover:text-white transition-colors duration-200">
                    {page.title}
                  </Link>
                </li>
              ))}
              {/* Fallback if no legal pages */}
              {legalPages.length === 0 && (
                <>
                  <li>
                    <Link href="/page/privacy-policy" className="text-gray-300 hover:text-white transition-colors duration-200">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/page/terms-of-use" className="text-gray-300 hover:text-white transition-colors duration-200">
                      Terms of Service
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <Separator className="my-6 sm:my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 text-xs sm:text-sm text-gray-300">
          <p className="text-center sm:text-left">&copy; {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p className="text-center sm:text-right">Powered by Next.js</p>
        </div>
      </div>
    </footer>
  );
}

import { Metadata } from 'next'
import Link from 'next/link'
import FAQItem from '@/components/shared/faq/faq-item'
import { getAllFAQs } from '@/lib/actions/faq.actions'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions - Xbox Store',
  description: 'Find answers to the most frequently asked questions about Xbox Store, orders, delivery, payment, and more',
}

export default async function FAQPage() {
  const faqData = await getAllFAQs()
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" dir="ltr">
      {/* Breadcrumb */}
      <div className="flex gap-2 text-sm mb-6">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          Home
        </Link>
        <span className="text-gray-400">›</span>
        <span className="text-white">FAQ</span>
      </div>

      {/* Page Header */}
      <div className="mb-12">
        <h1 className="h1-bold text-white mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-300 text-lg">
          Have a question? Find an answer from the most frequently asked questions below
        </p>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-8">
        {faqData.map((category: any) => (
          <div key={category.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">{category.title}</h2>
            </div>
            <div className="divide-y divide-gray-700">
              {category.questions?.map((faq: any, index: number) => (
                <FAQItem
                  key={faq.id || index}
                  question={faq.question}
                  answer={faq.answer}
                  isLast={index === (category.questions?.length || 0) - 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <div className="mt-12 p-8 bg-gradient-to-r from-purple-600/20 to-purple-700/20 border border-purple-500/30 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-4">Didn't find your answer?</h2>
        <p className="text-gray-300 mb-6">
          If you have any other questions we haven't covered here, don't hesitate to contact us. We're here to help!
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/page/contact-us"
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Contact Us
          </Link>
          <Link
            href="/page/help"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-semibold rounded-lg transition-colors"
          >
            Help Center
          </Link>
        </div>
      </div>
    </div>
  )
}


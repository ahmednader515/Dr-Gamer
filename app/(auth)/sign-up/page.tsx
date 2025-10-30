import { Metadata } from 'next'
import Image from 'next/image'
import SignupForm from './signup-form'
import data from '@/lib/data'

export const metadata: Metadata = {
  title: 'إنشاء حساب جديد',
}

export default function SignUpPage() {
  const { site } = data.settings[0];
  
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-900 signin-page-rtl" dir="rtl">
      <div className="w-full max-w-[1800px] mx-auto p-4 sm:p-6 md:p-8">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-16 lg:gap-32 items-center">
          {/* Logo Section - Right Side */}
          <div className="flex flex-col items-center justify-center space-y-6 md:space-y-8 lg:space-y-10 text-center logo-section order-2 lg:order-1">
            <div className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 relative">
              <Image
                src="/icons/logo.png"
                alt="شعار المتجر"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="space-y-4 md:space-y-6 lg:space-y-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white font-cairo">انضم إلى {site.name}</h1>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 font-cairo">أنشئ حسابك واستمتع بالتسوق</p>
            </div>
          </div>

          {/* Form Section - Left Side */}
          <div className="flex justify-center form-section order-1 lg:order-2">
            <div className="w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl">
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-right font-cairo mb-2 md:mb-3 text-white">إنشاء حساب جديد</h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-300 text-right font-cairo">أدخل بياناتك لإنشاء حساب جديد</p>
              </div>
              <SignupForm />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 md:mt-12 lg:mt-16 text-center">
          <div className="text-gray-300 mb-4 md:mb-6 font-cairo text-base md:text-lg">
            لديك حساب بالفعل؟
          </div>
          <a href="/sign-in" className="inline-block">
            <button className="w-full max-w-sm md:max-w-lg font-cairo text-base md:text-lg h-10 md:h-12 bg-green-600 border-2 border-green-600 text-white hover:bg-green-700 rounded-lg transition-colors">
              تسجيل الدخول
            </button>
          </a>
        </div>
      </div>
    </div>
  )
}

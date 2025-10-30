'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'

import { useToast } from '@/hooks/use-toast'
import { createOrder } from '@/lib/actions/order.actions'
import { useLoading } from '@/hooks/use-loading'
import LoadingOverlay from '@/components/shared/loading-overlay'

import { zodResolver } from '@hookform/resolvers/zod'

import { useRouter } from 'next/navigation'
import { useState, useEffect, memo } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import CheckoutFooter from './checkout-footer'

import Link from 'next/link'
import useCartStore from '@/hooks/use-cart-store'
import ProductPrice from '@/components/shared/product/product-price'
import data from '@/lib/data'
import PromoCodeInput from './promo-code-input'
import { z } from 'zod'
import { UploadButton } from '@/lib/uploadthing'

const ContactInfoSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
})

type ContactInfoFormData = z.infer<typeof ContactInfoSchema>

const PaymentDetailsSchema = z.object({
  paymentNumber: z.string().min(1, 'رقم الدفع مطلوب'),
  transactionImage: z.string().min(1, 'صورة المعاملة مطلوبة'),
})

type PaymentDetailsFormData = z.infer<typeof PaymentDetailsSchema>

// Payment method details
const PAYMENT_INFO = {
  'فودافون كاش': {
    number: '01277910038',
    label: 'رقم فودافون كاش',
    icon: '📱',
  },
  'إنستا باي': {
    number: 'mina.shk',
    label: 'اسم المستخدم إنستا باي',
    icon: '💳',
    userName: 'mina.shk@instapay',
    link: 'https://ipn.eg/S/mina.shk/instapay/2nU1nh',
  },
  'تيلدا': {
    number: '@minahakim3',
    label: 'اسم المستخدم تيلدا',
    icon: '🟢',
    instagram: '@minahakim3',
  },
  'حساب بنكي': {
    number: '5110333000001242',
    label: 'رقم الحساب البنكي',
    icon: '🏦',
    accountHolder: 'مينا سمير حكيم',
    iban: 'EG060002051105110333000001242',
    swift: 'BMISEGCXXXX',
  },
}

export default function CheckoutForm() {
  const { site, availablePaymentMethods, defaultPaymentMethod } = data.settings[0];
  const { toast } = useToast()
  const router = useRouter()
  const { isLoading: isPlacingOrder, withLoading } = useLoading()

  const {
    cart: {
      itemsPrice,
      items,
      shippingPrice,
      taxPrice,
      totalPrice,
      paymentMethod = defaultPaymentMethod,
      customerEmail,
      customerPhone,
      paymentNumber,
      transactionImage,
    },
    setCustomerEmail,
    setCustomerPhone,
    setPaymentMethod,
    setPaymentNumber,
    setTransactionImage,
    clearCart,
    cleanupInvalidItems,
    regenerateClientIds,
  } = useCartStore()

  // Ensure the cart store actually has a payment method set to match the initially selected radio
  useEffect(() => {
    const current = useCartStore.getState().cart.paymentMethod
    if (!current) {
      setPaymentMethod(defaultPaymentMethod)
    }
  }, [setPaymentMethod, defaultPaymentMethod])

  const contactInfoForm = useForm<ContactInfoFormData>({
    resolver: zodResolver(ContactInfoSchema),
    defaultValues: { 
      email: customerEmail || '',
      phone: customerPhone || '',
    },
  })

  const paymentDetailsForm = useForm<PaymentDetailsFormData>({
    resolver: zodResolver(PaymentDetailsSchema),
    defaultValues: {
      paymentNumber: paymentNumber || '',
      transactionImage: transactionImage || '',
    },
  })

  const onSubmitContactInfo: SubmitHandler<ContactInfoFormData> = (values) => {
    setCustomerEmail(values.email)
    setCustomerPhone(values.phone)
    setIsEmailSelected(true)
  }

  const onSubmitPaymentDetails: SubmitHandler<PaymentDetailsFormData> = (values) => {
    setPaymentNumber(values.paymentNumber)
    setTransactionImage(values.transactionImage)
    setIsPaymentDetailsSelected(true)
  }

  const [isEmailSelected, setIsEmailSelected] = useState<boolean>(!!customerEmail)
  const [isPaymentMethodSelected, setIsPaymentMethodSelected] = useState<boolean>(false)
  const [isPaymentDetailsSelected, setIsPaymentDetailsSelected] = useState<boolean>(false)
  const [isTermsAccepted, setIsTermsAccepted] = useState<boolean>(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(transactionImage || '')
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false)
  const hasGameAccountItem = Array.isArray(items) && items.some((it: any) => it.productType === 'game_account')
  const [gameAccountOption, setGameAccountOption] = useState<'own' | 'new'>('new')
  const [accountUsername, setAccountUsername] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  
  // Promo code state
  const [appliedPromo, setAppliedPromo] = useState<{code: string, discountPercent: number} | null>(null)
  
  // Calculate discounted total - discount is applied to itemsPrice only (no tax/shipping for digital products)
  const discountAmount = appliedPromo ? (itemsPrice * appliedPromo.discountPercent / 100) : 0
  const finalTotal = itemsPrice - discountAmount

  const handlePlaceOrder = async () => {
    if (!customerEmail || !customerPhone) {
      toast({
        description: 'يرجى إدخال البريد الإلكتروني ورقم الهاتف',
        variant: 'destructive',
      })
      return
    }

    if (!paymentNumber || !transactionImage) {
      toast({
        description: 'يرجى إكمال تفاصيل الدفع',
        variant: 'destructive',
      })
      return
    }

    if (!termsAccepted) {
      toast({
        description: 'يرجى الموافقة على الشروط والأحكام',
        variant: 'destructive',
      })
      return
    }

    await withLoading(
      async () => {
        // Ensure all items have valid clientIds before placing order
        regenerateClientIds()
        
        // Get the current cart state and add promo code info
        const updatedItems = (useCartStore.getState().cart.items || []).map((it: any) => {
          if (it.productType === 'game_account') {
            return {
              ...it,
              isAddToOwnAccount: gameAccountOption === 'own',
              accountUsername: gameAccountOption === 'own' ? accountUsername : undefined,
              accountPassword: gameAccountOption === 'own' ? accountPassword : undefined,
            }
          }
          return it
        })

        const currentCart = {
          ...useCartStore.getState().cart,
          items: updatedItems,
          customerEmail,
          paymentNumber,
          transactionImage,
          promoCode: appliedPromo?.code,
          discountPercent: appliedPromo?.discountPercent,
          discountAmount: appliedPromo ? discountAmount : undefined,
        }
        
        const res = await createOrder(currentCart)
        if (!res.success) {
          toast({
            description: res.message,
            variant: 'destructive',
          })
        } else {
          toast({
            description: res.message,
            variant: 'default',
          })
          clearCart()
          router.push(`/checkout/${res.data?.orderId}`)
        }
      }
    )
  }

  const handleSelectPaymentMethod = () => {
    setIsPaymentMethodSelected(true)
  }

  const handleSelectContactInfo = () => {
    contactInfoForm.handleSubmit(onSubmitContactInfo)()
  }

  const handleSelectPaymentDetails = () => {
    paymentDetailsForm.handleSubmit(onSubmitPaymentDetails)()
  }

  const handleAcceptTerms = () => {
    if (!termsAccepted) {
      toast({
        description: 'يرجى الموافقة على الشروط والأحكام',
        variant: 'destructive',
      })
      return
    }
    setIsTermsAccepted(true)
  }

  const CheckoutSummary = memo(() => (
    <Card>
      <CardContent className='p-3 sm:p-4'>
        {!isEmailSelected && (
          <div className='border-b mb-3 sm:mb-4'>
            <Button
              className='rounded-full w-full btn-mobile'
              onClick={handleSelectContactInfo}
            >
              التالي
            </Button>
            <p className='text-xs text-center py-2 px-2'>
              أدخل بريدك الإلكتروني لإرسال المنتج الرقمي إليك
            </p>
          </div>
        )}
        {isEmailSelected && !isPaymentMethodSelected && (
          <div className='mb-3 sm:mb-4'>
            <Button
              className='rounded-full w-full btn-mobile'
              onClick={handleSelectPaymentMethod}
            >
              استخدم طريقة الدفع هذه
            </Button>
            <p className='text-xs text-center py-2 px-2'>
              اختر طريقة الدفع للمتابعة
            </p>
          </div>
        )}
        {isPaymentMethodSelected && !isPaymentDetailsSelected && (
          <div className='mb-3 sm:mb-4'>
            <Button
              className='rounded-full w-full btn-mobile'
              onClick={handleSelectPaymentDetails}
            >
              التالي
            </Button>
            <p className='text-xs text-center py-2 px-2'>
              أدخل تفاصيل الدفع وارفع صورة المعاملة
            </p>
          </div>
        )}
        {isPaymentDetailsSelected && isTermsAccepted && isPaymentMethodSelected && isEmailSelected && (
          <div>
            <Button 
              onClick={handlePlaceOrder} 
              className='rounded-full w-full btn-mobile-lg'
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب'}
            </Button>
          </div>
        )}

        <div>
          <div className='text-base sm:text-lg font-bold'>ملخص الطلب</div>
          <div className='space-y-2'>
            <div className='flex justify-between text-sm sm:text-base'>
              <span>المنتجات:</span>
              <span>
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>

            {/* Promo Code Section */}
            <div className='pt-3 border-t'>
              <PromoCodeInput
                onPromoApplied={setAppliedPromo}
                onPromoRemoved={() => setAppliedPromo(null)}
                appliedPromo={appliedPromo}
                discountAmount={discountAmount}
              />
            </div>

            <div className='flex justify-between pt-3 sm:pt-4 font-bold text-base sm:text-lg'>
              <span>المجموع الكلي:</span>
              <span className={appliedPromo ? 'text-green-400' : ''}>
                <ProductPrice price={finalTotal} plain />
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ))

  const currentPaymentInfo = paymentMethod && PAYMENT_INFO[paymentMethod as keyof typeof PAYMENT_INFO]

  return (
    <main className='max-w-6xl mx-auto highlight-link px-4 py-6 sm:py-8' dir='rtl'>
      <LoadingOverlay 
        isLoading={isPlacingOrder} 
        text="جاري معالجة الطلب..."
      />
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6'>
        <div className='lg:col-span-3'>
          
          {/* Email Section */}
          <div>
            {isEmailSelected && customerEmail && customerPhone ? (
              <div className='grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 my-3 pb-3'>
                <div className='col-span-12 lg:col-span-5 flex text-base sm:text-lg font-bold'>
                  <span className='w-6 sm:w-8'>1 </span>
                  <span>معلومات التواصل</span>
                </div>
                <div className='col-span-12 lg:col-span-5 text-sm sm:text-base'>
                  <p className='mb-1'><strong>البريد:</strong> {customerEmail}</p>
                  <p><strong>الهاتف:</strong> {customerPhone}</p>
                </div>
                <div className='col-span-12 lg:col-span-2'>
                  <Button
                    variant={'outline'}
                    onClick={() => {
                      setIsEmailSelected(false)
                      setIsPaymentMethodSelected(false)
                      setIsPaymentDetailsSelected(false)
                    }}
                    className='w-full lg:w-auto btn-mobile'
                  >
                    تغيير
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className='flex text-primary text-base sm:text-lg font-bold my-2'>
                  <span className='w-6 sm:w-8'>1 </span>
                  <span>أدخل معلومات التواصل</span>
                </div>
                
                {/* Game Account Options */}
                {hasGameAccountItem && (
                  <Card className='lg:mr-8 my-3 sm:my-4'>
                    <CardContent className='p-3 sm:p-4 space-y-3 sm:space-y-4'>
                      <div className='text-base sm:text-lg font-bold mb-2'>خيارات حساب اللعبة</div>
                      <div className='space-y-2'>
                        <label className='flex items-center gap-2 text-sm sm:text-base'>
                          <input
                            type='radio'
                            name='gameAccountOption'
                            checked={gameAccountOption === 'new'}
                            onChange={() => setGameAccountOption('new')}
                          />
                          الحصول على حساب جديد للعبة (لا حاجة لبيانات حسابك)
                        </label>
                        <label className='flex items-center gap-2 text-sm sm:text-base'>
                          <input
                            type='radio'
                            name='gameAccountOption'
                            checked={gameAccountOption === 'own'}
                            onChange={() => setGameAccountOption('own')}
                          />
                          إضافة اللعبة إلى حسابي الخاص
                        </label>
                      </div>
                      {gameAccountOption === 'own' && (
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3'>
                          <div>
                            <Label className='text-white text-sm sm:text-base'>اسم المستخدم للحساب</Label>
                            <Input
                              value={accountUsername}
                              onChange={(e) => setAccountUsername(e.target.value)}
                              placeholder='أدخل اسم المستخدم'
                              className='border-gray-700 bg-gray-800 text-gray-200'
                            />
                          </div>
                          <div>
                            <Label className='text-white text-sm sm:text-base'>كلمة المرور للحساب</Label>
                            <Input
                              type='password'
                              value={accountPassword}
                              onChange={(e) => setAccountPassword(e.target.value)}
                              placeholder='أدخل كلمة المرور'
                              className='border-gray-700 bg-gray-800 text-gray-200'
                            />
                          </div>
                          <p className='col-span-1 sm:col-span-2 text-xs text-gray-400'>
                            ملاحظة: سيتم استخدام هذه البيانات فقط لإضافة اللعبة إلى حسابك ثم يتم حذفها فوراً بعد الإتمام.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                <Form {...contactInfoForm}>
                  <form
                    method='post'
                    onSubmit={contactInfoForm.handleSubmit(onSubmitContactInfo)}
                    className='space-y-3 sm:space-y-4'
                  >
                    <Card className='lg:mr-8 my-3 sm:my-4'>
                      <CardContent className='p-3 sm:p-4 space-y-3 sm:space-y-4'>
                        <div>
                          <div className='text-base sm:text-lg font-bold mb-2'>
                            البريد الإلكتروني
                          </div>
                          <FormField
                            control={contactInfoForm.control}
                            name='email'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel className='text-sm sm:text-base text-white'>
                                  سيتم إرسال المنتج الرقمي إلى هذا البريد
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type='email'
                                    placeholder='example@email.com'
                                    {...field}
                                    className='input-mobile'
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div>
                          <div className='text-base sm:text-lg font-bold mb-2'>
                            رقم الهاتف
                          </div>
                          <FormField
                            control={contactInfoForm.control}
                            name='phone'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel className='text-sm sm:text-base text-white'>
                                  للتواصل في حالة عدم توفر البريد الإلكتروني
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type='tel'
                                    placeholder='01234567890'
                                    {...field}
                                    className='input-mobile'
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className='p-3 sm:p-4'>
                        <Button
                          type='submit'
                          className='rounded-full font-bold w-full btn-mobile-lg'
                        >
                          التالي
                        </Button>
                      </CardFooter>
                    </Card>
                  </form>
                </Form>
              </>
            )}
          </div>

          {/* Payment Method Section */}
          <div className='border-y'>
            {isPaymentMethodSelected && paymentMethod ? (
              <div className='grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 my-3 pb-3'>
                <div className='flex text-base sm:text-lg font-bold col-span-12 lg:col-span-5'>
                  <span className='w-6 sm:w-8'>2 </span>
                  <span>طريقة الدفع</span>
                </div>
                <div className='col-span-12 lg:col-span-5 text-sm sm:text-base'>
                  <p>{paymentMethod}</p>
                </div>
                <div className='col-span-12 lg:col-span-2'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsPaymentMethodSelected(false)
                      setIsPaymentDetailsSelected(false)
                    }}
                    className='w-full lg:w-auto btn-mobile'
                  >
                    تغيير
                  </Button>
                </div>
              </div>
            ) : isEmailSelected ? (
              <>
                <div className='flex text-primary text-base sm:text-lg font-bold my-2'>
                  <span className='w-6 sm:w-8'>2 </span>
                  <span>اختر طريقة الدفع</span>
                </div>
                <Card className='lg:mr-8 my-3 sm:my-4'>
                  <CardContent className='p-3 sm:p-4'>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value)}
                    >
                      {availablePaymentMethods.map((pm) => (
                        <div key={pm.name} className='flex items-center py-1'>
                          <RadioGroupItem
                            value={pm.name}
                            id={`payment-${pm.name}`}
                          />
                          <Label
                            className='font-bold pr-2 cursor-pointer text-right w-full text-sm sm:text-base'
                            htmlFor={`payment-${pm.name}`}
                          >
                            {pm.name}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                  <CardFooter className='p-3 sm:p-4'>
                    <Button
                      onClick={handleSelectPaymentMethod}
                      className='rounded-full font-bold w-full btn-mobile-lg'
                    >
                      استخدم طريقة الدفع هذه
                    </Button>
                  </CardFooter>
                </Card>
              </>
            ) : (
              <div className='flex text-muted-foreground text-base sm:text-lg font-bold my-3 sm:my-4 py-3'>
                <span className='w-6 sm:w-8'>2 </span>
                <span>اختر طريقة الدفع</span>
              </div>
            )}
          </div>

          {/* Payment Details Section */}
          <div className='border-b'>
            {isPaymentDetailsSelected && paymentNumber && transactionImage ? (
              <div className='grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 my-3 pb-3'>
                <div className='flex text-base sm:text-lg font-bold col-span-12 lg:col-span-5'>
                  <span className='w-6 sm:w-8'>3 </span>
                  <span>تفاصيل الدفع</span>
                </div>
                <div className='col-span-12 lg:col-span-5 text-sm sm:text-base'>
                  <p>رقم الدفع: {paymentNumber}</p>
                  <p className='text-green-400'>✓ تم رفع صورة المعاملة</p>
                </div>
                <div className='col-span-12 lg:col-span-2'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsPaymentDetailsSelected(false)
                    }}
                    className='w-full lg:w-auto btn-mobile'
                  >
                    تغيير
                  </Button>
                </div>
              </div>
            ) : isPaymentMethodSelected ? (
              <>
                <div className='flex text-primary text-base sm:text-lg font-bold my-2 pt-3'>
                  <span className='w-6 sm:w-8'>3 </span>
                  <span>أدخل تفاصيل الدفع</span>
                </div>
                <Form {...paymentDetailsForm}>
                  <form
                    method='post'
                    onSubmit={paymentDetailsForm.handleSubmit(onSubmitPaymentDetails)}
                    className='space-y-3 sm:space-y-4'
                  >
                    <Card className='lg:mr-8 my-3 sm:my-4'>
                      <CardContent className='p-3 sm:p-4 space-y-4'>
                        {/* Payment Info Display */}
                        {currentPaymentInfo && (
                          <div className='bg-gray-800 border border-gray-700 rounded-lg p-4'>
                            <div className='text-lg font-bold mb-3 flex items-center gap-2'>
                              <span>{currentPaymentInfo.icon}</span>
                              <span>معلومات الدفع</span>
                            </div>
                            <div className='text-sm sm:text-base space-y-2'>
                              {currentPaymentInfo.userName && (
                                <div>
                                  <p className='mb-1 text-gray-300'>
                                    اسم المستخدم:
                                  </p>
                                  <p className='text-green-400 font-bold text-lg'>
                                    {currentPaymentInfo.userName}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className='mb-1 text-gray-300'>
                                  {currentPaymentInfo.label}:
                                </p>
                                <p className='text-green-400 font-bold text-lg'>
                                  {currentPaymentInfo.number}
                                </p>
                              </div>
                              
                              {/* InstaPay Link */}
                              {currentPaymentInfo.link && (
                                <div className='mt-3'>
                                  <a
                                    href={currentPaymentInfo.link}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='inline-flex items-center justify-center w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors border-0'
                                    style={{
                                      backgroundColor: '#22c55e',
                                      color: '#ffffff',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#16a34a'
                                      e.currentTarget.style.color = '#ffffff'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#22c55e'
                                      e.currentTarget.style.color = '#ffffff'
                                    }}
                                  >
                                    اضغط لإرسال نقود
                                  </a>
                                  <p className='text-xs text-gray-400 mt-2 text-center'>
                                    Powered by InstaPay
                                  </p>
                                </div>
                              )}
                              
                              {/* Bank Account Details */}
                              {currentPaymentInfo.accountHolder && (
                                <div className='mt-3 pt-3 border-t border-gray-700 space-y-2'>
                                  <p className='text-xs text-gray-400'>للدفع من خارج مصر:</p>
                                  <p className='text-sm text-gray-300'>
                                    <span className='font-semibold'>اسم صاحب الحساب:</span> {currentPaymentInfo.accountHolder}
                                  </p>
                                  <p className='text-sm text-gray-300'>
                                    <span className='font-semibold'>IBAN:</span> {currentPaymentInfo.iban}
                                  </p>
                                  <p className='text-sm text-gray-300'>
                                    <span className='font-semibold'>Swift Code:</span> {currentPaymentInfo.swift}
                                  </p>
                                </div>
                              )}
                              
                              {!currentPaymentInfo.link && !currentPaymentInfo.accountHolder && (
                                <p className='text-xs text-gray-400 mt-2'>
                                  قم بتحويل المبلغ إلى الرقم أعلاه، ثم أدخل رقمك وارفع صورة المعاملة
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Payment Number Input */}
                        <FormField
                          control={paymentDetailsForm.control}
                          name='paymentNumber'
                          render={({ field }) => (
                            <FormItem className='w-full'>
                              <FormLabel className='text-sm sm:text-base text-white'>
                                {currentPaymentInfo ? `رقمك في ${paymentMethod}` : 'رقم الدفع الخاص بك'}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='أدخل رقم الدفع الخاص بك'
                                  {...field}
                                  className='input-mobile'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Transaction Image Upload */}
                        <FormField
                          control={paymentDetailsForm.control}
                          name='transactionImage'
                          render={({ field }) => (
                            <FormItem className='w-full'>
                              <FormLabel className='text-sm sm:text-base text-white'>
                                صورة المعاملة
                              </FormLabel>
                              <FormControl>
                                <div className='space-y-3'>
                                  {uploadedImageUrl ? (
                                    <div className='space-y-2'>
                                      <div className='relative w-full h-64 border border-gray-700 rounded-lg overflow-hidden'>
                                        <img
                                          src={uploadedImageUrl}
                                          alt='Transaction screenshot'
                                          className='w-full h-full object-contain bg-gray-900'
                                        />
                                      </div>
                                      <Button
                                        type='button'
                                        variant='outline'
                                        onClick={() => {
                                          setUploadedImageUrl('')
                                          field.onChange('')
                                          paymentDetailsForm.setValue('transactionImage', '')
                                        }}
                                        className='w-full'
                                      >
                                        حذف الصورة
                                      </Button>
                                    </div>
                                  ) : (
                                    <UploadButton
                                      endpoint='imageUploader'
                                      onClientUploadComplete={(res) => {
                                        if (res && res[0]) {
                                          const url = res[0].url
                                          setUploadedImageUrl(url)
                                          field.onChange(url)
                                          paymentDetailsForm.setValue('transactionImage', url)
                                          toast({
                                            description: 'تم رفع الصورة بنجاح',
                                          })
                                        }
                                      }}
                                      onUploadError={(error: Error) => {
                                        toast({
                                          description: `خطأ في رفع الصورة: ${error.message}`,
                                          variant: 'destructive',
                                        })
                                      }}
                                      appearance={{
                                        button: 'ut-ready:bg-green-500 ut-ready:bg-opacity-20 ut-uploading:cursor-not-allowed ut-uploading:bg-gray-500 ut-uploading:bg-opacity-20 bg-gray-800 text-white border border-gray-700 cursor-pointer rounded-lg px-4 py-2 text-sm',
                                        container: 'w-full',
                                        allowedContent: 'text-gray-400 text-xs mt-2',
                                      }}
                                    />
                                  )}
                                  <input type='hidden' {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                      <CardFooter className='p-3 sm:p-4'>
                        <Button
                          type='submit'
                          className='rounded-full font-bold w-full btn-mobile-lg'
                        >
                          التالي
                        </Button>
                      </CardFooter>
                    </Card>
                  </form>
                </Form>
              </>
            ) : (
              <div className='flex text-muted-foreground text-base sm:text-lg font-bold my-3 sm:my-4 py-3'>
                <span className='w-6 sm:w-8'>3 </span>
                <span>أدخل تفاصيل الدفع</span>
              </div>
            )}
          </div>

          {/* Step 4: Terms and Conditions */}
          <div className='border-b'>
            {!isPaymentDetailsSelected && !isTermsAccepted ? (
              <div className='flex text-muted-foreground text-base sm:text-lg font-bold my-3 sm:my-4 py-3'>
                <span className='w-6 sm:w-8'>4 </span>
                <span>الشروط والأحكام</span>
              </div>
            ) : null}
          </div>

          {isPaymentDetailsSelected && !isTermsAccepted && isPaymentMethodSelected && isEmailSelected && (
            <div className='mt-4 sm:mt-6'>
              <Card>
                <CardContent className='p-3 sm:p-4'>
                  <div className='flex text-primary text-base sm:text-lg font-bold my-2'>
                    <span className='w-6 sm:w-8'>4 </span>
                    <span>الشروط والأحكام</span>
                  </div>
                  <div className='mb-3 flex items-start gap-2'>
                    <Checkbox 
                      id="terms-desktop" 
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    />
                    <label 
                      htmlFor="terms-desktop" 
                      className='text-sm cursor-pointer'
                    >
                      أوافق على{' '}
                      <Link href="/terms" className='text-green-400 hover:underline'>
                        الشروط والأحكام
                      </Link>
                    </label>
                  </div>
                  <Button
                    className='rounded-full w-full btn-mobile'
                    onClick={handleAcceptTerms}
                  >
                    التالي
                  </Button>
                  <p className='text-xs text-center py-2 px-2'>
                    يرجى قراءة والموافقة على الشروط والأحكام
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          {isPaymentDetailsSelected && isTermsAccepted && isPaymentMethodSelected && isEmailSelected && (
            <div className='mt-4 sm:mt-6'>
              <div className='block lg:hidden'>
                <CheckoutSummary />
              </div>

              <Card className='hidden lg:block'>
                <CardContent className='p-4 flex flex-col lg:flex-row justify-between items-center gap-3'>
                  <Button 
                    onClick={handlePlaceOrder} 
                    className='rounded-full btn-mobile-lg'
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب'}
                  </Button>
                  <div className='flex-1'>
                    <p className='font-bold text-base sm:text-lg'>
                      المجموع الكلي: <ProductPrice price={finalTotal} plain />
                      {appliedPromo && (
                        <span className='text-xs text-green-400 mr-2'>
                          (وفرت {appliedPromo.discountPercent}%)
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <CheckoutFooter />
        </div>
        <div className='hidden lg:block'>
          <CheckoutSummary />
        </div>
      </div>
    </main>
  )
}

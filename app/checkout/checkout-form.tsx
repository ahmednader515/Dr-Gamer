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
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
})

type ContactInfoFormData = z.infer<typeof ContactInfoSchema>

const PaymentDetailsSchema = z.object({
  paymentNumber: z.string().min(1, 'Payment number is required'),
  transactionImage: z.string().min(1, 'Transaction image is required'),
})

type PaymentDetailsFormData = z.infer<typeof PaymentDetailsSchema>

// Payment method details
const PAYMENT_INFO = {
  'Vodafone Cash': {
    number: '01277910038',
    label: 'Vodafone Cash Number',
    icon: '📱',
  },
  'InstaPay': {
    number: 'mina.shk',
    label: 'InstaPay Username',
    icon: '💳',
    userName: 'mina.shk@instapay',
    link: 'https://ipn.eg/S/mina.shk/instapay/2nU1nh',
  },
  'Telda': {
    number: '@minahakim3',
    label: 'Telda Username',
    icon: '🟢',
    instagram: '@minahakim3',
  },
  'Bank Account': {
    number: '5110333000001242',
    label: 'Bank Account Number',
    icon: '🏦',
    accountHolder: 'Mina Samir Hakim',
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
  
  // Calculate new account tax (30 EGP per item with "New Account" variation)
  const newAccountTax = Array.isArray(items) 
    ? items.reduce((total: number, item: any) => {
        const variation = item.selectedVariation?.toLowerCase() || ''
        if (variation.includes('new account')) {
          return total + 30
        }
        return total
      }, 0)
    : 0
  
  // Track personal account details for each item
  const [personalAccountDetails, setPersonalAccountDetails] = useState<{
    [itemId: string]: {
      username: string
      password: string
      backupCode?: string
      twoStepDisabled?: boolean
    }
  }>({})
  
  // Check if any item requires personal account input
  const itemsRequiringPersonalAccount = Array.isArray(items)
    ? items.filter((item: any) => {
        const variation = item.selectedVariation?.toLowerCase() || ''
        return variation.includes('personal account')
      })
    : []
  
  // Promo code state
  const [appliedPromo, setAppliedPromo] = useState<{code: string, discountPercent: number} | null>(null)
  
  // Calculate discounted total - discount is applied to itemsPrice only (no tax/shipping for digital products)
  const discountAmount = appliedPromo ? (itemsPrice * appliedPromo.discountPercent / 100) : 0
  const finalTotal = itemsPrice - discountAmount + newAccountTax

  const handlePlaceOrder = async () => {
    if (!customerEmail || !customerPhone) {
      toast({
        description: 'Please enter email and phone number',
        variant: 'destructive',
      })
      return
    }

    if (!paymentNumber || !transactionImage) {
      toast({
        description: 'Please complete payment details',
        variant: 'destructive',
      })
      return
    }

    if (!termsAccepted) {
      toast({
        description: 'Please accept the terms and conditions',
        variant: 'destructive',
      })
      return
    }

    // Validate personal account details
    for (const item of itemsRequiringPersonalAccount) {
      const details = personalAccountDetails[item.clientId]
      if (!details || !details.username || !details.password) {
        toast({
          description: `Please provide account credentials for ${item.name}`,
          variant: 'destructive',
        })
        return
      }
      
      // Xbox specific validation
      if (item.platformType === 'Xbox' && !details.twoStepDisabled) {
        toast({
          description: `Please confirm that you have disabled 2-step verification for Xbox account (${item.name})`,
          variant: 'destructive',
        })
        return
      }
      
      // PlayStation specific validation
      if (item.platformType === 'Playstation' && !details.backupCode) {
        toast({
          description: `Please provide backup code for PlayStation account (${item.name})`,
          variant: 'destructive',
        })
        return
      }
      
      if (item.platformType === 'Playstation' && !details.twoStepDisabled) {
        toast({
          description: `Please confirm that you have disabled 2-step verification for PlayStation account (${item.name})`,
          variant: 'destructive',
        })
        return
      }
    }

    await withLoading(
      async () => {
        // Ensure all items have valid clientIds before placing order
        regenerateClientIds()
        
        // Get the current cart state and add promo code info and personal account details
        const updatedItems = (useCartStore.getState().cart.items || []).map((it: any) => {
          // Check if this item requires personal account details
          const requiresPersonalAccount = it.selectedVariation?.toLowerCase().includes('personal account')
          const details = personalAccountDetails[it.clientId]
          
          if (requiresPersonalAccount && details) {
            return {
              ...it,
              accountUsername: details.username,
              accountPassword: details.password,
              accountBackupCode: details.backupCode,
              disableTwoStepVerified: details.twoStepDisabled || false,
            }
          }
          
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
        description: 'Please accept the terms and conditions',
        variant: 'destructive',
      })
      return
    }
    setIsTermsAccepted(true)
  }

  const CheckoutSummary = memo(() => (
    <Card>
      <CardContent className='p-3 sm:p-4'>
        {/* Promo Code Section - Desktop sidebar only */}
        <div className='hidden lg:block mb-4 pb-4 border-b'>
          <PromoCodeInput
            onPromoApplied={setAppliedPromo}
            onPromoRemoved={() => setAppliedPromo(null)}
            appliedPromo={appliedPromo}
            discountAmount={discountAmount}
          />
        </div>

        {!isEmailSelected && (
          <div className='border-b mb-3 sm:mb-4'>
            <Button
              className='rounded-full w-full btn-mobile'
              onClick={handleSelectContactInfo}
            >
              Next
            </Button>
            <p className='text-xs text-center py-2 px-2'>
              Enter your email to receive the digital product
            </p>
          </div>
        )}
        {isEmailSelected && !isPaymentMethodSelected && (
          <div className='mb-3 sm:mb-4'>
            <Button
              className='rounded-full w-full btn-mobile'
              onClick={handleSelectPaymentMethod}
            >
              Use this payment method
            </Button>
            <p className='text-xs text-center py-2 px-2'>
              Select a payment method to continue
            </p>
          </div>
        )}
        {isPaymentMethodSelected && !isPaymentDetailsSelected && (
          <div className='mb-3 sm:mb-4'>
            <Button
              className='rounded-full w-full btn-mobile'
              onClick={handleSelectPaymentDetails}
            >
              Next
            </Button>
            <p className='text-xs text-center py-2 px-2'>
              Enter payment details and upload transaction screenshot
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
              {isPlacingOrder ? 'Confirming Order...' : 'Confirm Order'}
            </Button>
          </div>
        )}

        <div>
          <div className='text-base sm:text-lg font-bold'>Order Summary</div>
          <div className='space-y-2'>
            <div className='flex justify-between text-sm sm:text-base'>
              <span>Products:</span>
              <span>
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>

            {/* New Account Tax */}
            {newAccountTax > 0 && (
              <div className='pt-2 space-y-1'>
                <div className='flex justify-between text-sm sm:text-base'>
                  <span>New Account Fee:</span>
                  <span className='text-orange-400'>
                    +<ProductPrice price={newAccountTax} plain />
                  </span>
                </div>
                <p className='text-xs text-gray-400'>
                  Includes account creation, setup, and initial configuration (30 EGP per new account)
                </p>
              </div>
            )}

            <div className='flex justify-between pt-3 sm:pt-4 font-bold text-base sm:text-lg border-t'>
              <span>Total:</span>
              <span className={appliedPromo ? 'text-purple-400' : ''}>
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
    <main className='max-w-6xl mx-auto highlight-link px-4 py-6 sm:py-8 pb-32 lg:pb-8' dir='ltr'>
      <LoadingOverlay 
        isLoading={isPlacingOrder} 
        text="Processing order..."
      />
      
      {/* Mobile Bottom Banner - Always Visible */}
      <div className='lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t-2 border-purple-500 shadow-lg'>
        <div className='p-4 space-y-2'>
          <div className='flex justify-between items-center text-sm'>
            <span className='text-gray-300'>Products:</span>
            <span className='font-semibold'>
              <ProductPrice price={itemsPrice} plain />
            </span>
          </div>
          
          {newAccountTax > 0 && (
            <div className='flex justify-between items-center text-sm'>
              <span className='text-gray-300'>New Account Fee:</span>
              <span className='font-semibold text-orange-400'>
                +<ProductPrice price={newAccountTax} plain />
              </span>
            </div>
          )}
          
          {appliedPromo && discountAmount > 0 && (
            <div className='flex justify-between items-center text-sm'>
              <span className='text-gray-300'>Discount ({appliedPromo.discountPercent}%):</span>
              <span className='font-semibold text-purple-400'>
                -<ProductPrice price={discountAmount} plain />
              </span>
            </div>
          )}
          
          <div className='flex justify-between items-center pt-2 border-t border-gray-700'>
            <span className='font-bold text-base'>Total:</span>
            <span className='font-bold text-lg text-purple-400'>
              <ProductPrice price={finalTotal} plain />
            </span>
          </div>
          
          {newAccountTax > 0 && (
            <p className='text-xs text-gray-400 text-center'>
              Includes 30 EGP setup fee per new account
            </p>
          )}
        </div>
      </div>
      
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6'>
        <div className='lg:col-span-3'>
          
          {/* Promo Code Section - Mobile Only at Top */}
          <div className='block lg:hidden mb-4'>
            <Card>
              <CardContent className='p-3 sm:p-4'>
                <PromoCodeInput
                  onPromoApplied={setAppliedPromo}
                  onPromoRemoved={() => setAppliedPromo(null)}
                  appliedPromo={appliedPromo}
                  discountAmount={discountAmount}
                />
              </CardContent>
            </Card>
          </div>

          {/* Email Section */}
          <div>
            {isEmailSelected && customerEmail && customerPhone ? (
              <div className='grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 my-3 pb-3'>
                <div className='col-span-12 lg:col-span-5 flex text-base sm:text-lg font-bold'>
                  <span className='w-6 sm:w-8'>1 </span>
                  <span>Contact Information</span>
                </div>
                <div className='col-span-12 lg:col-span-5 text-sm sm:text-base'>
                  <p className='mb-1'><strong>Email:</strong> {customerEmail}</p>
                  <p><strong>Phone:</strong> {customerPhone}</p>
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
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className='flex text-primary text-base sm:text-lg font-bold my-2'>
                  <span className='w-6 sm:w-8'>1 </span>
                  <span>Enter Contact Information</span>
                </div>
                
                {/* Personal Account Inputs */}
                {itemsRequiringPersonalAccount.length > 0 && (
                  <Card className='lg:ml-8 my-3 sm:my-4'>
                    <CardContent className='p-3 sm:p-4 space-y-4'>
                      <div className='text-base sm:text-lg font-bold mb-2'>Personal Account Details</div>
                      <p className='text-sm text-gray-400 mb-4'>
                        Please provide your account credentials for personal account items:
                      </p>
                      {itemsRequiringPersonalAccount.map((item: any) => {
                        const isXbox = item.platformType === 'Xbox'
                        const isPlaystation = item.platformType === 'Playstation'
                        
                        return (
                          <div key={item.clientId} className='border border-gray-700 rounded-lg p-4 space-y-3'>
                            <h4 className='font-semibold text-white'>{item.name} - {item.selectedVariation}</h4>
                            
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                              <div>
                                <Label className='text-white text-sm'>Email/Username</Label>
                                <Input
                                  value={personalAccountDetails[item.clientId]?.username || ''}
                                  onChange={(e) => setPersonalAccountDetails({
                                    ...personalAccountDetails,
                                    [item.clientId]: {
                                      ...personalAccountDetails[item.clientId],
                                      username: e.target.value
                                    }
                                  })}
                                  placeholder='Enter account email/username'
                                  className='border-gray-700 bg-gray-800 text-gray-200'
                                  required
                                />
                              </div>
                              <div>
                                <Label className='text-white text-sm'>Password</Label>
                                <Input
                                  type='password'
                                  value={personalAccountDetails[item.clientId]?.password || ''}
                                  onChange={(e) => setPersonalAccountDetails({
                                    ...personalAccountDetails,
                                    [item.clientId]: {
                                      ...personalAccountDetails[item.clientId],
                                      password: e.target.value
                                    }
                                  })}
                                  placeholder='Enter account password'
                                  className='border-gray-700 bg-gray-800 text-gray-200'
                                  required
                                />
                              </div>
                            </div>
                            
                            {isXbox && (
                              <div className='flex items-center gap-2'>
                                <Checkbox
                                  id={`xbox-2step-${item.clientId}`}
                                  checked={personalAccountDetails[item.clientId]?.twoStepDisabled || false}
                                  onCheckedChange={(checked) => setPersonalAccountDetails({
                                    ...personalAccountDetails,
                                    [item.clientId]: {
                                      ...personalAccountDetails[item.clientId],
                                      twoStepDisabled: checked === true
                                    }
                                  })}
                                />
                                <label 
                                  htmlFor={`xbox-2step-${item.clientId}`}
                                  className='text-sm text-white cursor-pointer'
                                >
                                  I confirm that I have disabled 2-step verification on my Xbox account (Required)
                                </label>
                              </div>
                            )}
                            
                            {isPlaystation && (
                              <div className='space-y-3'>
                                <div>
                                  <Label className='text-white text-sm'>Backup Code (Required for PlayStation)</Label>
                                  <Input
                                    value={personalAccountDetails[item.clientId]?.backupCode || ''}
                                    onChange={(e) => setPersonalAccountDetails({
                                      ...personalAccountDetails,
                                      [item.clientId]: {
                                        ...personalAccountDetails[item.clientId],
                                        backupCode: e.target.value
                                      }
                                    })}
                                    placeholder='Enter PlayStation backup code'
                                    className='border-gray-700 bg-gray-800 text-gray-200'
                                    required
                                  />
                                  <p className='text-xs text-gray-400 mt-1'>
                                    You can find your backup codes in PlayStation account settings
                                  </p>
                                </div>
                                
                                <div className='flex items-center gap-2'>
                                  <Checkbox
                                    id={`ps-2step-${item.clientId}`}
                                    checked={personalAccountDetails[item.clientId]?.twoStepDisabled || false}
                                    onCheckedChange={(checked) => setPersonalAccountDetails({
                                      ...personalAccountDetails,
                                      [item.clientId]: {
                                        ...personalAccountDetails[item.clientId],
                                        twoStepDisabled: checked === true
                                      }
                                    })}
                                  />
                                  <label 
                                    htmlFor={`ps-2step-${item.clientId}`}
                                    className='text-sm text-white cursor-pointer'
                                  >
                                    I confirm that I have disabled 2-step verification on my PlayStation account (Required)
                                  </label>
                                </div>
                              </div>
                            )}
                            
                            <p className='text-xs text-gray-400 italic'>
                              ⚠️ These credentials will only be used to add the game to your account and will be securely deleted immediately after completion.
                            </p>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                )}
                
                <Form {...contactInfoForm}>
                  <form
                    method='post'
                    onSubmit={contactInfoForm.handleSubmit(onSubmitContactInfo)}
                    className='space-y-3 sm:space-y-4'
                  >
                    <Card className='lg:ml-8 my-3 sm:my-4'>
                      <CardContent className='p-3 sm:p-4 space-y-3 sm:space-y-4'>
                        <div>
                          <div className='text-base sm:text-lg font-bold mb-2'>
                            Email Address
                          </div>
                          <FormField
                            control={contactInfoForm.control}
                            name='email'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel className='text-sm sm:text-base text-white'>
                                  The digital product will be sent to this email
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
                            Phone Number
                          </div>
                          <FormField
                            control={contactInfoForm.control}
                            name='phone'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel className='text-sm sm:text-base text-white'>
                                  For contact if email is unavailable
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
                          Next
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
                  <span>Payment Method</span>
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
                    Change
                  </Button>
                </div>
              </div>
            ) : isEmailSelected ? (
              <>
                <div className='flex text-primary text-base sm:text-lg font-bold my-2'>
                  <span className='w-6 sm:w-8'>2 </span>
                  <span>Select Payment Method</span>
                </div>
                <Card className='lg:ml-8 my-3 sm:my-4'>
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
                            className='font-bold pl-2 cursor-pointer text-left w-full text-sm sm:text-base'
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
                      Use this payment method
                    </Button>
                  </CardFooter>
                </Card>
              </>
            ) : (
              <div className='flex text-muted-foreground text-base sm:text-lg font-bold my-3 sm:my-4 py-3'>
                <span className='w-6 sm:w-8'>2 </span>
                <span>Select Payment Method</span>
              </div>
            )}
          </div>

          {/* Payment Details Section */}
          <div className='border-b'>
            {isPaymentDetailsSelected && paymentNumber && transactionImage ? (
              <div className='grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 my-3 pb-3'>
                <div className='flex text-base sm:text-lg font-bold col-span-12 lg:col-span-5'>
                  <span className='w-6 sm:w-8'>3 </span>
                  <span>Payment Details</span>
                </div>
                <div className='col-span-12 lg:col-span-5 text-sm sm:text-base'>
                  <p>Payment Number: {paymentNumber}</p>
                  <p className='text-purple-400'>✓ Transaction image uploaded</p>
                </div>
                <div className='col-span-12 lg:col-span-2'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsPaymentDetailsSelected(false)
                    }}
                    className='w-full lg:w-auto btn-mobile'
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : isPaymentMethodSelected ? (
              <>
                <div className='flex text-primary text-base sm:text-lg font-bold my-2 pt-3'>
                  <span className='w-6 sm:w-8'>3 </span>
                  <span>Enter Payment Details</span>
                </div>
                <Form {...paymentDetailsForm}>
                  <form
                    method='post'
                    onSubmit={paymentDetailsForm.handleSubmit(onSubmitPaymentDetails)}
                    className='space-y-3 sm:space-y-4'
                  >
                    <Card className='lg:ml-8 my-3 sm:my-4'>
                      <CardContent className='p-3 sm:p-4 space-y-4'>
                        {/* Payment Info Display */}
                        {currentPaymentInfo && (
                          <div className='bg-gray-800 border border-gray-700 rounded-lg p-4'>
                            <div className='text-lg font-bold mb-3 flex items-center gap-2'>
                              <span>{currentPaymentInfo.icon}</span>
                              <span>Payment Information</span>
                            </div>
                            <div className='text-sm sm:text-base space-y-2'>
                              {currentPaymentInfo.userName && (
                                <div>
                                  <p className='mb-1 text-gray-300'>
                                    Username:
                                  </p>
                                  <p className='text-purple-400 font-bold text-lg'>
                                    {currentPaymentInfo.userName}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className='mb-1 text-gray-300'>
                                  {currentPaymentInfo.label}:
                                </p>
                                <p className='text-purple-400 font-bold text-lg'>
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
                                    Click to Send Money
                                  </a>
                                  <p className='text-xs text-gray-400 mt-2 text-center'>
                                    Powered by InstaPay
                                  </p>
                                </div>
                              )}
                              
                              {/* Bank Account Details */}
                              {currentPaymentInfo.accountHolder && (
                                <div className='mt-3 pt-3 border-t border-gray-700 space-y-2'>
                                  <p className='text-xs text-gray-400'>For payments from outside Egypt:</p>
                                  <p className='text-sm text-gray-300'>
                                    <span className='font-semibold'>Account Holder:</span> {currentPaymentInfo.accountHolder}
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
                                  Transfer the amount to the number above, then enter your number and upload the transaction screenshot
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
                                {currentPaymentInfo ? `Your number in ${paymentMethod}` : 'Your payment number'}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='Enter your payment number'
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
                                Transaction Screenshot
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
                                        Delete Image
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
                                            description: 'Image uploaded successfully',
                                          })
                                        }
                                      }}
                                      onUploadError={(error: Error) => {
                                        toast({
                                          description: `Error uploading image: ${error.message}`,
                                          variant: 'destructive',
                                        })
                                      }}
                                      appearance={{
                                        button: 'ut-ready:bg-purple-500 ut-ready:bg-opacity-20 ut-uploading:cursor-not-allowed ut-uploading:bg-gray-500 ut-uploading:bg-opacity-20 bg-gray-800 text-white border border-gray-700 cursor-pointer rounded-lg px-4 py-2 text-sm',
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
                          Next
                        </Button>
                      </CardFooter>
                    </Card>
                  </form>
                </Form>
              </>
            ) : (
              <div className='flex text-muted-foreground text-base sm:text-lg font-bold my-3 sm:my-4 py-3'>
                <span className='w-6 sm:w-8'>3 </span>
                <span>Enter Payment Details</span>
              </div>
            )}
          </div>

          {/* Step 4: Terms and Conditions */}
          <div className='border-b'>
            {!isPaymentDetailsSelected && !isTermsAccepted ? (
              <div className='flex text-muted-foreground text-base sm:text-lg font-bold my-3 sm:my-4 py-3'>
                <span className='w-6 sm:w-8'>4 </span>
                <span>Terms and Conditions</span>
              </div>
            ) : null}
          </div>

          {isPaymentDetailsSelected && !isTermsAccepted && isPaymentMethodSelected && isEmailSelected && (
            <div className='mt-4 sm:mt-6'>
              <Card>
                <CardContent className='p-3 sm:p-4'>
                  <div className='flex text-primary text-base sm:text-lg font-bold my-2'>
                    <span className='w-6 sm:w-8'>4 </span>
                    <span>Terms and Conditions</span>
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
                      I agree to the{' '}
                      <Link href="/terms" className='text-purple-400 hover:underline'>
                        Terms and Conditions
                      </Link>
                    </label>
                  </div>
                  <Button
                    className='rounded-full w-full btn-mobile'
                    onClick={handleAcceptTerms}
                  >
                    Next
                  </Button>
                  <p className='text-xs text-center py-2 px-2'>
                    Please read and accept the terms and conditions
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
                    {isPlacingOrder ? 'Confirming Order...' : 'Confirm Order'}
                  </Button>
                  <div className='flex-1'>
                    <p className='font-bold text-base sm:text-lg'>
                      Total: <ProductPrice price={finalTotal} plain />
                      {appliedPromo && (
                        <span className='text-xs text-purple-400 ml-2'>
                          (Saved {appliedPromo.discountPercent}%)
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

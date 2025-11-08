import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import qs from 'query-string'

export function formUrlQuery({
  params,
  key,
  value,
}: {
  params: string
  key: string
  value: string | null
}) {
  const currentUrl = qs.parse(params)

  currentUrl[key] = value

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true }
  )
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumberWithDecimal = (num: number): string => {
  const [int, decimal] = num.toString().split('.')
  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : int
}
// PROMPT: [ChatGTP] create toSlug ts arrow function that convert text to lowercase, remove non-word,
// non-whitespace, non-hyphen characters, replace whitespace, trim leading hyphens and trim trailing hyphens

export const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')

// Arabic-compatible slug generation function
export const toSlugArabic = (text: string): string => {
  if (!text) return ''
  
  // Arabic to English transliteration mapping
  const arabicToEnglish: { [key: string]: string } = {
    'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
    'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'th',
    'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
    'ة': 'h', 'ء': 'a', 'ؤ': 'w', 'ئ': 'y',
    ' ': '-', '-': '-', '_': '-'
  }
  
  // Convert Arabic characters to English equivalents
  let slug = text
    .split('')
    .map(char => {
      const lowerChar = char.toLowerCase()
      return arabicToEnglish[lowerChar] || lowerChar
    })
    .join('')
  
  // Remove any remaining non-alphanumeric characters except hyphens
  slug = slug.replace(/[^a-z0-9-]/gi, '')
  
  // Replace multiple spaces/hyphens with single hyphen
  slug = slug.replace(/[\s-]+/g, '-')
  
  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '')
  
  // Remove multiple consecutive hyphens
  slug = slug.replace(/-+/g, '-')
  
  return slug.toLowerCase()
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-EG', {
  currency: 'EGP',
  style: 'currency',
  minimumFractionDigits: 2,
})
export function formatCurrency(amount: number) {
  return CURRENCY_FORMATTER.format(amount)
}

const NUMBER_FORMATTER = new Intl.NumberFormat('en-EG')
export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number)
}

export const round2 = (num: number) =>
  Math.round((num + Number.EPSILON) * 100) / 100

type CartItemForPromo = {
  product?: string
  productId?: string
  id?: string
  price: number
  quantity: number
}

type PromoApplicability = {
  discountPercent: number
  applicableProducts?: Array<{
    productId: string
    maxDiscountAmount?: number | null
  }>
}

export function calculatePromoDiscount(
  cartItems: CartItemForPromo[] | undefined,
  promo: PromoApplicability | null,
) {
  if (!Array.isArray(cartItems) || !promo || !promo.discountPercent) {
    return { discount: 0, eligibleItems: [] as string[] }
  }

  const percent = Number(promo.discountPercent)
  if (!percent || Number.isNaN(percent)) {
    return { discount: 0, eligibleItems: [] as string[] }
  }

  const applicableProducts = Array.isArray(promo.applicableProducts)
    ? promo.applicableProducts
    : []
  const restrictToSpecificProducts = applicableProducts.length > 0

  let totalDiscount = 0
  const eligibleItems: string[] = []

  cartItems.forEach((item) => {
    const quantity = Number(item?.quantity ?? 0)
    const price = Number(item?.price ?? 0)

    if (!price || !quantity) return

    const productId = String(
      item.product ?? item.productId ?? item.id ?? '',
    ).trim()
    if (!productId) return

    const productConfig = applicableProducts.find(
      (product) => product.productId === productId,
    )

    if (restrictToSpecificProducts && !productConfig) {
      return
    }

    const lineSubtotal = price * quantity
    let lineDiscount = (lineSubtotal * percent) / 100

    if (
      productConfig &&
      productConfig.maxDiscountAmount !== null &&
      productConfig.maxDiscountAmount !== undefined
    ) {
      const cap = Number(productConfig.maxDiscountAmount)
      if (!Number.isNaN(cap) && cap >= 0) {
        lineDiscount = Math.min(lineDiscount, cap)
      }
    }

    if (lineDiscount > 0) {
      totalDiscount += lineDiscount
      eligibleItems.push(productId)
    }
  })

  if (totalDiscount < 0) totalDiscount = 0

  return {
    discount: round2(totalDiscount),
    eligibleItems,
  }
}

export const isVariationSaleActive = (variation: any) => {
  const original = Number(variation?.originalPrice) || 0
  const sale = Number(variation?.price) || 0
  if (!(original > 0 && sale > 0 && sale < original)) {
    return false
  }
  const expiresAt = variation?.salePriceExpiresAt
  if (!expiresAt) return true
  const expiryDate = new Date(expiresAt)
  if (Number.isNaN(expiryDate.getTime())) return true
  return expiryDate.getTime() > Date.now()
}

export const getVariationPricing = (variation: any) => {
  const original = Number(variation?.originalPrice) || 0
  const sale = Number(variation?.price) || 0
  const saleActive = isVariationSaleActive(variation)

  if (saleActive) {
    return {
      currentPrice: sale,
      originalPrice: original,
      saleActive: true,
    }
  }

  const fallbackPrice = original > 0 ? original : sale
  return {
    currentPrice: fallbackPrice,
    originalPrice: 0,
    saleActive: false,
  }
}

export const generateId = () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 10)).join('')

export const formatError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'name' in error) {
    if (error.name === 'ZodError' && 'errors' in error && Array.isArray(error.errors)) {
      const fieldErrors = error.errors.map((err: unknown) => {
        if (err && typeof err === 'object' && 'path' in err && 'message' in err) {
          return `${err.path}: ${err.message}`
        }
        return 'Validation error'
      })
      return fieldErrors.join('. ')
    } else if (error.name === 'ValidationError' && 'errors' in error && typeof error.errors === 'object' && error.errors !== null) {
      const fieldErrors = Object.keys(error.errors).map((field) => {
        const err = (error.errors as Record<string, unknown>)[field]
        if (err && typeof err === 'object' && 'message' in err) {
          return err.message
        }
        return 'Validation error'
      })
      return fieldErrors.join('. ')
    } else if ('code' in error && error.code === 11000 && 'keyValue' in error && typeof error.keyValue === 'object' && error.keyValue !== null) {
      const duplicateField = Object.keys(error.keyValue)[0]
      return `${duplicateField} already exists`
    }
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return typeof error.message === 'string'
      ? error.message
      : JSON.stringify(error.message)
  }
  
  return 'Something went wrong. Please try again.'
}

export function calculateFutureDate(days: number) {
  const currentDate = new Date()
  currentDate.setDate(currentDate.getDate() + days)
  return currentDate
}
export function getMonthName(yearMonth: string): string {
  // Add safety checks
  if (!yearMonth || typeof yearMonth !== 'string') {
    console.warn('getMonthName: Invalid input:', yearMonth)
    return 'شهر غير معروف'
  }
  
  const parts = yearMonth.split('-')
  if (parts.length !== 2) {
    console.warn('getMonthName: Invalid format:', yearMonth)
    return 'شهر غير معروف'
  }
  
  const [year, month] = parts.map(Number)
  
  // Check if the parsed values are valid numbers
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    console.warn('getMonthName: Invalid year or month:', { year, month })
    return 'شهر غير معروف'
  }
  
  // Arabic month names
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ]
  
  const monthName = arabicMonths[month - 1]
  const now = new Date()

  if (year === now.getFullYear() && month === now.getMonth() + 1) {
    return `${monthName} (جاري)`
  }
  return monthName
}
export function calculatePastDate(days: number) {
  const currentDate = new Date()
  currentDate.setDate(currentDate.getDate() - days)
  return currentDate
}
export function timeUntilMidnight(): { hours: number; minutes: number } {
  const now = new Date()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0) // Set to 12:00 AM (next day)

  const diff = midnight.getTime() - now.getTime() // Difference in milliseconds
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { hours, minutes }
}

export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // abbreviated month name (e.g., 'Oct')
    day: 'numeric', // numeric day of the month (e.g., '25')
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  }
  const dateOptions: Intl.DateTimeFormatOptions = {
    // weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // numeric year (e.g., '2023')
    day: 'numeric', // numeric day of the month (e.g., '25')
  }
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  }
  const formattedDateTime: string = new Date(dateString).toLocaleString(
    'en-US',
    dateTimeOptions
  )
  const formattedDate: string = new Date(dateString).toLocaleString(
    'en-US',
    dateOptions
  )
  const formattedTime: string = new Date(dateString).toLocaleString(
    'en-US',
    timeOptions
  )
  return {
    dateTime: formattedDateTime,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  }
}

export function formatId(id: string | undefined | null) {
  if (!id) return 'N/A'
  return `..${id.substring(id.length - 6)}`
}

export const getFilterUrl = ({
  params,
  category,
  tag,
  sort,
  price,
  rating,
  page,
}: {
  params: {
    q?: string
    category?: string
    tag?: string | string[]
    price?: string
    rating?: string
    sort?: string
    page?: string
  }
  tag?: string | string[]
  category?: string
  sort?: string
  price?: string
  rating?: string
  page?: string
}) => {
  const newParams = { ...params }
  if (category !== undefined) newParams.category = category
  if (tag !== undefined) newParams.tag = tag
  if (price) newParams.price = price
  if (rating) newParams.rating = rating
  if (page) newParams.page = page
  if (sort) newParams.sort = sort
  
  // Handle array parameters properly
  const searchParams = new URLSearchParams()
  Object.entries(newParams).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v))
      } else {
        searchParams.set(key, value)
      }
    }
  })
  
  return `/search?${searchParams.toString()}`
}

/**
 * Safely formats a price value to 2 decimal places
 * Handles cases where price might be a Decimal, string, or undefined
 */
export const formatPrice = (price: any): string => {
  if (price === null || price === undefined) return '0.00'
  const numPrice = Number(price)
  if (isNaN(numPrice)) return '0.00'
  return numPrice.toFixed(2)
}

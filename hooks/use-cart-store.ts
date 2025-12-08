import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Cart, OrderItem, ShippingAddress } from '@/types'
import { calcDeliveryDateAndPrice } from '@/lib/actions/order.actions'
import { recalculateCartItemPrice } from '@/lib/utils'

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  paymentMethod: undefined,
  customerEmail: undefined,
  customerPhone: undefined,
  paymentNumber: undefined,
  transactionImage: undefined,
  shippingAddress: undefined,
  deliveryDateIndex: undefined,
}

interface CartState {
  cart: Cart
  cleanupInvalidItems: () => void
  regenerateClientIds: () => void
  recalculatePrices: () => Promise<void>
  addItem: (item: OrderItem, quantity: number) => Promise<string>
  updateItem: (item: OrderItem, quantity: number) => Promise<void>
  removeItem: (item: OrderItem) => void
  clearCart: () => void
  setShippingAddress: (shippingAddress: ShippingAddress) => Promise<void>
  setPaymentMethod: (paymentMethod: string) => void
  setCustomerEmail: (email: string) => void
  setCustomerPhone: (phone: string) => void
  setPaymentNumber: (number: string) => void
  setTransactionImage: (image: string) => void
  setDeliveryDateIndex: (index: number) => Promise<void>
}

const useCartStore = create(
  persist<CartState>(
    (set, get) => ({
      cart: initialState,
      
      // Clean up invalid cart items (items without clientId)
      cleanupInvalidItems: () => {
        const { items, shippingAddress } = get().cart
        const validItems = items.filter(item => item.clientId && item.clientId.trim() !== '')
        
        if (validItems.length !== items.length) {
          set({
            cart: {
              ...get().cart,
              items: validItems,
            }
          })
        }
      },

      // Regenerate clientIds for items that are missing them
      regenerateClientIds: () => {
        const { items, shippingAddress } = get().cart
        const updatedItems = items.map(item => ({
          ...item,
          clientId: item.clientId && item.clientId.trim() !== '' 
            ? item.clientId 
            : `${item.product}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }))
        
        if (JSON.stringify(updatedItems) !== JSON.stringify(items)) {
          set({
            cart: {
              ...get().cart,
              items: updatedItems,
            }
          })
        }
      },

      addItem: async (item: OrderItem, quantity: number) => {
        // Ensure clientId is provided
        if (!item.clientId || item.clientId.trim() === '') {
          throw new Error('clientId is required for cart items')
        }
        
        const { items, shippingAddress } = get().cart
        const existItem = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

        if (existItem) {
          if (existItem.countInStock < quantity + existItem.quantity) {
            throw new Error('Not enough items in stock')
          }
        } else {
          if (item.countInStock < item.quantity) {
            throw new Error('Not enough items in stock')
          }
        }

        // Add new item or update existing
        const updatedCartItems = existItem
          ? items.map((x) => {
              if (x.product === item.product &&
                  x.color === item.color &&
                  x.size === item.size) {
                // Update quantity
                return { ...existItem, quantity: existItem.quantity + quantity }
              }
              return x
            })
          : [...items, { ...item, quantity, price: Number(item.price || 0) }] // Ensure price is a number

        // Recalculate prices based on current product data
        const priceCalcResult = await calcDeliveryDateAndPrice({
          items: updatedCartItems,
          shippingAddress,
        })
        
        // Update cart items with recalculated prices
        const finalCartItems = priceCalcResult.updatedItems || updatedCartItems

        set({
          cart: {
            ...get().cart,
            items: finalCartItems,
            itemsPrice: priceCalcResult.itemsPrice,
            shippingPrice: priceCalcResult.shippingPrice,
            taxPrice: priceCalcResult.taxPrice,
            totalPrice: priceCalcResult.totalPrice,
            availableDeliveryDates: priceCalcResult.availableDeliveryDates,
            deliveryDateIndex: priceCalcResult.deliveryDateIndex,
            expectedDeliveryDate: priceCalcResult.expectedDeliveryDate,
          },
        })
        const foundItem = updatedCartItems.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )
        if (!foundItem) {
          throw new Error('Item not found in cart')
        }
        return foundItem.clientId
      },
      updateItem: async (item: OrderItem, quantity: number) => {
        const { items, shippingAddress } = get().cart
        const exist = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )
        if (!exist) return
        
        // Update quantity
        const updatedCartItems = items.map((x) => {
          if (x.product === item.product &&
              x.color === item.color &&
              x.size === item.size) {
            return { ...exist, quantity: quantity }
          }
          return x
        })
        
        // Recalculate prices based on current product data
        const priceCalcResult = await calcDeliveryDateAndPrice({
          items: updatedCartItems,
          shippingAddress,
        })
        
        // Update cart items with recalculated prices
        const finalCartItems = priceCalcResult.updatedItems || updatedCartItems
        
        set({
          cart: {
            ...get().cart,
            items: finalCartItems,
            itemsPrice: priceCalcResult.itemsPrice,
            shippingPrice: priceCalcResult.shippingPrice,
            taxPrice: priceCalcResult.taxPrice,
            totalPrice: priceCalcResult.totalPrice,
            availableDeliveryDates: priceCalcResult.availableDeliveryDates,
            deliveryDateIndex: priceCalcResult.deliveryDateIndex,
            expectedDeliveryDate: priceCalcResult.expectedDeliveryDate,
          },
        })
      },
      removeItem: async (item: OrderItem) => {
        const { items, shippingAddress } = get().cart
        const updatedCartItems = items.filter(
          (x) =>
            x.product !== item.product ||
            x.color !== item.color ||
            x.size !== item.size
        )
        
        // Recalculate prices based on current product data
        const priceCalcResult = await calcDeliveryDateAndPrice({
          items: updatedCartItems,
          shippingAddress,
        })
        
        // Update cart items with recalculated prices
        const finalCartItems = priceCalcResult.updatedItems || updatedCartItems
        
        set({
          cart: {
            ...get().cart,
            items: finalCartItems,
            itemsPrice: priceCalcResult.itemsPrice,
            shippingPrice: priceCalcResult.shippingPrice,
            taxPrice: priceCalcResult.taxPrice,
            totalPrice: priceCalcResult.totalPrice,
            availableDeliveryDates: priceCalcResult.availableDeliveryDates,
            deliveryDateIndex: priceCalcResult.deliveryDateIndex,
            expectedDeliveryDate: priceCalcResult.expectedDeliveryDate,
          },
        })
      },
      setShippingAddress: async (shippingAddress: ShippingAddress) => {
        const { items } = get().cart
        
        // Recalculate prices based on current product data
        const priceCalcResult = await calcDeliveryDateAndPrice({
          items,
          shippingAddress,
        })
        
        // Update cart items with recalculated prices
        const finalCartItems = priceCalcResult.updatedItems || items
        
        set({
          cart: {
            ...get().cart,
            shippingAddress,
            items: finalCartItems,
            itemsPrice: priceCalcResult.itemsPrice,
            shippingPrice: priceCalcResult.shippingPrice,
            taxPrice: priceCalcResult.taxPrice,
            totalPrice: priceCalcResult.totalPrice,
            availableDeliveryDates: priceCalcResult.availableDeliveryDates,
            deliveryDateIndex: priceCalcResult.deliveryDateIndex,
            expectedDeliveryDate: priceCalcResult.expectedDeliveryDate,
          },
        })
      },
      setPaymentMethod: (paymentMethod: string) => {
        set({
          cart: {
            ...get().cart,
            paymentMethod,
          },
        })
      },
      setCustomerEmail: (email: string) => {
        set({
          cart: {
            ...get().cart,
            customerEmail: email,
          },
        })
      },
      setCustomerPhone: (phone: string) => {
        set({
          cart: {
            ...get().cart,
            customerPhone: phone,
          },
        })
      },
      setPaymentNumber: (number: string) => {
        set({
          cart: {
            ...get().cart,
            paymentNumber: number,
          },
        })
      },
      setTransactionImage: (image: string) => {
        set({
          cart: {
            ...get().cart,
            transactionImage: image,
          },
        })
      },
      setDeliveryDateIndex: async (index: number) => {
        const { items, shippingAddress } = get().cart
        
        // Recalculate prices based on current product data
        const priceCalcResult = await calcDeliveryDateAndPrice({
          items,
          shippingAddress,
          deliveryDateIndex: index,
        })
        
        // Update cart items with recalculated prices
        const finalCartItems = priceCalcResult.updatedItems || items

        set({
          cart: {
            ...get().cart,
            items: finalCartItems,
            itemsPrice: priceCalcResult.itemsPrice,
            shippingPrice: priceCalcResult.shippingPrice,
            taxPrice: priceCalcResult.taxPrice,
            totalPrice: priceCalcResult.totalPrice,
            availableDeliveryDates: priceCalcResult.availableDeliveryDates,
            deliveryDateIndex: priceCalcResult.deliveryDateIndex,
            expectedDeliveryDate: priceCalcResult.expectedDeliveryDate,
          },
        })
      },
      recalculatePrices: async () => {
        const { items, shippingAddress } = get().cart
        if (items.length === 0) return
        
        // Recalculate prices based on current product data
        const priceCalcResult = await calcDeliveryDateAndPrice({
          items,
          shippingAddress,
        })
        
        // Update cart items with recalculated prices
        const finalCartItems = priceCalcResult.updatedItems || items
        
        set({
          cart: {
            ...get().cart,
            items: finalCartItems,
            itemsPrice: priceCalcResult.itemsPrice,
            shippingPrice: priceCalcResult.shippingPrice,
            taxPrice: priceCalcResult.taxPrice,
            totalPrice: priceCalcResult.totalPrice,
            availableDeliveryDates: priceCalcResult.availableDeliveryDates,
            deliveryDateIndex: priceCalcResult.deliveryDateIndex,
            expectedDeliveryDate: priceCalcResult.expectedDeliveryDate,
          },
        })
      },
      clearCart: () => {
        set({
          cart: {
            ...get().cart,
            items: [],
          },
        })
      },
      init: () => set({ cart: initialState }),
    }),

    {
      name: 'cart-store',
      partialize: (state) => {
        const { customerEmail, customerPhone, paymentNumber, transactionImage, ...restCart } = state.cart
        return {
          cart: {
            ...restCart,
          },
        }
      },
    }
  )
)
export default useCartStore

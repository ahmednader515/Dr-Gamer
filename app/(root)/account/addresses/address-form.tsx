'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ShippingAddressSchema, ShippingAddress } from '@/lib/validator'
import { createAddress, updateAddress } from '@/lib/actions/address.actions'

interface AddressFormProps {
  mode: 'create' | 'edit'
  addressIndex?: number
}

const countries = [
  'Egypt',
  'Saudi Arabia',
  'United Arab Emirates',
  'Kuwait',
  'Qatar',
  'Bahrain',
  'Oman',
  'Jordan',
  'Lebanon',
  'Syria',
  'Iraq',
  'Palestine',
  'Yemen',
  'Sudan',
  'Morocco',
  'Algeria',
  'Tunisia',
  'Libya',
  'Mauritania',
  'Somalia',
  'Djibouti',
  'Comoros',
  'Other'
]

const provinces = [
  'Cairo',
  'Giza',
  'Alexandria',
  'Asyut',
  'Sohag',
  'Qena',
  'Luxor',
  'Aswan',
  'Beni Suef',
  'Minya',
  'Fayoum',
  'New Valley',
  'Red Sea',
  'North Sinai',
  'South Sinai',
  'Matrouh',
  'Kafr El Sheikh',
  'Gharbia',
  'Monufia',
  'Sharqia',
  'Dakahlia',
  'Damietta',
  'Port Said',
  'Ismailia',
  'Suez',
  'Other'
]

export default function AddressForm({ mode, addressIndex }: AddressFormProps) {
  const router = useRouter()
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof ShippingAddressSchema>>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: {
      fullName: '',
      street: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Egypt',
      phone: '',
    },
  })

  useEffect(() => {
    if (mode === 'edit' && addressIndex !== undefined && session?.user?.addresses) {
      const address = session.user.addresses[addressIndex]
      if (address) {
        form.reset(address)
      }
    }
  }, [mode, addressIndex, session, form])

  const onSubmit = async (values: z.infer<typeof ShippingAddressSchema>) => {
    setLoading(true)
    try {
      let result
      
      if (mode === 'create') {
        result = await createAddress(values)
      } else {
        result = await updateAddress(addressIndex!, values)
      }

      if (result.success) {
        toast({
          description: result.message,
        })

        // Update session with new addresses
        const currentAddresses = session?.user?.addresses || []
        let newAddresses
        
        if (mode === 'create') {
          newAddresses = [...currentAddresses, { ...values, isDefault: currentAddresses.length === 0 }]
        } else {
          newAddresses = currentAddresses.map((addr, i) => 
            i === addressIndex ? { ...values, isDefault: addr.isDefault } : addr
          )
        }

        const newSession = {
          ...session,
          user: {
            ...session?.user,
            addresses: newAddresses,
          },
        }
        await update(newSession)

        // Update local storage
        localStorage.setItem('userAddresses', JSON.stringify(newAddresses))

        router.push('/account/addresses')
      } else {
        toast({
          variant: 'destructive',
          description: result.message,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while saving the address',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='fullName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder='Enter full name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input placeholder='Enter phone number' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='street'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address *</FormLabel>
              <FormControl>
                <Input placeholder='Enter detailed address' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <FormField
            control={form.control}
            name='city'
            render={({ field }) => (
              <FormItem>
                <FormLabel>City *</FormLabel>
                <FormControl>
                  <Input placeholder='Enter city' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='province'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Province/State *</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value=''>Select province</option>
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='postalCode'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code *</FormLabel>
                <FormControl>
                  <Input placeholder='Enter postal code' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='country'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country *</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex gap-4 pt-4'>
          <Button
            type='submit'
            disabled={loading}
            className='flex-1'
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Add Address' : 'Save Changes'}
          </Button>
          
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/account/addresses')}
            className='flex-1'
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}

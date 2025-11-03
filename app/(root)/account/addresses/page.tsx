import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, MapPin, Edit, Trash2, Star } from 'lucide-react'
import AddressList from './address-list'

export const metadata: Metadata = {
  title: 'Manage Addresses',
}

export default async function AddressesPage() {
  const session = await auth()
  if (!session) redirect('/sign-in')
  
  return (
    <div className='mb-24'>
      <div className='flex gap-2 '>
        <Link href='/account'>Your Account</Link>
        <span>›</span>
        <span>Addresses</span>
      </div>
      <h1 className='h1-bold py-4'>Manage Addresses</h1>
      
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-semibold text-white'>Shipping Addresses</h2>
            <p className='text-sm text-muted-foreground'>
              Manage your shipping addresses
            </p>
          </div>
          <Button asChild>
            <Link href='/account/addresses/create'>
              <Plus className='h-4 w-4 mr-2' />
              Add New Address
            </Link>
          </Button>
        </div>
        
        <AddressList />
      </div>
    </div>
  )
}

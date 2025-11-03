import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import AddressForm from '../address-form'

export const metadata: Metadata = {
  title: 'Add New Address',
}

export default async function CreateAddressPage() {
  const session = await auth()
  if (!session) redirect('/sign-in')
  
  return (
    <div className='mb-24'>
      <div className='flex gap-2 '>
        <Link href='/account'>Your Account</Link>
        <span>›</span>
        <Link href='/account/addresses'>Addresses</Link>
        <span>›</span>
        <span>Add New Address</span>
      </div>
      
      <div className='flex items-center gap-4 mb-6'>
        <Button asChild variant='ghost' size='sm'>
          <Link href='/account/addresses'>
            <ArrowLeft className='h-4 w-4 mr-1' />
            Back to Addresses
          </Link>
        </Button>
        <h1 className='h1-bold'>Add New Address</h1>
      </div>
      
      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm mode='create' />
        </CardContent>
      </Card>
    </div>
  )
}

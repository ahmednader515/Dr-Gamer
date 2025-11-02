'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'
import DeleteDialog from '@/components/shared/delete-dialog'

type PromoCode = {
  id: string
  code: string
  discountPercent: number
  isActive: boolean
  expiresAt: Date | null
  usageLimit: number | null
  usageCount: number
  createdAt: Date
}

export default function PromoCodesList({ initialPromoCodes }: { initialPromoCodes: PromoCode[] }) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(initialPromoCodes)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    code: '',
    discountPercent: '',
    expiresAt: '',
    usageLimit: '',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        })
        setPromoCodes([result.data, ...promoCodes])
        setFormData({ code: '', discountPercent: '', expiresAt: '', usageLimit: '' })
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error creating promo code',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/promo-codes/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        })
        setPromoCodes(promoCodes.filter((code) => code.id !== id))
        return { success: true, message: result.message }
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
        return { success: false, message: result.message }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error deleting promo code',
        variant: 'destructive',
      })
      return { success: false, message: 'An error occurred' }
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })

      const result = await response.json()

      if (result.success) {
        setPromoCodes(
          promoCodes.map((code) =>
            code.id === id ? { ...code, isActive } : code
          )
        )
        toast({
          title: 'Success',
          description: result.message,
        })
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error updating code',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className='space-y-6 ltr text-left' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <h1 className='h1-bold text-white'>Manage Promo Codes</h1>

      {/* Create Promo Code Form */}
      <Card className='border-2 border-purple-600 bg-gray-900'>
        <CardHeader>
          <CardTitle className='text-white'>Create New Promo Code</CardTitle>
          <CardDescription className='text-gray-300'>Add a new discount code for customers</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='code' className='text-white'>Code *</Label>
                <Input
                  id='code'
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder='Example: SUMMER2024'
                  required
                  className='bg-gray-800 text-white border-gray-700'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='discountPercent' className='text-white'>Discount Percentage (%) *</Label>
                <Input
                  id='discountPercent'
                  type='number'
                  min='1'
                  max='100'
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                  placeholder='Example: 20'
                  required
                  className='bg-gray-800 text-white border-gray-700'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='expiresAt' className='text-white'>Expiry Date (Optional)</Label>
                <Input
                  id='expiresAt'
                  type='datetime-local'
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className='bg-gray-800 text-white border-gray-700'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='usageLimit' className='text-white'>Usage Limit (Optional)</Label>
                <Input
                  id='usageLimit'
                  type='number'
                  min='1'
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder='Example: 100'
                  className='bg-gray-800 text-white border-gray-700'
                />
              </div>
            </div>

            <Button type='submit' disabled={isCreating} className='bg-purple-600 hover:bg-purple-700'>
              {isCreating ? 'Creating...' : 'Create Promo Code'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Promo Codes List */}
      <Card className='border-2 border-purple-600 bg-gray-900'>
        <CardHeader>
          <CardTitle className='text-white'>Current Promo Codes</CardTitle>
          <CardDescription className='text-gray-300'>
            Total Codes: {promoCodes.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table className='admin-table border border-gray-700 rounded-lg'>
              <TableHeader>
                <TableRow className='bg-gray-800 border-b-2 border-gray-700'>
                  <TableHead className='text-left text-purple-400'>Code</TableHead>
                  <TableHead className='text-left text-purple-400'>Discount</TableHead>
                  <TableHead className='text-left text-purple-400'>Status</TableHead>
                  <TableHead className='text-left text-purple-400'>Usage</TableHead>
                  <TableHead className='text-left text-purple-400'>Expires</TableHead>
                  <TableHead className='text-left text-purple-400'>Created</TableHead>
                  <TableHead className='text-left text-purple-400'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((code) => (
                  <TableRow key={code.id} className='bg-gray-800 hover:bg-gray-700 border-b border-gray-700'>
                    <TableCell className='font-bold text-white'>{code.code}</TableCell>
                    <TableCell className='text-purple-400'>{code.discountPercent}%</TableCell>
                    <TableCell>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleToggleActive(code.id, !code.isActive)}
                        className={`min-w-[100px] ${
                          code.isActive
                            ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        }`}
                      >
                        {code.isActive ? '✓ Active' : '✕ Inactive'}
                      </Button>
                    </TableCell>
                    <TableCell className='text-gray-300'>
                      {code.usageCount} / {code.usageLimit || '∞'}
                    </TableCell>
                    <TableCell className='text-gray-300'>
                      {code.expiresAt
                        ? formatDateTime(new Date(code.expiresAt)).dateTime
                        : 'No limit'}
                    </TableCell>
                    <TableCell className='text-gray-300'>
                      {formatDateTime(new Date(code.createdAt)).dateTime}
                    </TableCell>
                    <TableCell>
                      <DeleteDialog id={code.id} action={handleDelete} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {promoCodes.length === 0 && (
            <div className='text-center py-8 text-gray-400'>
              No promo codes currently
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


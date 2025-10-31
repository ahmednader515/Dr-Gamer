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
          title: 'نجح',
          description: result.message,
        })
        setPromoCodes([result.data, ...promoCodes])
        setFormData({ code: '', discountPercent: '', expiresAt: '', usageLimit: '' })
      } else {
        toast({
          title: 'خطأ',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في إنشاء كود الخصم',
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
          title: 'نجح',
          description: result.message,
        })
        setPromoCodes(promoCodes.filter((code) => code.id !== id))
        return { success: true, message: result.message }
      } else {
        toast({
          title: 'خطأ',
          description: result.message,
          variant: 'destructive',
        })
        return { success: false, message: result.message }
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حذف كود الخصم',
        variant: 'destructive',
      })
      return { success: false, message: 'حدث خطأ' }
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
          title: 'نجح',
          description: result.message,
        })
      } else {
        toast({
          title: 'خطأ',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحديث الكود',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className='space-y-6 rtl text-right' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <h1 className='h1-bold text-white'>إدارة أكواد الخصم</h1>

      {/* Create Promo Code Form */}
      <Card className='border-2 border-purple-600 bg-gray-900'>
        <CardHeader>
          <CardTitle className='text-white'>إنشاء كود خصم جديد</CardTitle>
          <CardDescription className='text-gray-300'>أضف كود خصم جديد للعملاء</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='code' className='text-white'>الكود *</Label>
                <Input
                  id='code'
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder='مثال: SUMMER2024'
                  required
                  className='bg-gray-800 text-white border-gray-700'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='discountPercent' className='text-white'>نسبة الخصم (%) *</Label>
                <Input
                  id='discountPercent'
                  type='number'
                  min='1'
                  max='100'
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                  placeholder='مثال: 20'
                  required
                  className='bg-gray-800 text-white border-gray-700'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='expiresAt' className='text-white'>تاريخ الانتهاء (اختياري)</Label>
                <Input
                  id='expiresAt'
                  type='datetime-local'
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className='bg-gray-800 text-white border-gray-700'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='usageLimit' className='text-white'>حد الاستخدام (اختياري)</Label>
                <Input
                  id='usageLimit'
                  type='number'
                  min='1'
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder='مثال: 100'
                  className='bg-gray-800 text-white border-gray-700'
                />
              </div>
            </div>

            <Button type='submit' disabled={isCreating} className='bg-purple-600 hover:bg-purple-700'>
              {isCreating ? 'جاري الإنشاء...' : 'إنشاء كود الخصم'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Promo Codes List */}
      <Card className='border-2 border-purple-600 bg-gray-900'>
        <CardHeader>
          <CardTitle className='text-white'>أكواد الخصم الحالية</CardTitle>
          <CardDescription className='text-gray-300'>
            إجمالي الأكواد: {promoCodes.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table className='admin-table border border-gray-700 rounded-lg'>
              <TableHeader>
                <TableRow className='bg-gray-800 border-b-2 border-gray-700'>
                  <TableHead className='text-right text-purple-400'>الكود</TableHead>
                  <TableHead className='text-right text-purple-400'>الخصم</TableHead>
                  <TableHead className='text-right text-purple-400'>الحالة</TableHead>
                  <TableHead className='text-right text-purple-400'>الاستخدام</TableHead>
                  <TableHead className='text-right text-purple-400'>الانتهاء</TableHead>
                  <TableHead className='text-right text-purple-400'>تاريخ الإنشاء</TableHead>
                  <TableHead className='text-right text-purple-400'>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((code) => (
                  <TableRow key={code.id} className='border-b border-gray-700'>
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
                        {code.isActive ? '✓ نشط' : '✕ غير نشط'}
                      </Button>
                    </TableCell>
                    <TableCell className='text-gray-300'>
                      {code.usageCount} / {code.usageLimit || '∞'}
                    </TableCell>
                    <TableCell className='text-gray-300'>
                      {code.expiresAt
                        ? formatDateTime(new Date(code.expiresAt)).dateTime
                        : 'بلا حد'}
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
              لا توجد أكواد خصم حالياً
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


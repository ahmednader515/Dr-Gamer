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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import ProductPrice from '@/components/shared/product/product-price'

type ProductOption = {
  id: string
  name: string
  price: number
}

type PromoCodeProductLink = {
  productId: string
  maxDiscountAmount: number | null
  product: ProductOption
}

type PromoCode = {
  id: string
  code: string
  discountPercent: number
  isActive: boolean
  expiresAt: string | null
  usageLimit: number | null
  usageCount: number
  createdAt: string
  applicableProducts: PromoCodeProductLink[]
}

type PromoCodesListProps = {
  initialPromoCodes: PromoCode[]
  products: ProductOption[]
}

type SelectedProduct = ProductOption & {
  maxDiscountAmount: string
}

export default function PromoCodesList({ initialPromoCodes, products }: PromoCodesListProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(initialPromoCodes)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    code: '',
    discountPercent: '',
    expiresAt: '',
    usageLimit: '',
  })
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          products: selectedProducts.map((product) => ({
            productId: product.id,
            maxDiscountAmount: product.maxDiscountAmount
              ? parseFloat(product.maxDiscountAmount)
              : null,
          })),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        })
        setPromoCodes([result.data, ...promoCodes])
        setFormData({ code: '', discountPercent: '', expiresAt: '', usageLimit: '' })
        setSelectedProducts([])
        setSelectedProductId('')
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

  const handleAddProduct = () => {
    if (!selectedProductId) return
    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return
    const exists = selectedProducts.some((p) => p.id === product.id)
    if (exists) {
      toast({
        title: 'Notice',
        description: 'This product is already added to the promo code.',
      })
      return
    }
    setSelectedProducts((prev) => [
      ...prev,
      {
        ...product,
        maxDiscountAmount: product.price ? product.price.toString() : '',
      },
    ])
    setSelectedProductId('')
  }

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((product) => product.id !== productId))
  }

  const handleMaxDiscountChange = (productId: string, value: string) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, maxDiscountAmount: value }
          : product,
      ),
    )
  }

  const formatProductPrice = (price: number) =>
    Number.isFinite(price) ? price : Number(price || 0)

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

            <div className='space-y-3 border-t border-gray-800 pt-4'>
              <div className='space-y-2'>
                <Label className='text-white'>Apply to Specific Products (optional)</Label>
                <p className='text-xs text-gray-400'>
                  Select one or more products that this promo code should work with. Leave empty to allow the code for any product.
                </p>
                <div className='flex flex-col sm:flex-row gap-2'>
                  <Select
                    value={selectedProductId}
                    onValueChange={setSelectedProductId}
                  >
                    <SelectTrigger className='bg-gray-800 text-white border-gray-700 sm:w-80'>
                      <SelectValue placeholder='Select a product' />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => {
                        const isSelected = selectedProducts.some((p) => p.id === product.id)
                        return (
                          <SelectItem
                            key={product.id}
                            value={product.id}
                            disabled={isSelected}
                          >
                            {product.name}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    type='button'
                    variant='outline'
                    className='bg-purple-600/20 border-purple-600 text-purple-200 hover:bg-purple-600/30'
                    onClick={handleAddProduct}
                    disabled={!selectedProductId}
                  >
                    Add Product
                  </Button>
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div className='space-y-3'>
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3'
                    >
                      <div>
                        <p className='text-white font-medium'>{product.name}</p>
                        <p className='text-xs text-gray-400'>
                          Price: <ProductPrice price={formatProductPrice(product.price)} plain />
                        </p>
                      </div>
                      <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
                        <div className='space-y-1'>
                          <Label className='text-sm text-gray-300'>
                            Max Discount Amount (EGP)
                          </Label>
                          <Input
                            type='number'
                            min='0'
                            step='0.01'
                            value={product.maxDiscountAmount}
                            onChange={(event) =>
                              handleMaxDiscountChange(product.id, event.target.value)
                            }
                            className='bg-gray-900 border-gray-700 text-white w-full sm:w-36'
                            placeholder='No limit'
                          />
                        </div>
                        <p className='text-xs text-gray-400 sm:w-40'>
                          Leave empty for no limit.
                        </p>
                        <Button
                          type='button'
                          variant='ghost'
                          className='text-red-400 hover:text-red-300 hover:bg-red-900/20'
                          onClick={() => handleRemoveProduct(product.id)}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  <TableHead className='text-left text-purple-400'>Products</TableHead>
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
                    <TableCell className='text-gray-300'>
                      {code.applicableProducts.length === 0 ? (
                        <span className='text-sm text-gray-400'>All products</span>
                      ) : (
                        <div className='space-y-2'>
                          {code.applicableProducts.map((product) => (
                            <div key={`${code.id}-${product.productId}`} className='flex flex-col text-sm'>
                              <span className='font-medium text-white'>
                                {product.product.name}
                              </span>
                              <span className='text-xs text-gray-400'>
                                Price:{' '}
                                <ProductPrice
                                  price={formatProductPrice(product.product.price)}
                                  plain
                                />
                              </span>
                              {product.maxDiscountAmount !== null ? (
                                <span className='text-xs text-purple-300'>
                                  Max discount:{' '}
                                  <ProductPrice
                                    price={formatProductPrice(product.maxDiscountAmount)}
                                    plain
                                  />
                                </span>
                              ) : (
                                <span className='text-xs text-gray-500'>No max limit</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
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


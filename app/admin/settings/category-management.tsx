'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  getAllCategories
} from '@/lib/actions/category.actions'
import { toSlug } from '@/lib/utils'
import { Edit, Trash2, Plus } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'
import Image from 'next/image'

const CategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  slug: z.string().min(2, 'Category slug must be at least 2 characters'),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
})

type CategoryFormData = z.infer<typeof CategorySchema>

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image: '',
      isActive: true,
    },
  })

  // Load categories
  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const data = await getAllCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل الفئات',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // Handle form submission
  const onSubmit = async (data: CategoryFormData) => {
    try {
      let result
      
      if (editingCategory) {
        result = await updateCategory({ ...data, id: editingCategory.id })
      } else {
        result = await createCategory(data)
      }

      if (result.success) {
        toast({
          title: 'نجح',
          description: result.message,
        })
        setIsDialogOpen(false)
        setEditingCategory(null)
        form.reset()
        loadCategories()
      } else {
        toast({
          title: 'خطأ',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error submitting category:', error)
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الفئة',
        variant: 'destructive',
      })
    }
  }

  // Handle delete
  const handleDelete = async (category: Category) => {
    try {
      const result = await deleteCategory(category.id)
      
      if (result.success) {
        toast({
          title: 'نجح',
          description: result.message,
        })
        loadCategories()
      } else {
        toast({
          title: 'خطأ',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الفئة',
        variant: 'destructive',
      })
    }
  }

  // Handle edit
  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsUploading(false)
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      isActive: category.isActive,
    })
    setIsDialogOpen(true)
  }

  // Handle new category
  const handleNew = () => {
    setEditingCategory(null)
    setIsUploading(false)
    form.reset({
      name: '',
      slug: '',
      description: '',
      image: '',
      isActive: true,
    })
    setIsDialogOpen(true)
  }





  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = toSlug(name)
    form.setValue('slug', slug)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الفئات</h2>
          <p className="text-muted-foreground">
            قم بإدارة فئات المنتجات في المتجر
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleNew}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة فئة جديدة
          </Button>
        </div>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>الفئات الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد فئات حالياً
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {category.image && (
                        <div className="relative w-12 h-12 border rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        {!category.isActive && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            غير نشط
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description || 'لا يوجد وصف'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleEdit(category)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      تعديل
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          حذف
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف الفئة "{category.name}"؟ 
                            لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(category)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) {
          setIsUploading(false)
        }
      }}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الفئة</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          handleNameChange(e.target.value)
                        }}
                        placeholder="أدخل اسم الفئة"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رابط الفئة</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أدخل رابط الفئة"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="أدخل وصف الفئة (اختياري)"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صورة الفئة</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {field.value && (
                          <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                            <Image
                              src={field.value}
                              alt="Category preview"
                              fill
                              className="object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-5 w-5 p-0 text-xs"
                              onClick={() => field.onChange('')}
                            >
                              ×
                            </Button>
                          </div>
                        )}
                        <div className={`border-2 border-dashed rounded-lg p-3 text-center ${
                          isUploading ? 'border-purple-300 bg-purple-50' : 'border-gray-300'
                        }`}>
                          <UploadButton
                            endpoint="imageUploader"
                            onUploadBegin={() => {
                              setIsUploading(true)
                            }}
                            onClientUploadComplete={(res: { url: string }[]) => {
                              field.onChange(res[0].url)
                              setIsUploading(false)
                            }}
                            onUploadError={(error: Error) => {
                              setIsUploading(false)
                              toast({
                                variant: 'destructive',
                                description: `خطأ في رفع الصورة: ${error.message}`,
                              })
                            }}
                            content={{
                              button: isUploading ? 'جاري الرفع...' : (field.value ? 'تغيير الصورة' : 'رفع صورة الفئة'),
                              allowedContent: 'PNG, JPG, GIF حتى 4MB',
                            }}
                          />
                          {isUploading && (
                            <p className="text-xs text-purple-600 mt-2">
                              جاري رفع الصورة، يرجى الانتظار...
                            </p>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>فئة نشطة</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              </form>
            </Form>
          </div>
          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isUploading}
            >
              إلغاء
            </Button>
            <Button 
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isUploading}
            >
              {isUploading ? 'جاري الرفع...' : (editingCategory ? 'تحديث' : 'إنشاء')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

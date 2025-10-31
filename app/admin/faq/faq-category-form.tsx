'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createFAQCategory, updateFAQCategory } from '@/lib/actions/faq.actions'
import { Checkbox } from '@/components/ui/checkbox'
import { toSlug } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { createFAQQuestion, deleteFAQQuestion, updateFAQQuestion } from '@/lib/actions/faq.actions'

const FAQCategoryFormSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
  slug: z.string().min(3, 'الرابط يجب أن يكون 3 أحرف على الأقل'),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})

const FAQQuestionFormSchema = z.object({
  question: z.string().min(1, 'السؤال مطلوب'),
  answer: z.string().min(1, 'الإجابة مطلوبة'),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})

const FAQCategoryForm = ({
  type,
  category,
  categoryId,
}: {
  type: 'Create' | 'Update'
  category?: any
  categoryId?: string
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [questions, setQuestions] = useState<any[]>(category?.questions || [])
  const [expandedQuestions, setExpandedQuestions] = useState<{ [key: string]: boolean }>({})

  const form = useForm<z.infer<typeof FAQCategoryFormSchema>>({
    resolver: zodResolver(FAQCategoryFormSchema),
    defaultValues: category || {
      title: '',
      slug: '',
      sortOrder: 0,
      isActive: true,
    },
  })

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }))
  }

  const addQuestion = () => {
    const newQuestion = {
      id: `temp-${Date.now()}`,
      question: '',
      answer: '',
      sortOrder: questions.length,
      isActive: true,
      isNew: true,
    }
    setQuestions([...questions, newQuestion])
    setExpandedQuestions(prev => ({ ...prev, [newQuestion.id]: true }))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  async function onSubmit(values: z.infer<typeof FAQCategoryFormSchema>) {
    if (!categoryId && type === 'Update') {
      toast({
        variant: 'destructive',
        description: 'خطأ في معرّف الفئة',
      })
      return
    }

    // Create or update category
    let result
    if (type === 'Create') {
      result = await createFAQCategory(values)
      if (!result.success) {
        toast({
          variant: 'destructive',
          description: result.message,
        })
        return
      }
      
      // If we have questions to add and got the category ID
      if (questions.length > 0 && result.categoryId) {
        for (const question of questions) {
          if (question.isNew) {
            await createFAQQuestion({
              categoryId: result.categoryId,
              question: question.question,
              answer: question.answer,
              sortOrder: question.sortOrder,
              isActive: question.isActive,
            })
          }
        }
      }
      
      toast({
        description: result.message,
      })
      router.push('/admin/faq')
    } else {
      result = await updateFAQCategory(categoryId!, values)
      if (!result.success) {
        toast({
          variant: 'destructive',
          description: result.message,
        })
        return
      }

      // Update existing questions
      for (const question of questions) {
        if (question.isNew && categoryId) {
          // Create new question
          await createFAQQuestion({
            categoryId,
            question: question.question,
            answer: question.answer,
            sortOrder: question.sortOrder,
            isActive: question.isActive,
          })
        } else if (!question.isNew && question.id) {
          // Update existing question
          await updateFAQQuestion(question.id, {
            question: question.question,
            answer: question.answer,
            sortOrder: question.sortOrder,
            isActive: question.isActive,
          })
        }
      }

      toast({
        description: result.message,
      })
      router.push('/admin/faq')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        {/* Category Info */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الفئة</CardTitle>
            <CardDescription>أدخل معلومات فئة الأسئلة الشائعة</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='flex flex-col gap-5 md:flex-row'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-right'>العنوان</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder='مثال: الطلبات والتوصيل' 
                        className='text-right' 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          const generatedSlug = toSlug(e.target.value)
                          form.setValue('slug', generatedSlug)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='slug'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-right'>الرابط</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='سيتم توليد الرابط تلقائياً'
                        className='text-right bg-gray-800 text-gray-200 border-gray-700'
                        readOnly
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='flex flex-col gap-5 md:flex-row'>
              <FormField
                control={form.control}
                name='sortOrder'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-right'>ترتيب العرض</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        className='text-right'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='space-x-2 items-center flex-row-reverse flex'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className='text-right'>نشط</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions Management */}
        {(categoryId || true) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>الأسئلة</CardTitle>
                  <CardDescription>إدارة الأسئلة لهذه الفئة</CardDescription>
                </div>
                <Button type='button' onClick={addQuestion} size='sm' className='bg-purple-600 hover:bg-purple-700'>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة سؤال
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {questions.map((question, index) => (
                  <div key={question.id} className='border border-gray-700 rounded-lg p-4 bg-gray-900'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center gap-2 text-purple-400 font-medium'>
                        السؤال #{index + 1}
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleQuestionExpansion(question.id)}
                        >
                          {expandedQuestions[question.id] ? (
                            <ChevronUp className='h-4 w-4' />
                          ) : (
                            <ChevronDown className='h-4 w-4' />
                          )}
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeQuestion(question.id)}
                          className='text-red-400 hover:text-red-300'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>

                    {expandedQuestions[question.id] && (
                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-300 mb-2'>
                            السؤال
                          </label>
                          <input
                            type='text'
                            value={question.question}
                            onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                            className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500'
                            placeholder='أدخل السؤال...'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-300 mb-2'>
                            الإجابة
                          </label>
                          <textarea
                            value={question.answer}
                            onChange={(e) => updateQuestion(question.id, 'answer', e.target.value)}
                            className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 min-h-[100px]'
                            placeholder='أدخل الإجابة...'
                          />
                        </div>

                        <div className='flex gap-4'>
                          <div className='flex-1'>
                            <label className='block text-sm font-medium text-gray-300 mb-2'>
                              ترتيب العرض
                            </label>
                            <input
                              type='number'
                              value={question.sortOrder}
                              onChange={(e) => updateQuestion(question.id, 'sortOrder', parseInt(e.target.value))}
                              className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white'
                            />
                          </div>
                          <div className='flex items-end'>
                            <label className='flex items-center gap-2 cursor-pointer'>
                              <input
                                type='checkbox'
                                checked={question.isActive}
                                onChange={(e) => updateQuestion(question.id, 'isActive', e.target.checked)}
                                className='w-4 h-4'
                              />
                              <span className='text-sm text-gray-300'>نشط</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className='text-center py-8 text-gray-400'>
                    لا توجد أسئلة. انقر على "إضافة سؤال" لإضافة أول سؤال.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className='flex gap-4'>
          <Button
            type='submit'
            size='lg'
            disabled={form.formState.isSubmitting}
            className='bg-purple-600 hover:bg-purple-700 text-white'
          >
            {form.formState.isSubmitting ? 'جاري الإرسال...' : `${type === 'Create' ? 'إنشاء' : 'تحديث'} الفئة`}
          </Button>
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={() => router.push('/admin/faq')}
          >
            إلغاء
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default FAQCategoryForm


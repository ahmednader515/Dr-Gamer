'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { formatError } from '@/lib/utils'

// GET ALL FAQ CATEGORIES WITH QUESTIONS
export async function getAllFAQs() {
  try {
    const faqs = await prisma.fAQCategory.findMany({
      where: { isActive: true },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
    return JSON.parse(JSON.stringify(faqs))
  } catch (error) {
    console.error('Error getting FAQs:', error)
    return []
  }
}

// GET ALL FAQ CATEGORIES (for admin)
export async function getAllFAQCategories() {
  try {
    const categories = await prisma.fAQCategory.findMany({
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
    return JSON.parse(JSON.stringify(categories))
  } catch (error) {
    console.error('Error getting FAQ categories:', error)
    return []
  }
}

// GET FAQ CATEGORY BY ID
export async function getFAQCategoryById(id: string) {
  try {
    const category = await prisma.fAQCategory.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })
    return category ? JSON.parse(JSON.stringify(category)) : null
  } catch (error) {
    console.error('Error getting FAQ category:', error)
    return null
  }
}

// GET FAQ QUESTION BY ID
export async function getFAQQuestionById(id: string) {
  try {
    const question = await prisma.fAQQuestion.findUnique({
      where: { id }
    })
    return question ? JSON.parse(JSON.stringify(question)) : null
  } catch (error) {
    console.error('Error getting FAQ question:', error)
    return null
  }
}

// CREATE FAQ CATEGORY
export async function createFAQCategory(data: {
  title: string
  slug: string
  sortOrder?: number
  isActive?: boolean
}) {
  try {
    const category = await prisma.fAQCategory.create({
      data: {
        title: data.title,
        slug: data.slug,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      }
    })
    revalidatePath('/faq')
    revalidatePath('/admin/faq')
    return {
      success: true,
      message: 'تم إنشاء فئة الأسئلة بنجاح',
      categoryId: category.id,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE FAQ CATEGORY
export async function updateFAQCategory(id: string, data: {
  title?: string
  slug?: string
  sortOrder?: number
  isActive?: boolean
}) {
  try {
    await prisma.fAQCategory.update({
      where: { id },
      data
    })
    revalidatePath('/faq')
    revalidatePath('/admin/faq')
    return {
      success: true,
      message: 'تم تحديث فئة الأسئلة بنجاح',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// DELETE FAQ CATEGORY
export async function deleteFAQCategory(id: string) {
  try {
    await prisma.fAQCategory.delete({
      where: { id }
    })
    revalidatePath('/faq')
    revalidatePath('/admin/faq')
    return {
      success: true,
      message: 'تم Delete فئة الأسئلة بنجاح',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// CREATE FAQ QUESTION
export async function createFAQQuestion(data: {
  categoryId: string
  question: string
  answer: string
  sortOrder?: number
  isActive?: boolean
}) {
  try {
    await prisma.fAQQuestion.create({
      data: {
        categoryId: data.categoryId,
        question: data.question,
        answer: data.answer,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      }
    })
    revalidatePath('/faq')
    revalidatePath('/admin/faq')
    return {
      success: true,
      message: 'تم إنشاء السؤال بنجاح',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE FAQ QUESTION
export async function updateFAQQuestion(id: string, data: {
  categoryId?: string
  question?: string
  answer?: string
  sortOrder?: number
  isActive?: boolean
}) {
  try {
    await prisma.fAQQuestion.update({
      where: { id },
      data
    })
    revalidatePath('/faq')
    revalidatePath('/admin/faq')
    return {
      success: true,
      message: 'تم تحديث السؤال بنجاح',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// DELETE FAQ QUESTION
export async function deleteFAQQuestion(id: string) {
  try {
    await prisma.fAQQuestion.delete({
      where: { id }
    })
    revalidatePath('/faq')
    revalidatePath('/admin/faq')
    return {
      success: true,
      message: 'تم Delete السؤال بنجاح',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}


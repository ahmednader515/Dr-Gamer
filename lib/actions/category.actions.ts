'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const CategoryInputSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  slug: z.string().min(2, 'Category slug must be at least 2 characters'),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
})

const CategoryUpdateSchema = CategoryInputSchema.extend({
  id: z.string(),
})

// CREATE
export async function createCategory(data: z.infer<typeof CategoryInputSchema>) {
  try {
    const validatedData = CategoryInputSchema.parse(data)
    
    const category = await prisma.category.create({
      data: validatedData
    })
    
    revalidatePath('/admin/settings')
    revalidatePath('/')
    
    return {
      success: true,
      message: 'تم إنشاء الفئة بنجاح',
      category
    }
  } catch (error) {
    console.error('Error creating category:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء الفئة' 
    }
  }
}

// UPDATE
export async function updateCategory(data: z.infer<typeof CategoryUpdateSchema>) {
  try {
    const validatedData = CategoryUpdateSchema.parse(data)
    const { id, ...updateData } = validatedData
    
    const category = await prisma.category.update({
      where: { id },
      data: updateData
    })
    
    revalidatePath('/admin/settings')
    revalidatePath('/')
    
    return {
      success: true,
      message: 'تم تحديث الفئة بنجاح',
      category
    }
  } catch (error) {
    console.error('Error updating category:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الفئة' 
    }
  }
}

// DELETE
export async function deleteCategory(id: string) {
  try {
    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    })
    
    if (productsCount > 0) {
      return {
        success: false,
        message: `لا يمكن حذف الفئة لأنها تحتوي على ${productsCount} منتج`
      }
    }
    
    await prisma.category.delete({
      where: { id }
    })
    
    revalidatePath('/admin/settings')
    revalidatePath('/')
    
    return {
      success: true,
      message: 'تم حذف الفئة بنجاح'
    }
  } catch (error) {
    console.error('Error deleting category:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الفئة' 
    }
  }
}

// GET ALL
export async function getAllCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    
    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// GET BY ID
export async function getCategoryById(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id }
    })
    
    return category
  } catch (error) {
    console.error('Error fetching category:', error)
    return null
  }
}

// GET CATEGORY NAMES (for backward compatibility)
export async function getCategoryNames() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: { name: 'asc' }
    })
    
    return categories.map(cat => cat.name)
  } catch (error) {
    console.error('Error fetching category names:', error)
    return []
  }
}



// MIGRATE EXISTING PRODUCTS TO USE CATEGORY RELATION
export async function migrateProductCategories() {
  try {
    // Get all unique category names from products
    const productCategories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category']
    })
    
    // Create categories for each unique category name
    for (const productCategory of productCategories) {
      if (productCategory.category) {
        const slug = productCategory.category.toLowerCase().replace(/\s+/g, '-')
        
        // Check if category already exists
        const existingCategory = await prisma.category.findUnique({
          where: { slug }
        })
        
        if (!existingCategory) {
          await prisma.category.create({
            data: {
              name: productCategory.category,
              slug,
              isActive: true
            }
          })
        }
      }
    }
    
    // Update products to link to categories
    const categories = await prisma.category.findMany()
    
    for (const category of categories) {
      await prisma.product.updateMany({
        where: { category: category.name },
        data: { categoryId: category.id }
      })
    }
    
    return {
      success: true,
      message: 'تم ترحيل الفئات بنجاح'
    }
  } catch (error) {
    console.error('Error migrating categories:', error)
    return {
      success: false,
      message: 'حدث خطأ أثناء ترحيل الفئات'
    }
  }
}

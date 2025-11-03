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
    
    // Get the max sortOrder to add new category at the end
    const maxOrder = await prisma.category.aggregate({
      _max: { sortOrder: true },
    })
    const newSortOrder = (maxOrder._max.sortOrder ?? -1) + 1
    
    const category = await prisma.category.create({
      data: {
        ...validatedData,
        sortOrder: newSortOrder,
      }
    })
    
    revalidatePath('/admin/settings')
    revalidatePath('/')
    
    return {
      success: true,
      message: 'Category created successfully',
      category
    }
  } catch (error) {
    console.error('Error creating category:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred while creating the category' 
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
      message: 'Category updated successfully',
      category
    }
  } catch (error) {
    console.error('Error updating category:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred while updating the category' 
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
        message: `لا يمكن Delete الفئة لأنها تحتوي على ${productsCount} منتج`
      }
    }
    
    await prisma.category.delete({
      where: { id }
    })
    
    revalidatePath('/admin/settings')
    revalidatePath('/')
    
    return {
      success: true,
      message: 'Category deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting category:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred while deleting the category' 
    }
  }
}

// GET ALL (for admin - returns all categories, for public - only active)
export async function getAllCategories(includeInactive: boolean = false) {
  try {
    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })
    
    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// REORDER CATEGORIES
const ReorderCategoriesSchema = z.object({
  orders: z.array(z.object({
    id: z.string(),
    sortOrder: z.number(),
  })),
})

export async function reorderCategories(data: z.infer<typeof ReorderCategoriesSchema>) {
  try {
    const validatedData = ReorderCategoriesSchema.parse(data)
    
    // Update all categories in a transaction
    await prisma.$transaction(
      validatedData.orders.map(({ id, sortOrder }) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder },
        })
      )
    )
    
    revalidatePath('/admin/settings')
    revalidatePath('/')
    
    return {
      success: true,
      message: 'Category order updated successfully',
    }
  } catch (error) {
    console.error('Error reordering categories:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while updating category order',
    }
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
      orderBy: { sortOrder: 'asc' }
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
      message: 'Categories migrated successfully'
    }
  } catch (error) {
    console.error('Error migrating categories:', error)
    return {
      success: false,
      message: 'An error occurred while migrating categories'
    }
  }
}

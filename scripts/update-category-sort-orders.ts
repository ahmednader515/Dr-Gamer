import { config } from 'dotenv'
import { prisma } from '@/lib/prisma'

// Load environment variables
config()

async function updateCategorySortOrders() {
  try {
    console.log('🔄 Updating category sort orders...')
    
    // Get all categories ordered by creation date
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`Found ${categories.length} categories`)
    
    // Update each category with sequential sort order
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i]
      const newSortOrder = i + 1
      
      await prisma.category.update({
        where: { id: category.id },
        data: { sortOrder: newSortOrder }
      })
      
      console.log(`✅ Updated "${category.name}" with sort order: ${newSortOrder}`)
    }
    
    console.log('🎉 All category sort orders updated successfully!')
    
    // Display final result
    const updatedCategories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' }
    })
    
    console.log('\n📋 Final category order:')
    updatedCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ترتيب: ${cat.sortOrder})`)
    })
    
  } catch (error) {
    console.error('❌ Error updating category sort orders:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateCategorySortOrders()

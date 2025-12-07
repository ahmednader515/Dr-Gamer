import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Initial categories for pharmacy store
const initialCategories = [
  {
    name: 'Pain Relief',
    slug: 'pain-relief',
    description: 'مسكنات الألم والالتهابات',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Vitamins & Supplements',
    slug: 'vitamins-supplements',
    description: 'فيتامينات ومكملات غذائية',
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Allergy & Sinus',
    slug: 'allergy-sinus',
    description: 'أدوية الحساسية والجيوب الأنفية',
    sortOrder: 3,
    isActive: true
  },
  {
    name: 'Digestive Health',
    slug: 'digestive-health',
    description: 'صحة الجهاز الهضمي',
    sortOrder: 4,
    isActive: true
  },
  {
    name: 'Cold & Flu',
    slug: 'cold-flu',
    description: 'أدوية نزلات البرد والإنفلونزا',
    sortOrder: 5,
    isActive: true
  },
  {
    name: 'Prescription Medications',
    slug: 'prescription-medications',
    description: 'الأدوية الموصوفة',
    sortOrder: 6,
    isActive: true
  },
  {
    name: 'Over-the-Counter',
    slug: 'over-the-counter',
    description: 'الأدوية المتاحة بدون وصفة',
    sortOrder: 7,
    isActive: true
  },
  {
    name: 'Personal Care',
    slug: 'personal-care',
    description: 'العناية الشخصية',
    sortOrder: 8,
    isActive: true
  },
  {
    name: 'Health & Wellness',
    slug: 'health-wellness',
    description: 'الصحة والعافية',
    sortOrder: 9,
    isActive: true
  },
  {
    name: 'First Aid',
    slug: 'first-aid',
    description: 'الإسعافات الأولية',
    sortOrder: 10,
    isActive: true
  },
  {
    name: 'Baby Care',
    slug: 'baby-care',
    description: 'العناية بالطفل',
    sortOrder: 11,
    isActive: true
  },
  {
    name: 'Elderly Care',
    slug: 'elderly-care',
    description: 'العناية بالمسنين',
    sortOrder: 12,
    isActive: true
  },
  {
    name: 'Diabetes Care',
    slug: 'diabetes-care',
    description: 'العناية بمرضى السكري',
    sortOrder: 13,
    isActive: true
  },
  {
    name: 'Heart Health',
    slug: 'heart-health',
    description: 'صحة القلب',
    sortOrder: 14,
    isActive: true
  },
  {
    name: 'Mental Health',
    slug: 'mental-health',
    description: 'الصحة النفسية',
    sortOrder: 15,
    isActive: true
  },
  {
    name: 'Women\'s Health',
    slug: 'womens-health',
    description: 'صحة المرأة',
    sortOrder: 16,
    isActive: true
  },
  {
    name: 'Men\'s Health',
    slug: 'mens-health',
    description: 'صحة الرجل',
    sortOrder: 17,
    isActive: true
  },
  {
    name: 'Skin Care',
    slug: 'skin-care',
    description: 'العناية بالبشرة',
    sortOrder: 18,
    isActive: true
  },
  {
    name: 'Hair Care',
    slug: 'hair-care',
    description: 'العناية بالشعر',
    sortOrder: 19,
    isActive: true
  },
  {
    name: 'Oral Care',
    slug: 'oral-care',
    description: 'العناية بالفم والأسنان',
    sortOrder: 20,
    isActive: true
  }
]

async function migrateCategories() {
  try {
    console.log('🚀 Starting category migration...')

    // Create categories
    console.log('📝 Creating categories...')
    for (const categoryData of initialCategories) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: categoryData.slug }
      })

      if (!existingCategory) {
        await prisma.category.create({
          data: categoryData
        })
        console.log(`✅ Created category: ${categoryData.name}`)
      } else {
        console.log(`⏭️  Category already exists: ${categoryData.name}`)
      }
    }

    // Get all categories for mapping
    const categories = await prisma.category.findMany()
    const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat.id]))

    // Arabic to English category mapping
    const arabicToEnglishMap = {
      'تسكين الآلام': 'Pain Relief',
      'فيتامينات ومكملات غذائية': 'Vitamins & Supplements',
      'الحساسية والجيوب الأنفية': 'Allergy & Sinus',
      'صحة الجهاز الهضمي': 'Digestive Health',
      'نزلات البرد والإنفلونزا': 'Cold & Flu',
      'الأدوية الموصوفة': 'Prescription Medications',
      'الأدوية المتاحة بدون وصفة': 'Over-the-Counter',
      'العناية الشخصية': 'Personal Care',
      'الصحة والعافية': 'Health & Wellness',
      'الإسعافات الأولية': 'First Aid',
      'العناية بالطفل': 'Baby Care',
      'العناية بالمسنين': 'Elderly Care',
      'العناية بمرضى السكري': 'Diabetes Care',
      'صحة القلب': 'Heart Health',
      'الصحة النفسية': 'Mental Health',
      'صحة المرأة': 'Women\'s Health',
      'صحة الرجل': 'Men\'s Health',
      'العناية بالبشرة': 'Skin Care',
      'العناية بالشعر': 'Hair Care',
      'العناية بالفم والأسنان': 'Oral Care'
    }

    // Get all products and update their categoryId
    console.log('🔄 Updating products with category IDs...')
    const products = await prisma.product.findMany()
    
    for (const product of products) {
      const categoryName = product.category
      if (categoryName) {
        // Try direct match first
        let categoryId = categoryMap.get(categoryName.toLowerCase())
        
        // If no direct match, try Arabic to English mapping
        if (!categoryId && arabicToEnglishMap[categoryName]) {
          const englishName = arabicToEnglishMap[categoryName]
          categoryId = categoryMap.get(englishName.toLowerCase())
        }
        
        if (categoryId) {
          await prisma.product.update({
            where: { id: product.id },
            data: { categoryId }
          })
          console.log(`✅ Updated product "${product.name}" with category ID`)
        } else {
          console.log(`⚠️  No category found for product "${product.name}" with category "${categoryName}"`)
        }
      }
    }

    console.log('🎉 Category migration completed successfully!')
    
    // Print summary
    const totalCategories = await prisma.category.count()
    const totalProducts = await prisma.product.count()
    const productsWithCategoryId = await prisma.product.count({
      where: { categoryId: { not: null } }
    })

    console.log('\n📊 Migration Summary:')
    console.log(`- Total categories: ${totalCategories}`)
    console.log(`- Total products: ${totalProducts}`)
    console.log(`- Products with category ID: ${productsWithCategoryId}`)

  } catch (error) {
    console.error('❌ Error during migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateCategories()
    .then(() => {
      console.log('✅ Migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    })
}

export { migrateCategories }

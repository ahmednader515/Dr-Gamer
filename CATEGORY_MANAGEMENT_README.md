# Category Management Feature

## Overview

This feature adds comprehensive category management to the pharmacy store admin panel. Administrators can now create, edit, delete, and manage product categories through a dedicated interface.

## Features

### 1. Category Management Interface
- **Location**: `/admin/settings` → "إدارة الفئات" tab
- **Access**: Admin users only
- **Functionality**:
  - View all categories in a clean list
  - Add new categories with full details
  - Edit existing categories
  - Delete categories (with safety checks)
  - Toggle category active/inactive status
  - Set custom sort order

### 2. Category Properties
Each category includes:
- **Name**: Display name (English)
- **Slug**: URL-friendly identifier
- **Description**: Optional description (Arabic)
- **Image**: Optional category image URL
- **Active Status**: Toggle to show/hide category
- **Sort Order**: Custom ordering for display

### 3. Database Schema
- **New Table**: `categories`
- **Product Relationship**: Products now link to categories via `categoryId`
- **Backward Compatibility**: Existing `category` string field maintained

### 4. Integration Points
- **Homepage**: Categories displayed in "استكشف الفئات" section
- **Product Creation**: Dropdown selection from managed categories
- **Search Page**: Category filters use managed categories
- **Header Navigation**: Sidebar categories from managed list

## Initial Categories

The system comes with 20 pre-configured pharmacy categories:

1. Pain Relief (تسكين الآلام)
2. Vitamins & Supplements (فيتامينات ومكملات غذائية)
3. Allergy & Sinus (الحساسية والجيوب الأنفية)
4. Digestive Health (صحة الجهاز الهضمي)
5. Cold & Flu (نزلات البرد والإنفلونزا)
6. Prescription Medications (الأدوية الموصوفة)
7. Over-the-Counter (الأدوية المتاحة بدون وصفة)
8. Personal Care (العناية الشخصية)
9. Health & Wellness (الصحة والعافية)
10. First Aid (الإسعافات الأولية)
11. Baby Care (العناية بالطفل)
12. Elderly Care (العناية بالمسنين)
13. Diabetes Care (العناية بمرضى السكري)
14. Heart Health (صحة القلب)
15. Mental Health (الصحة النفسية)
16. Women's Health (صحة المرأة)
17. Men's Health (صحة الرجل)
18. Skin Care (العناية بالبشرة)
19. Hair Care (العناية بالشعر)
20. Oral Care (العناية بالفم والأسنان)

## Migration

### Automatic Migration
The system includes an automatic migration script that:
1. Creates the initial categories
2. Maps existing products to appropriate categories
3. Handles Arabic to English category name mapping
4. Updates product `categoryId` fields

### Manual Migration
Run the migration script:
```bash
npm run migrate-categories
```

## Usage

### For Administrators

1. **Access Category Management**:
   - Go to `/admin/settings`
   - Click on "إدارة الفئات" tab

2. **Add New Category**:
   - Click "إضافة فئة جديدة"
   - Fill in category details
   - Name auto-generates slug
   - Set sort order and active status

3. **Edit Category**:
   - Click "تعديل" on any category
   - Modify details as needed
   - Save changes

4. **Delete Category**:
   - Click "حذف" on category
   - Confirm deletion
   - Note: Categories with products cannot be deleted

5. **Migrate Existing Data**:
   - Click "ترحيل الفئات" button
   - System automatically maps existing products

### For Developers

#### Database Queries
```typescript
// Get all active categories
const categories = await prisma.category.findMany({
  where: { isActive: true },
  orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
})

// Get products by category
const products = await prisma.product.findMany({
  where: { 
    categoryId: categoryId,
    isPublished: true 
  }
})
```

#### API Actions
```typescript
import { 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  getAllCategories 
} from '@/lib/actions/category.actions'

// Create category
const result = await createCategory({
  name: 'New Category',
  slug: 'new-category',
  description: 'Category description',
  isActive: true,
  sortOrder: 0
})
```

## Files Modified/Created

### New Files
- `lib/actions/category.actions.ts` - Category CRUD operations
- `app/admin/settings/category-management.tsx` - Category management UI
- `scripts/migrate-categories.ts` - Migration script
- `components/ui/tabs.tsx` - Tabs component

### Modified Files
- `prisma/schema.prisma` - Added Category model and Product relationship
- `app/admin/settings/page.tsx` - Added tabs for category management
- `app/(home)/page.tsx` - Updated to use new category system
- `app/(root)/search/page.tsx` - Updated category filters
- `components/shared/header/index.tsx` - Updated category loading
- `components/shared/header/sidebar.tsx` - Updated category loading
- `lib/actions/product.actions.ts` - Updated getAllCategories function
- `package.json` - Added migration script

## Benefits

1. **Better Organization**: Products are properly categorized with relationships
2. **Admin Control**: Full CRUD operations for categories
3. **Flexibility**: Easy to add, modify, or remove categories
4. **Performance**: Optimized queries with proper relationships
5. **User Experience**: Consistent category display across the site
6. **Scalability**: Easy to extend with additional category properties

## Future Enhancements

- Category images and icons
- Category-specific SEO settings
- Category analytics and reporting
- Bulk category operations
- Category templates for new stores

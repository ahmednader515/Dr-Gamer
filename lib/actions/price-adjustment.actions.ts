'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { formatError } from '../utils'

async function requireStaff() {
  const session = await auth()
  if (session?.user.role !== 'Admin' && session?.user.role !== 'Moderator') {
    throw new Error('Unauthorized')
  }
}

/**
 * After any adjustment, round to the nearest 5 (e.g. 453 → 455) so prices stay clean whole amounts.
 * Very small results use a whole number with a 0.01 floor when nearest-5 would be zero.
 */
function roundAdjustedPrice(n: number): number {
  if (!Number.isFinite(n)) return 0.01
  if (n < 0.01) return 0.01
  const nearest5 = Math.round(n / 5) * 5
  if (nearest5 >= 0.01) return nearest5
  return Math.max(0.01, Math.round(n))
}

function adjustValue(old: number, mode: 'percent' | 'fixed', value: number): number {
  const next = mode === 'percent' ? old * (1 + value / 100) : old + value
  return roundAdjustedPrice(next)
}

function parseVariations(raw: unknown): Array<{ name: string; price: number }> | null {
  if (!raw) return null
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(v)) return null
    return v
  } catch {
    return null
  }
}

const FilterSchema = z.object({
  query: z.string().optional(),
  categoryName: z.string().optional(),
  platformType: z.string().optional(),
  productCategory: z.string().optional(),
  productType: z.string().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  isPublished: z.enum(['all', 'yes', 'no']).optional(),
})

const ListInputSchema = z.object({
  scope: z.enum(['all', 'category', 'selection']),
  categoryId: z.string().optional(),
  filters: FilterSchema,
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
})

const ApplyInputSchema = z
  .object({
    scope: z.enum(['all', 'category', 'selection']),
    categoryId: z.string().optional(),
    selectedIds: z.array(z.string()).optional(),
    filters: FilterSchema,
    mode: z.enum(['percent', 'fixed']),
    value: z.number(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === 'category' && !data.categoryId?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Category is required' })
    }
    if (data.scope === 'selection' && (!data.selectedIds || data.selectedIds.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select at least one product' })
    }
  })

export type PriceAdjustmentFilters = z.infer<typeof FilterSchema>

function buildFilterWhere(filters: PriceAdjustmentFilters): Prisma.ProductWhereInput {
  const parts: Prisma.ProductWhereInput[] = []

  if (filters.query?.trim()) {
    parts.push({ name: { contains: filters.query.trim(), mode: 'insensitive' } })
  }
  if (filters.categoryName && filters.categoryName !== 'all') {
    parts.push({
      OR: [{ category: filters.categoryName }, { categoryRelation: { name: filters.categoryName } }],
    })
  }
  if (filters.platformType && filters.platformType !== 'all') {
    parts.push({ platformType: filters.platformType })
  }
  if (filters.productCategory && filters.productCategory !== 'all') {
    parts.push({ productCategory: filters.productCategory })
  }
  if (filters.productType && filters.productType !== 'all') {
    parts.push({ productType: filters.productType })
  }
  if (filters.priceMin != null && !Number.isNaN(filters.priceMin)) {
    parts.push({ price: { gte: filters.priceMin } })
  }
  if (filters.priceMax != null && !Number.isNaN(filters.priceMax)) {
    parts.push({ price: { lte: filters.priceMax } })
  }
  if (filters.isPublished === 'yes') {
    parts.push({ isPublished: true })
  } else if (filters.isPublished === 'no') {
    parts.push({ isPublished: false })
  }

  if (parts.length === 0) return {}
  if (parts.length === 1) return parts[0]
  return { AND: parts }
}

async function categoryWhereClause(categoryId: string): Promise<Prisma.ProductWhereInput> {
  const cat = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!cat) return { id: { in: [] } }
  return {
    OR: [{ categoryId: cat.id }, { category: cat.name }],
  }
}

/** Where clause for browsing the product list (selection scope does not restrict by picked ids). */
async function buildListWhere(
  scope: 'all' | 'category' | 'selection',
  categoryId: string | undefined,
  filters: PriceAdjustmentFilters
): Promise<Prisma.ProductWhereInput> {
  const fw = buildFilterWhere(filters)
  if (scope === 'category' && categoryId) {
    const cw = await categoryWhereClause(categoryId)
    const merged: Prisma.ProductWhereInput[] = []
    if (Object.keys(fw).length > 0) merged.push(fw)
    merged.push(cw)
    return { AND: merged }
  }
  return fw
}

/** Where clause for counting / applying updates. */
async function buildApplyWhere(
  scope: 'all' | 'category' | 'selection',
  categoryId: string | undefined,
  selectedIds: string[] | undefined,
  filters: PriceAdjustmentFilters
): Promise<Prisma.ProductWhereInput> {
  const fw = buildFilterWhere(filters)
  const parts: Prisma.ProductWhereInput[] = []
  if (Object.keys(fw).length > 0) parts.push(fw)

  if (scope === 'selection') {
    if (!selectedIds?.length) return { id: { in: [] } }
    parts.push({ id: { in: selectedIds } })
  } else if (scope === 'category' && categoryId) {
    parts.push(await categoryWhereClause(categoryId))
  }

  if (parts.length === 0) return {}
  if (parts.length === 1) return parts[0]
  return { AND: parts }
}

export async function getPriceFilterOptions() {
  try {
    await requireStaff()
    const [platformRows, pcRows, ptRows] = await Promise.all([
      prisma.product.findMany({
        where: { platformType: { not: null } },
        select: { platformType: true },
        distinct: ['platformType'],
      }),
      prisma.product.findMany({
        where: { productCategory: { not: null } },
        select: { productCategory: true },
        distinct: ['productCategory'],
      }),
      prisma.product.findMany({
        select: { productType: true },
        distinct: ['productType'],
      }),
    ])
    const platformTypes = platformRows
      .map((r: { platformType: string | null }) => r.platformType)
      .filter((x: string | null): x is string => !!x)
      .sort()
    const productCategories = pcRows
      .map((r: { productCategory: string | null }) => r.productCategory)
      .filter((x: string | null): x is string => !!x)
      .sort()
    const productTypes = ptRows
      .map((r: { productType: string }) => r.productType)
      .sort()
    return { success: true as const, platformTypes, productCategories, productTypes }
  } catch (e) {
    console.error('getPriceFilterOptions', e)
    return {
      success: false as const,
      message: formatError(e),
      platformTypes: [] as string[],
      productCategories: [] as string[],
      productTypes: [] as string[],
    }
  }
}

export async function getPriceAdjustmentProductList(raw: z.infer<typeof ListInputSchema>) {
  try {
    await requireStaff()
    const input = ListInputSchema.parse(raw)
    const where = await buildListWhere(input.scope, input.categoryId, input.filters)
    const skip = (input.page - 1) * input.limit

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: input.limit,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          platformType: true,
          productCategory: true,
          productType: true,
          price: true,
          listPrice: true,
          isPublished: true,
          images: true,
        },
      }),
      prisma.product.count({ where }),
    ])

    const normalized = products.map((p: (typeof products)[number]) => ({
      ...p,
      price: Number(p.price),
      listPrice: Number(p.listPrice),
      image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '',
    }))

    return {
      success: true as const,
      products: JSON.parse(JSON.stringify(normalized)),
      total,
      totalPages: Math.ceil(total / input.limit) || 1,
      page: input.page,
    }
  } catch (e) {
    console.error('getPriceAdjustmentProductList', e)
    return {
      success: false as const,
      message: formatError(e),
      products: [],
      total: 0,
      totalPages: 0,
      page: 1,
    }
  }
}

export async function countProductsForPriceAdjustment(raw: {
  scope: 'all' | 'category' | 'selection'
  categoryId?: string
  selectedIds?: string[]
  filters: PriceAdjustmentFilters
}) {
  try {
    await requireStaff()
    const where = await buildApplyWhere(
      raw.scope,
      raw.categoryId,
      raw.selectedIds,
      raw.filters
    )
    const count = await prisma.product.count({ where })
    return { success: true as const, count }
  } catch (e) {
    console.error('countProductsForPriceAdjustment', e)
    return { success: false as const, message: formatError(e), count: 0 }
  }
}

export async function applyBulkPriceAdjustment(raw: z.infer<typeof ApplyInputSchema>) {
  try {
    await requireStaff()
    const input = ApplyInputSchema.parse(raw)
    const where = await buildApplyWhere(
      input.scope,
      input.categoryId,
      input.selectedIds,
      input.filters
    )

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        price: true,
        listPrice: true,
        originalPrice: true,
        variations: true,
      },
    })

    if (products.length === 0) {
      return { success: false as const, message: 'No products matched the current scope and filters.' }
    }

    const chunkSize = 50
    let updated = 0

    for (let i = 0; i < products.length; i += chunkSize) {
      const batch = products.slice(i, i + chunkSize)
      await prisma.$transaction(
        batch.map((p: (typeof products)[number]) => {
          const newPrice = adjustValue(Number(p.price), input.mode, input.value)
          const newList = adjustValue(Number(p.listPrice), input.mode, input.value)
          const orig = Number(p.originalPrice)
          const newOrig = orig > 0 ? adjustValue(orig, input.mode, input.value) : orig

          const vars = parseVariations(p.variations)
          const newVariations =
            vars && vars.length > 0
              ? JSON.stringify(
                  vars.map((v) => ({
                    ...v,
                    price: adjustValue(Number(v.price), input.mode, input.value),
                  }))
                )
              : p.variations

          return prisma.product.update({
            where: { id: p.id },
            data: {
              price: newPrice,
              listPrice: newList,
              originalPrice: newOrig,
              variations: newVariations,
            },
          })
        })
      )
      updated += batch.length
    }

    revalidatePath('/')
    revalidatePath('/admin/products')
    revalidatePath('/admin/settings')
    revalidatePath('/search')
    revalidateTag('products')

    return {
      success: true as const,
      message: `Updated prices for ${updated} product(s).`,
      updated,
    }
  } catch (e) {
    console.error('applyBulkPriceAdjustment', e)
    return { success: false as const, message: formatError(e), updated: 0 }
  }
}

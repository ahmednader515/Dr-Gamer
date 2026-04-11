'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { getAllCategories } from '@/lib/actions/category.actions'
import {
  applyBulkPriceAdjustment,
  countProductsForPriceAdjustment,
  getPriceAdjustmentProductList,
  getPriceFilterOptions,
  type PriceAdjustmentFilters,
} from '@/lib/actions/price-adjustment.actions'
import { Loader2, RefreshCw } from 'lucide-react'

type Scope = 'all' | 'category' | 'selection'

interface CategoryRow {
  id: string
  name: string
}

const defaultFilters: PriceAdjustmentFilters = {
  query: '',
  categoryName: 'all',
  platformType: 'all',
  productCategory: 'all',
  productType: 'all',
  priceMin: undefined,
  priceMax: undefined,
  isPublished: 'all',
}

export default function GlobalPricesSettings() {
  const { toast } = useToast()
  const [scope, setScope] = useState<Scope>('all')
  const [categoryId, setCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [filters, setFilters] = useState<PriceAdjustmentFilters>(defaultFilters)
  const [platformTypes, setPlatformTypes] = useState<string[]>([])
  const [productCategories, setProductCategories] = useState<string[]>([])
  const [productTypes, setProductTypes] = useState<string[]>([])

  const [page, setPage] = useState(1)
  const limit = 20
  const [products, setProducts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingList, setLoadingList] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [adjustMode, setAdjustMode] = useState<'percent' | 'fixed'>('percent')
  const [adjustValue, setAdjustValue] = useState<string>('0')

  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [counting, setCounting] = useState(false)
  const [applying, setApplying] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [cats, opts] = await Promise.all([getAllCategories(true), getPriceFilterOptions()])
      setCategories(cats.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })))
      if (opts.success) {
        setPlatformTypes(opts.platformTypes)
        setProductCategories(opts.productCategories)
        setProductTypes(opts.productTypes)
      }
    }
    load()
  }, [])

  const filtersForRequest = useCallback((): PriceAdjustmentFilters => {
    const f = { ...filters }
    if (!f.query?.trim()) delete f.query
    return f
  }, [filters])

  const loadProducts = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await getPriceAdjustmentProductList({
        scope,
        categoryId: scope === 'category' ? categoryId : undefined,
        filters: filtersForRequest(),
        page,
        limit,
      })
      if (res.success) {
        setProducts(res.products)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      } else {
        toast({ title: 'Error', description: res.message ?? 'Failed to load products', variant: 'destructive' })
      }
    } finally {
      setLoadingList(false)
    }
  }, [scope, categoryId, filtersForRequest, page, limit, toast])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  useEffect(() => {
    setPage(1)
  }, [scope, categoryId, filters])

  useEffect(() => {
    setSelectedIds(new Set())
    setPreviewCount(null)
  }, [scope, categoryId])

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const selectAllOnPage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        products.forEach((p) => next.add(p.id))
      } else {
        products.forEach((p) => next.delete(p.id))
      }
      return next
    })
  }

  const runPreviewCount = async () => {
    setCounting(true)
    try {
      const res = await countProductsForPriceAdjustment({
        scope,
        categoryId: scope === 'category' ? categoryId : undefined,
        selectedIds: scope === 'selection' ? Array.from(selectedIds) : undefined,
        filters: filtersForRequest(),
      })
      if (res.success) setPreviewCount(res.count)
      else {
        setPreviewCount(null)
        toast({ title: 'Count failed', description: res.message, variant: 'destructive' })
      }
    } finally {
      setCounting(false)
    }
  }

  const handleApply = async () => {
    const num = parseFloat(adjustValue.replace(',', '.'))
    if (Number.isNaN(num)) {
      toast({ title: 'Invalid value', description: 'Enter a valid number.', variant: 'destructive' })
      return
    }
    if (scope === 'category' && !categoryId) {
      toast({ title: 'Category required', description: 'Choose a category.', variant: 'destructive' })
      return
    }
    if (scope === 'selection' && selectedIds.size === 0) {
      toast({ title: 'No products selected', description: 'Select at least one product.', variant: 'destructive' })
      return
    }

    setApplying(true)
    try {
      const res = await applyBulkPriceAdjustment({
        scope,
        categoryId: scope === 'category' ? categoryId : undefined,
        selectedIds: scope === 'selection' ? Array.from(selectedIds) : undefined,
        filters: filtersForRequest(),
        mode: adjustMode,
        value: num,
      })
      if (res.success) {
        toast({ title: 'Prices updated', description: res.message })
        setConfirmOpen(false)
        setPreviewCount(null)
        setSelectedIds(new Set())
        await loadProducts()
      } else {
        toast({ title: 'Update failed', description: res.message, variant: 'destructive' })
      }
    } finally {
      setApplying(false)
    }
  }

  const allOnPageSelected =
    products.length > 0 && products.every((p) => selectedIds.has(p.id))

  return (
    <div className="space-y-6">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Global Prices</CardTitle>
          <CardDescription>
            Increase or decrease prices across the catalog, within one category, or for hand-picked games. Use
            filters to narrow the list before applying.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base">Scope</Label>
            <RadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as Scope)}
              className="grid gap-3 sm:grid-cols-3"
            >
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
                <RadioGroupItem value="all" id="scope-all" />
                <div>
                  <span className="font-medium">Entire catalog</span>
                  <p className="text-xs text-muted-foreground">All products matching the filters below</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
                <RadioGroupItem value="category" id="scope-cat" />
                <div>
                  <span className="font-medium">One category</span>
                  <p className="text-xs text-muted-foreground">Only products in the chosen category</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
                <RadioGroupItem value="selection" id="scope-sel" />
                <div>
                  <span className="font-medium">Specific games</span>
                  <p className="text-xs text-muted-foreground">Pick products from the table (use filters to find them)</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {scope === 'category' && (
            <div className="space-y-2 max-w-md">
              <Label>Category</Label>
              <Select value={categoryId || undefined} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-base">Filters</Label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Search name</Label>
                <Input
                  placeholder="Game title…"
                  value={filters.query ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                />
              </div>
              {scope === 'all' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Category (filter)</Label>
                  <Select
                    value={filters.categoryName ?? 'all'}
                    onValueChange={(v) => setFilters((f) => ({ ...f, categoryName: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Platform</Label>
                <Select
                  value={filters.platformType ?? 'all'}
                  onValueChange={(v) => setFilters((f) => ({ ...f, platformType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {platformTypes.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Product category</Label>
                <Select
                  value={filters.productCategory ?? 'all'}
                  onValueChange={(v) => setFilters((f) => ({ ...f, productCategory: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {productCategories.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Product type</Label>
                <Select
                  value={filters.productType ?? 'all'}
                  onValueChange={(v) => setFilters((f) => ({ ...f, productType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {productTypes.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Min price</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Any"
                  value={filters.priceMin ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setFilters((f) => ({
                      ...f,
                      priceMin: v === '' ? undefined : parseFloat(v),
                    }))
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Max price</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Any"
                  value={filters.priceMax ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setFilters((f) => ({
                      ...f,
                      priceMax: v === '' ? undefined : parseFloat(v),
                    }))
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Published</Label>
                <Select
                  value={filters.isPublished ?? 'all'}
                  onValueChange={(v) =>
                    setFilters((f) => ({
                      ...f,
                      isPublished: v as PriceAdjustmentFilters['isPublished'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Published only</SelectItem>
                    <SelectItem value="no">Draft only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setFilters(defaultFilters)}>
                Reset filters
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadProducts()}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                Refresh list
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Products</CardTitle>
            <CardDescription>
              {scope === 'selection'
                ? 'Select rows to include in the price change.'
                : 'Preview which products match your scope and filters.'}{' '}
              {total > 0 && <span className="text-foreground">({total} total)</span>}
            </CardDescription>
          </div>
          {scope === 'selection' && products.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="sel-page"
                checked={allOnPageSelected}
                onCheckedChange={(c) => selectAllOnPage(c === true)}
              />
              <Label htmlFor="sel-page" className="text-sm font-normal cursor-pointer">
                Select all on this page
              </Label>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="flex items-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : products.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No products match these filters.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    {scope === 'selection' && <th className="w-10 p-2" />}
                    <th className="p-2">Product</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Platform</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">List</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 hover:bg-muted/30">
                      {scope === 'selection' && (
                        <td className="p-2 align-middle">
                          <Checkbox
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={(c) => toggleSelect(p.id, c === true)}
                          />
                        </td>
                      )}
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails; mixed URL sources
                            <img
                              src={p.image}
                              alt=""
                              width={36}
                              height={36}
                              className="h-9 w-9 rounded object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded bg-muted" />
                          )}
                          <span className="font-medium line-clamp-2">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-2 text-muted-foreground">{p.category}</td>
                      <td className="p-2 text-muted-foreground">{p.platformType ?? '—'}</td>
                      <td className="p-2 text-right tabular-nums">{Number(p.price).toFixed(2)}</td>
                      <td className="p-2 text-right tabular-nums">{Number(p.listPrice).toFixed(2)}</td>
                      <td className="p-2">{p.isPublished ? 'Live' : 'Draft'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Adjustment</CardTitle>
          <CardDescription>
            Percentage applies to sale price, list price, original price, and variation prices. Fixed amount adds
            or subtracts the same amount from each. Final values are rounded to the nearest 5 (e.g. 453 → 455).
            {scope === 'selection' && (
              <span className="mt-1 block text-foreground">
                {selectedIds.size} product{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={adjustMode}
            onValueChange={(v) => setAdjustMode(v as 'percent' | 'fixed')}
            className="flex flex-wrap gap-4"
          >
            <label className="flex items-center gap-2">
              <RadioGroupItem value="percent" id="adj-pct" />
              <span>Percentage (%)</span>
            </label>
            <label className="flex items-center gap-2">
              <RadioGroupItem value="fixed" id="adj-fix" />
              <span>Fixed amount (same currency as prices)</span>
            </label>
          </RadioGroup>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="adj-val">
                {adjustMode === 'percent' ? 'Percent (use negative to decrease)' : 'Amount (negative to decrease)'}
              </Label>
              <Input
                id="adj-val"
                className="w-40"
                value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                placeholder={adjustMode === 'percent' ? 'e.g. 5 or -10' : 'e.g. 20 or -5'}
              />
            </div>
            <Button type="button" variant="secondary" onClick={() => void runPreviewCount()} disabled={counting}>
              {counting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Preview affected count'}
            </Button>
            {previewCount !== null && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{previewCount}</span> product(s) will be updated.
              </p>
            )}
          </div>
          <Button
            type="button"
            className="bg-primary"
            disabled={applying}
            onClick={() => {
              const num = parseFloat(adjustValue.replace(',', '.'))
              if (Number.isNaN(num)) {
                toast({ title: 'Invalid value', description: 'Enter a valid number.', variant: 'destructive' })
                return
              }
              if (scope === 'category' && !categoryId) {
                toast({ title: 'Category required', description: 'Choose a category.', variant: 'destructive' })
                return
              }
              if (scope === 'selection' && selectedIds.size === 0) {
                toast({
                  title: 'No products selected',
                  description: 'Select at least one product in the table.',
                  variant: 'destructive',
                })
                return
              }
              setConfirmOpen(true)
            }}
          >
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply price change'}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply price change?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently update prices for the selected scope. Consider exporting or backing up data
              before large changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleApply()} disabled={applying}>
              {applying ? 'Updating…' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

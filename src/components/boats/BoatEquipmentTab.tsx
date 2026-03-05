import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Plus, Pencil, Trash2, Copy, Package } from 'lucide-react'
import { toast } from 'sonner'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { formatPrice } from '@/lib/formatters'
import { useBoats, useBoatEquipment } from '@/hooks/useBoats'
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useCopyEquipment,
  useReorderCategories,
  useReorderItems,
  useDeleteItems,
} from '@/hooks/useEquipment'
import { EquipmentCategoryForm } from '@/components/equipment/EquipmentCategoryForm'
import { EquipmentItemForm } from '@/components/equipment/EquipmentItemForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SortableItem } from '@/components/ui/SortableItem'
import type { EquipmentCategory, EquipmentCategoryWithItems, EquipmentItem } from '@/types'
import type { EquipmentCategoryFormData, EquipmentItemFormData } from '@/lib/validators'

interface BoatEquipmentTabProps {
  boatId: string
  equipmentCategories: EquipmentCategoryWithItems[]
  isAdmin: boolean
}

export const BoatEquipmentTab = ({ boatId, equipmentCategories, isAdmin }: BoatEquipmentTabProps) => {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'hr' ? 'hr' : 'en') as 'hr' | 'en'
  const { data: allBoats } = useBoats()

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<EquipmentCategory | null>(null)

  // Item form state
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  // Delete confirm state
  const [deletingCategory, setDeletingCategory] = useState<EquipmentCategoryWithItems | null>(null)
  const [deletingItem, setDeletingItem] = useState<EquipmentItem | null>(null)

  // Accordion state — all open by default
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set(equipmentCategories.map((c) => c.id))
  )

  // Bulk select state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Copy equipment state
  const [showCopyConfirm, setShowCopyConfirm] = useState(false)
  const [copySourceBoatId, setCopySourceBoatId] = useState<string | null>(null)

  // Mutations
  const createCategory = useCreateCategory(boatId)
  const updateCategory = useUpdateCategory(boatId)
  const deleteCategory = useDeleteCategory(boatId)
  const createItem = useCreateItem(boatId)
  const updateItem = useUpdateItem(boatId)
  const deleteItem = useDeleteItem(boatId)
  const copyEquipment = useCopyEquipment(boatId)
  const reorderCategories = useReorderCategories(boatId)
  const reorderItems = useReorderItems(boatId)
  const deleteItems = useDeleteItems(boatId)

  const categories = equipmentCategories ?? []

  const otherBoats = useMemo(
    () => (allBoats ?? []).filter((b) => b.id !== boatId),
    [allBoats, boatId]
  )

  const { data: sourceBoatEquipment } = useBoatEquipment(copySourceBoatId ?? undefined)

  const toggle = (categoryId: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  // Category handlers
  const handleCreateCategory = (data: EquipmentCategoryFormData) => {
    createCategory.mutate(data, {
      onSuccess: () => {
        toast.success(t('equipment.createCategorySuccess'))
        setShowCategoryForm(false)
      },
      onError: () => toast.error(t('equipment.error')),
    })
  }

  const handleUpdateCategory = (data: EquipmentCategoryFormData) => {
    if (!editingCategory) return
    updateCategory.mutate(
      { id: editingCategory.id, data },
      {
        onSuccess: () => {
          toast.success(t('equipment.updateCategorySuccess'))
          setEditingCategory(null)
        },
        onError: () => toast.error(t('equipment.error')),
      }
    )
  }

  const handleDeleteCategory = () => {
    if (!deletingCategory) return
    deleteCategory.mutate(deletingCategory.id, {
      onSuccess: () => {
        toast.success(t('equipment.deleteCategorySuccess'))
        setDeletingCategory(null)
      },
      onError: () => toast.error(t('equipment.error')),
    })
  }

  // Item handlers
  const handleCreateItem = (data: EquipmentItemFormData) => {
    if (!activeCategoryId) return
    createItem.mutate(
      { categoryId: activeCategoryId, data },
      {
        onSuccess: () => {
          toast.success(t('equipment.createItemSuccess'))
          setShowItemForm(false)
          setActiveCategoryId(null)
        },
        onError: () => toast.error(t('equipment.error')),
      }
    )
  }

  const handleUpdateItem = (data: EquipmentItemFormData) => {
    if (!editingItem) return
    updateItem.mutate(
      { id: editingItem.id, data },
      {
        onSuccess: () => {
          toast.success(t('equipment.updateItemSuccess'))
          setEditingItem(null)
        },
        onError: () => toast.error(t('equipment.error')),
      }
    )
  }

  const handleDeleteItem = () => {
    if (!deletingItem) return
    deleteItem.mutate(deletingItem.id, {
      onSuccess: () => {
        toast.success(t('equipment.deleteItemSuccess'))
        setDeletingItem(null)
      },
      onError: () => toast.error(t('equipment.error')),
    })
  }

  // Drag end handler for categories
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order)
    const oldIndex = sorted.findIndex((c) => c.id === active.id)
    const newIndex = sorted.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...sorted]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    reorderCategories.mutate(
      reordered.map((c, i) => ({ id: c.id, sort_order: i }))
    )
  }

  // Drag end handler for items within a category
  const handleItemDragEnd = (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const category = categories.find((c) => c.id === categoryId)
    if (!category) return

    const sorted = [...category.items].sort((a, b) => a.sort_order - b.sort_order)
    const oldIndex = sorted.findIndex((item) => item.id === active.id)
    const newIndex = sorted.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...sorted]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    reorderItems.mutate(
      reordered.map((item, i) => ({ id: item.id, sort_order: i }))
    )
  }

  // Bulk delete
  const handleBulkDelete = () => {
    deleteItems.mutate([...selectedItemIds], {
      onSuccess: () => {
        toast.success(t('equipment.deleteItemSuccess'))
        setSelectedItemIds(new Set())
        setShowBulkDeleteConfirm(false)
      },
      onError: () => toast.error(t('equipment.error')),
    })
  }

  // Copy equipment
  const handleCopySelect = (sourceId: string) => {
    setCopySourceBoatId(sourceId)
    setShowCopyConfirm(true)
  }

  const handleCopyConfirm = () => {
    if (!copySourceBoatId) return
    copyEquipment.mutate(copySourceBoatId, {
      onSuccess: (result) => {
        toast.success(t('equipment.copySuccess', { categories: result.categories, items: result.items }))
        setCopySourceBoatId(null)
        setShowCopyConfirm(false)
      },
      onError: () => toast.error(t('equipment.error')),
    })
  }

  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-3">
      {/* Header actions */}
      {isAdmin && (
        <div className="flex items-center gap-2">
          {otherBoats.length > 0 && (
            <div className="relative flex-1">
              <select
                onChange={(e) => {
                  if (e.target.value) handleCopySelect(e.target.value)
                  e.target.value = ''
                }}
                defaultValue=""
                className="h-8 w-full appearance-none rounded-md border border-border bg-white px-2 pr-7 text-xs font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
              >
                <option value="" disabled>
                  {t('equipment.copyFrom')}
                </option>
                {otherBoats.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <Copy className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          )}
          <button
            onClick={() => setShowCategoryForm(true)}
            className={cn(ds.btn.base, ds.btn.sm, ds.btn.primary)}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('equipment.addCategory')}
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedItemIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <span className="text-xs font-medium text-red-800">
            {t('equipment.selectedCount', { count: selectedItemIds.size })}
          </span>
          <button
            type="button"
            onClick={() => setShowBulkDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('equipment.deleteSelected', { count: selectedItemIds.size })}
          </button>
        </div>
      )}

      {/* Category accordion list */}
      {sortedCategories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-8 text-center">
          <Package className={cn(ds.empty.icon, 'mx-auto')} />
          <p className={cn(ds.empty.title, 'text-xs')}>{t('equipment.noEquipment')}</p>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
          <SortableContext items={sortedCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {sortedCategories.map((category) => {
                const isOpen = openCategories.has(category.id)
                const categoryName = lang === 'hr' ? category.name_hr : category.name_en
                const sortedItems = [...category.items].sort((a, b) => a.sort_order - b.sort_order)

                return (
                  <SortableItem key={category.id} id={category.id} className="overflow-hidden rounded-md border border-border">
                    <div className="flex flex-1 items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggle(category.id)}
                        className="flex flex-1 items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                      >
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform',
                            isOpen && 'rotate-180'
                          )}
                        />
                        <span className="text-xs font-medium text-foreground">{categoryName}</span>
                        <span className={cn(ds.badge.base, ds.badge.muted, 'text-[10px]')}>
                          {category.items.length}
                        </span>
                      </button>

                      {isAdmin && (
                        <div className="flex items-center gap-0.5 pr-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCategoryId(category.id)
                              setShowItemForm(true)
                            }}
                            className={cn(ds.btn.base, ds.btn.icon, 'p-1')}
                            title={t('equipment.addItem')}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(category)}
                            className={cn(ds.btn.base, ds.btn.icon, 'p-1')}
                            title={t('equipment.editCategory')}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCategory(category)}
                            className={cn(ds.btn.base, ds.btn.icon, 'p-1 hover:bg-red-50 hover:text-red-600')}
                            title={t('equipment.deleteCategory')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Items list */}
                    {isOpen && (
                      <div className="border-t border-border">
                        {sortedItems.length === 0 ? (
                          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                            {t('equipment.noItemsInCategory')}
                          </div>
                        ) : (
                          <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleItemDragEnd(e, category.id)}>
                            <SortableContext items={sortedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                              {sortedItems.map((item) => (
                                <SortableItem key={item.id} id={item.id} className="px-1.5 py-1.5 even:bg-muted/30">
                                  <div className="flex flex-1 items-center justify-between px-1.5 py-0.5">
                                    <div className="flex min-w-0 items-center gap-2">
                                      {isAdmin && (
                                        <input
                                          type="checkbox"
                                          checked={selectedItemIds.has(item.id)}
                                          onChange={() => toggleItemSelection(item.id)}
                                          className="h-3.5 w-3.5 shrink-0 rounded border-border text-primary focus:ring-primary"
                                        />
                                      )}
                                      <span className="min-w-0 truncate text-xs text-foreground">
                                        {lang === 'hr' ? item.name_hr : item.name_en}
                                      </span>
                                      {item.is_standard && (
                                        <span className={cn(ds.badge.base, ds.badge.success, 'shrink-0 text-[10px]')}>
                                          {t('equipment.standard')}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-medium text-foreground">
                                        {item.is_standard ? '—' : formatPrice(item.price)}
                                      </span>
                                      {isAdmin && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => setEditingItem(item)}
                                            className={cn(ds.btn.base, ds.btn.icon, 'p-1')}
                                            title={t('equipment.editItem')}
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setDeletingItem(item)}
                                            className={cn(ds.btn.base, ds.btn.icon, 'p-1 hover:bg-red-50 hover:text-red-600')}
                                            title={t('equipment.deleteItem')}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </SortableItem>
                              ))}
                            </SortableContext>
                          </DndContext>
                        )}
                      </div>
                    )}
                  </SortableItem>
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Category Form — Create */}
      <EquipmentCategoryForm
        isOpen={showCategoryForm}
        onSubmit={handleCreateCategory}
        isLoading={createCategory.isPending}
        onCancel={() => setShowCategoryForm(false)}
      />

      {/* Category Form — Edit */}
      <EquipmentCategoryForm
        isOpen={!!editingCategory}
        defaultValues={
          editingCategory
            ? {
                name_hr: editingCategory.name_hr ?? undefined,
                name_en: editingCategory.name_en ?? undefined,
              }
            : undefined
        }
        onSubmit={handleUpdateCategory}
        isLoading={updateCategory.isPending}
        onCancel={() => setEditingCategory(null)}
      />

      {/* Item Form — Create */}
      <EquipmentItemForm
        isOpen={showItemForm}
        onSubmit={handleCreateItem}
        isLoading={createItem.isPending}
        onCancel={() => {
          setShowItemForm(false)
          setActiveCategoryId(null)
        }}
      />

      {/* Item Form — Edit */}
      <EquipmentItemForm
        isOpen={!!editingItem}
        defaultValues={
          editingItem
            ? {
                name_hr: editingItem.name_hr ?? undefined,
                name_en: editingItem.name_en ?? undefined,
                description_hr: editingItem.description_hr ?? undefined,
                description_en: editingItem.description_en ?? undefined,
                price: editingItem.price,
                is_standard: editingItem.is_standard,
              }
            : undefined
        }
        onSubmit={handleUpdateItem}
        isLoading={updateItem.isPending}
        onCancel={() => setEditingItem(null)}
      />

      {/* Delete Category Confirm */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        title={t('equipment.deleteCategoryTitle')}
        description={t('equipment.deleteCategoryConfirm', {
          name: deletingCategory
            ? lang === 'hr'
              ? deletingCategory.name_hr
              : deletingCategory.name_en
            : '',
          count: deletingCategory?.items.length ?? 0,
        })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isDangerous
        isLoading={deleteCategory.isPending}
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeletingCategory(null)}
      />

      {/* Delete Item Confirm */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        title={t('equipment.deleteItemTitle')}
        description={t('equipment.deleteItemConfirm', {
          name: deletingItem
            ? lang === 'hr'
              ? deletingItem.name_hr
              : deletingItem.name_en
            : '',
        })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isDangerous
        isLoading={deleteItem.isPending}
        onConfirm={handleDeleteItem}
        onCancel={() => setDeletingItem(null)}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title={t('equipment.deleteSelectedTitle')}
        description={t('equipment.deleteSelectedConfirm', { count: selectedItemIds.size })}
        confirmText={t('equipment.deleteSelected', { count: selectedItemIds.size })}
        cancelText={t('common.cancel')}
        isDangerous
        isLoading={deleteItems.isPending}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      {/* Copy Equipment Confirm */}
      <ConfirmDialog
        isOpen={showCopyConfirm && !!sourceBoatEquipment}
        title={t('equipment.copyEquipmentTitle')}
        description={
          sourceBoatEquipment
            ? t('equipment.copyConfirm', {
                categories: sourceBoatEquipment.length,
                items: sourceBoatEquipment.flatMap((c) => c.items).length,
                name: allBoats?.find((b) => b.id === copySourceBoatId)?.name ?? '',
              })
            : ''
        }
        confirmText={t('equipment.copyEquipmentTitle')}
        cancelText={t('common.cancel')}
        isLoading={copyEquipment.isPending}
        onConfirm={handleCopyConfirm}
        onCancel={() => {
          setShowCopyConfirm(false)
          setCopySourceBoatId(null)
        }}
      />
    </div>
  )
}

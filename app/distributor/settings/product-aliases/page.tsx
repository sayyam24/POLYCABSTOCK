'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import type { ProductAlias, Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Edit, Trash2, Merge, Check } from 'lucide-react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { toast } from 'sonner'

export default function ProductAliasesPage() {
  const { session } = useAuth()
  const [aliases, setAliases] = useState<ProductAlias[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAlias, setEditingAlias] = useState<ProductAlias | null>(null)
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set())
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    aliasName: '',
    productId: '',
  })

  useEffect(() => {
    loadData()
  }, [session])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/state', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load data')
      
      const data = await res.json()
      setAliases(data.productAliases || [])
      setProducts(data.products || [])
    } catch (err) {
      toast.error('Failed to load aliases')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.aliasName || !formData.productId) {
      toast.error('Please fill all fields')
      return
    }

    try {
      const product = products.find(p => p.id === formData.productId)
      if (!product) {
        toast.error('Product not found')
        return
      }

      electroTrackService.createProductAlias(
        formData.aliasName,
        formData.productId,
        product.name,
        session?.userId || ''
      )
      
      toast.success('Alias created successfully')
      setFormData({ aliasName: '', productId: '' })
      setShowCreateForm(false)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create alias')
    }
  }

  const handleUpdate = async () => {
    if (!editingAlias || !formData.aliasName || !formData.productId) {
      toast.error('Please fill all fields')
      return
    }

    try {
      const product = products.find(p => p.id === formData.productId)
      if (!product) {
        toast.error('Product not found')
        return
      }

      electroTrackService.updateProductAlias(editingAlias.id, {
        aliasName: formData.aliasName,
        productId: formData.productId,
        productName: product.name,
      })
      
      toast.success('Alias updated successfully')
      setEditingAlias(null)
      setFormData({ aliasName: '', productId: '' })
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update alias')
    }
  }

  const handleDelete = (aliasId: string) => {
    try {
      electroTrackService.deleteProductAlias(aliasId)
      toast.success('Alias deleted successfully')
      loadData()
    } catch (err) {
      toast.error('Failed to delete alias')
    }
  }

  const handleMerge = () => {
    if (selectedForMerge.size < 2 || !mergeTargetId) {
      toast.error('Select at least 2 aliases to merge')
      return
    }

    try {
      electroTrackService.mergeProductAliases(
        Array.from(selectedForMerge),
        mergeTargetId
      )
      toast.success('Aliases merged successfully')
      setSelectedForMerge(new Set())
      setMergeTargetId(null)
      loadData()
    } catch (err) {
      toast.error('Failed to merge aliases')
    }
  }

  const startEdit = (alias: ProductAlias) => {
    setEditingAlias(alias)
    setFormData({
      aliasName: alias.aliasName,
      productId: alias.productId,
    })
    setShowCreateForm(true)
  }

  const cancelEdit = () => {
    setEditingAlias(null)
    setFormData({ aliasName: '', productId: '' })
    setShowCreateForm(false)
  }

  const filteredAliases = aliases.filter(alias =>
    alias.aliasName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alias.productName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="Product Alias Management" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Product Aliases</CardTitle>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search aliases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="h-4 w-4 mr-2" />
                {showCreateForm ? 'Cancel' : 'New Alias'}
              </Button>
              {selectedForMerge.size > 0 && (
                <>
                  <Select value={mergeTargetId || ''} onValueChange={setMergeTargetId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(selectedForMerge).map(id => {
                        const alias = aliases.find(a => a.id === id)
                        return alias ? (
                          <SelectItem key={id} value={id}>{alias.aliasName}</SelectItem>
                        ) : null
                      })}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleMerge} variant="outline">
                    <Merge className="h-4 w-4 mr-2" />
                    Merge ({selectedForMerge.size})
                  </Button>
                </>
              )}
            </div>

            {showCreateForm && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-4">
                  {editingAlias ? 'Edit Alias' : 'Create New Alias'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Alias Name (Extracted from Invoice)</Label>
                    <Input
                      value={formData.aliasName}
                      onChange={(e) => setFormData({ ...formData, aliasName: e.target.value })}
                      placeholder="e.g., POLYCAB LED BULB 9W"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Product (From Product Master)</Label>
                    <Select value={formData.productId} onValueChange={(v) => setFormData({ ...formData, productId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={editingAlias ? handleUpdate : handleCreate}>
                    {editingAlias ? 'Update' : 'Create'}
                  </Button>
                  {editingAlias && (
                    <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                  )}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : filteredAliases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No aliases found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedForMerge.size === filteredAliases.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedForMerge(new Set(filteredAliases.map(a => a.id)))
                            } else {
                              setSelectedForMerge(new Set())
                            }
                          }}
                        />
                      </th>
                      <th className="text-left py-3 px-4">Alias Name</th>
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">Usage Count</th>
                      <th className="text-left py-3 px-4">Last Used</th>
                      <th className="text-left py-3 px-4">Created</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAliases.map((alias) => (
                      <tr key={alias.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedForMerge.has(alias.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedForMerge)
                              if (e.target.checked) {
                                newSet.add(alias.id)
                              } else {
                                newSet.delete(alias.id)
                              }
                              setSelectedForMerge(newSet)
                            }}
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">{alias.aliasName}</td>
                        <td className="py-3 px-4">{alias.productName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            {alias.usageCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {alias.lastUsedDate ? new Date(alias.lastUsedDate).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(alias.createdDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEdit(alias)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(alias.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredAliases.length} of {aliases.length} aliases
            </div>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}

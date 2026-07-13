import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAssets } from "@/hooks/useAssets"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, Eye, Edit, Layers, SlidersHorizontal, Trash2 } from "lucide-react"
import { ASSET_STATUSES, ASSET_CATEGORIES } from "@/lib/constants"
import { toast } from "sonner"

export function AssetListPage() {
  const { data: assets = [], isLoading, error } = useAssets()
  const navigate = useNavigate()

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Filter logic
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || asset.status === statusFilter

    const matchesCategory =
      categoryFilter === "all" || asset.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Quick stats
  const totalCount = assets.length
  const operationalCount = assets.filter((a) => a.status === "Operational").length
  const issueCount = assets.filter((a) => a.status === "Issue Reported").length
  const serviceCount = assets.filter((a) => ["Under Inspection", "Under Maintenance"].includes(a.status)).length
  const outOfServiceCount = assets.filter((a) => a.status === "Out of Service").length

  const handleResetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setCategoryFilter("all")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted rounded-md animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-md animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Registry"
        description="Monitor, audit, and register physical assets with generated QR labels."
        actions={
          <Button asChild>
            <Link to="/assets/new">
              <Plus className="h-4 w-4 mr-2" /> Register Asset
            </Link>
          </Button>
        }
      />

      {/* Aggregate Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-4 flex flex-col justify-center text-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Registered</span>
            <span className="text-2xl font-black mt-1 text-foreground">{totalCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-green-100 dark:border-green-950">
          <CardContent className="p-4 flex flex-col justify-center text-center">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Operational</span>
            <span className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{operationalCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-amber-100 dark:border-amber-950">
          <CardContent className="p-4 flex flex-col justify-center text-center">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Issue Reported</span>
            <span className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">{issueCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-purple-100 dark:border-purple-950">
          <CardContent className="p-4 flex flex-col justify-center text-center">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">In Service</span>
            <span className="text-2xl font-black mt-1 text-purple-600 dark:text-purple-400">{serviceCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-red-100 dark:border-red-950 col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex flex-col justify-center text-center">
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">Out of Service</span>
            <span className="text-2xl font-black mt-1 text-red-600 dark:text-red-400">{outOfServiceCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <Card className="border-border">
        <CardContent className="p-4 flex flex-col gap-4 md:flex-row md:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, name, location..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters:
            </div>
            
            {/* Status Select */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] text-xs h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ASSET_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Select */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] text-xs h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ASSET_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs h-9">
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Asset Table */}
      {filteredAssets.length === 0 ? (
        <EmptyState
          title="No assets found"
          description={
            searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "No assets match your search filters. Try clearing them or modifying query."
              : "No physical assets have been registered yet."
          }
          action={
            searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? { label: "Reset Filters", onClick: handleResetFilters }
              : { label: "Register First Asset", onClick: () => navigate("/assets/new") }
          }
        />
      ) : (
        <Card className="border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Asset Code</TableHead>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-bold text-xs text-foreground">
                      {asset.code}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {asset.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {asset.category}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {asset.location}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        asset.condition === "Excellent" || asset.condition === "Good"
                          ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                          : asset.condition === "Fair"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                          : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                      }`}>
                        {asset.condition}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={asset.status} type="asset" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          asChild
                          title="View details"
                        >
                          <Link to={`/assets/${asset.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          asChild
                          title="Edit asset"
                        >
                          <Link to={`/assets/${asset.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
export default AssetListPage

import React, { useState } from "react"
import { Link } from "react-router-dom"
import { useIssues } from "@/hooks/useIssues"
import { useAssets } from "@/hooks/useAssets"
import { useTechnicians } from "@/hooks/useTechnicians"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
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
import { Search, Eye, SlidersHorizontal, ShieldAlert, AlertTriangle, ClipboardList, Users } from "lucide-react"
import { ISSUE_STATUSES, PRIORITIES } from "@/lib/constants"
import { formatDate } from "@/lib/utils"

export function IssueListPage() {
  const { data: issues = [], isLoading: issuesLoading } = useIssues()
  const { data: assets = [], isLoading: assetsLoading } = useAssets()
  const { data: technicians = [], isLoading: techsLoading } = useTechnicians()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [techFilter, setTechFilter] = useState("all")

  const isLoading = issuesLoading || assetsLoading || techsLoading

  const assetMap = React.useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets])
  const techMap  = React.useMemo(() => new Map(technicians.map((t) => [t.id, t])), [technicians])

  const filteredIssues = issues.filter((issue) => {
    const asset = assetMap.get(issue.assetId)
    const matchesSearch =
      issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.issueNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset?.code?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus   = statusFilter === "all" || issue.status === statusFilter
    const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter
    const matchesTech =
      techFilter === "all" ||
      (techFilter === "unassigned" && !issue.assignedTo) ||
      issue.assignedTo === techFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesTech
  })

  const totalCount      = issues.length
  const criticalCount   = issues.filter((i) => i.priority === "Critical" && !["Resolved", "Closed"].includes(i.status)).length
  const openCount       = issues.filter((i) => !["Resolved", "Closed"].includes(i.status)).length
  const unassignedCount = issues.filter((i) => !i.assignedTo && !["Resolved", "Closed"].includes(i.status)).length

  const handleResetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setPriorityFilter("all")
    setTechFilter("all")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-muted/40 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/40 animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted/40 animate-pulse" />
      </div>
    )
  }

  // Priority row class helper
  const priorityRowClass = (priority) => {
    if (priority === "Critical") return "hazard-stripe-row"
    if (priority === "High") return "priority-bar-high"
    if (priority === "Medium") return "priority-bar-medium"
    return "priority-bar-low"
  }

  const hasActiveFilters = searchQuery || statusFilter !== "all" || priorityFilter !== "all" || techFilter !== "all"

  return (
    <div className="space-y-5">
      <PageHeader
        title="Issue Queue"
        description="All reported service requests — filter, assign, and manage from a single pipeline view."
      />

      {/* Metric Readouts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total tickets */}
        <div className="bg-card border border-border p-4">
          <span className="metric-readout-label">Total Tickets</span>
          <div className="metric-readout-value text-foreground mt-1">{totalCount}</div>
        </div>
        {/* Critical open */}
        <div className={`bg-card border p-4 ${criticalCount > 0 ? "border-l-[3px] border-l-red-600 border-border" : "border-border"}`}>
          <span className="metric-readout-label flex items-center gap-1">
            <ShieldAlert className="h-2.5 w-2.5" /> Critical Open
          </span>
          <div className={`metric-readout-value mt-1 ${criticalCount > 0 ? "text-red-600" : "text-foreground"}`}>
            {criticalCount}
          </div>
        </div>
        {/* Open pipeline */}
        <div className={`bg-card border p-4 ${openCount > 0 ? "border-l-[3px] border-l-amber-500 border-border" : "border-border"}`}>
          <span className="metric-readout-label">Open Pipeline</span>
          <div className={`metric-readout-value mt-1 ${openCount > 0 ? "text-amber-600" : "text-foreground"}`}>
            {openCount}
          </div>
        </div>
        {/* Unassigned */}
        <div className={`bg-card border p-4 ${unassignedCount > 0 ? "border-l-[3px] border-l-sky-600 border-border" : "border-border"}`}>
          <span className="metric-readout-label flex items-center gap-1">
            <Users className="h-2.5 w-2.5" /> Unassigned
          </span>
          <div className={`metric-readout-value mt-1 ${unassignedCount > 0 ? "text-sky-600" : "text-foreground"}`}>
            {unassignedCount}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-card border border-border p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search ticket, title, asset code..."
            className="pl-8 h-8 text-xs font-mono rounded-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" /> Filter:
          </span>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] text-xs h-8 rounded-none font-mono">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">All Statuses</SelectItem>
              {ISSUE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[120px] text-xs h-8 rounded-none font-mono">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="w-[150px] text-xs h-8 rounded-none font-mono">
              <SelectValue placeholder="Technician" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">All Technicians</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {technicians.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs h-8 rounded-none font-mono">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Issues Table */}
      {filteredIssues.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No matching tickets." : "Issue queue is clear."}
          description={
            hasActiveFilters
              ? "No tickets match your filter criteria. Try adjusting or clearing the filters above."
              : "All issue registers are clear. No service complaints on file."
          }
          action={hasActiveFilters ? { label: "Clear Filters", onClick: handleResetFilters } : null}
          icon={<ClipboardList className="h-8 w-8 text-muted-foreground/40" />}
        />
      ) : (
        <div className="bg-card border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground w-[110px]">Ticket #</TableHead>
                <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Asset</TableHead>
                <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Issue Title</TableHead>
                <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Priority</TableHead>
                <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Status</TableHead>
                <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Assigned To</TableHead>
                <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Reported</TableHead>
                <TableHead className="text-right font-mono text-[9px] tracking-widest uppercase text-muted-foreground">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue) => {
                const asset = assetMap.get(issue.assetId)
                const tech  = techMap.get(issue.assignedTo)
                return (
                  <TableRow
                    key={issue.id}
                    className={`hover:bg-muted/20 transition-colors relative ${priorityRowClass(issue.priority)}`}
                    style={{ paddingLeft: "1.25rem" }}
                  >
                    <TableCell className="font-mono font-bold text-xs text-foreground pl-5">
                      {issue.issueNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-[10px] text-muted-foreground leading-tight">
                          {asset?.code || "—"}
                        </span>
                        <span className="font-medium text-foreground text-xs truncate max-w-[130px]">
                          {asset?.name || "Unknown Asset"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-xs truncate max-w-[150px]">
                      {issue.title}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={issue.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={issue.status} type="issue" />
                    </TableCell>
                    <TableCell className="text-xs">
                      {tech ? (
                        <span className="font-semibold text-foreground">{tech.name}</span>
                      ) : (
                        <span className="font-mono text-[10px] text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      {formatDate(issue.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" asChild className="rounded-none h-7 w-7">
                        <Link to={`/issues/${issue.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
export default IssueListPage

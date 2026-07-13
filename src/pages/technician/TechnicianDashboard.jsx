import React from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useIssues } from "@/hooks/useIssues"
import { useAssets } from "@/hooks/useAssets"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SummaryCard } from "@/components/dashboard/SummaryCard"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ClipboardList, ArrowRight, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { formatDate } from "@/lib/utils"

export function TechnicianDashboard() {
  const { userProfile } = useAuth()
  const { data: issues = [], isLoading: issuesLoading } = useIssues()
  const { data: assets = [], isLoading: assetsLoading } = useAssets()

  const isLoading = issuesLoading || assetsLoading

  // Map assets for quick lookup
  const assetMap = React.useMemo(() => {
    return new Map(assets.map((a) => [a.id, a]))
  }, [assets])

  // Filter issues assigned to current technician
  const myIssues = React.useMemo(() => {
    return issues.filter((i) => i.assignedTo === userProfile?.id)
  }, [issues, userProfile])

  // Split into active (unresolved) and completed issues
  const activeIssues = myIssues.filter((i) => !["Resolved", "Closed"].includes(i.status))
  const completedIssues = myIssues.filter((i) => ["Resolved", "Closed"].includes(i.status))

  // Stats
  const assignedCount = activeIssues.filter((i) => i.status === "Assigned").length
  const inProgressCount = activeIssues.filter((i) => ["Inspection Started", "Maintenance In Progress", "Waiting for Parts"].includes(i.status)).length
  const resolvedCount = completedIssues.length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  const getPriorityRowClass = (priority) => {
    if (priority === "Critical") return "hazard-stripe-row"
    if (priority === "High") return "priority-bar-high"
    if (priority === "Medium") return "priority-bar-medium"
    return "priority-bar-low"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Workbench — ${userProfile?.name || "Technician"}`}
        description="Inspect assigned assets, update maintenance statuses, and file service reports."
      />

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          label="Pending Inspections"
          value={assignedCount}
          icon={<Clock className="h-4 w-4" />}
          description="Awaiting diagnostic start"
          variant={assignedCount > 0 ? "warning" : "default"}
        />
        <SummaryCard
          label="Work In Progress"
          value={inProgressCount}
          icon={<ClipboardList className="h-4 w-4" />}
          description="Active service tasks"
          variant={inProgressCount > 0 ? "overdue" : "default"}
        />
        <SummaryCard
          label="Resolved Tickets"
          value={resolvedCount}
          icon={<CheckCircle className="h-4 w-4" />}
          description="Total resolved database log"
        />
      </div>

      {/* Active Assignments Queue */}
      <Card className="border-border rounded-none shadow-xs">
        <CardHeader className="border-b border-border py-3 px-4 bg-muted/20">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5" />
            My Active Assignments ({activeIssues.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeIssues.length === 0 ? (
            <EmptyState
              title="Workbench Clear."
              description="You have no active maintenance assignments. All units nominal."
              className="border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground w-[120px]">Issue Number</TableHead>
                    <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Asset Code/Name</TableHead>
                    <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Issue Title</TableHead>
                    <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Priority</TableHead>
                    <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Status</TableHead>
                    <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Assigned Date</TableHead>
                    <TableHead className="text-right font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeIssues.map((issue) => {
                    const asset = assetMap.get(issue.assetId)

                    return (
                      <TableRow
                        key={issue.id}
                        className={`hover:bg-muted/20 transition-colors relative ${getPriorityRowClass(issue.priority)}`}
                        style={{ paddingLeft: "1.25rem" }}
                      >
                        <TableCell className="font-mono font-bold text-xs text-foreground pl-5">
                          {issue.issueNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-[10px] text-muted-foreground">
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
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {formatDate(issue.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" asChild className="rounded-none h-7">
                            <Link to={`/issues/${issue.id}`}>
                              Start Work <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
        </CardContent>
      </Card>

      {/* Completed Assignments Queue */}
      <Card className="border-border rounded-none shadow-xs">
        <CardHeader className="border-b border-border py-3 px-4 bg-muted/20">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5" />
            My Resolved / Closed Tickets ({completedIssues.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {completedIssues.length === 0 ? (
            <EmptyState
              title="No history logged."
              description="No resolved or completed assignments on record."
              className="border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground w-[120px]">Issue Number</TableHead>
                    <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Asset Code/Name</TableHead>
                    <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Issue Title</TableHead>
                    <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Priority</TableHead>
                    <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Status</TableHead>
                    <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Completed Date</TableHead>
                    <TableHead className="text-right font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedIssues.map((issue) => {
                    const asset = assetMap.get(issue.assetId)

                    return (
                      <TableRow key={issue.id} className="hover:bg-muted/20 opacity-75">
                        <TableCell className="font-mono font-bold text-xs">
                          {issue.issueNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono text-[9px] text-muted-foreground">
                              {asset?.code || "—"}
                            </span>
                            <span className="font-medium text-xs truncate max-w-[130px]">
                              {asset?.name || "Unknown Asset"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs truncate max-w-[150px]">{issue.title}</TableCell>
                        <TableCell>
                          <PriorityBadge priority={issue.priority} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={issue.status} type="issue" />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {formatDate(issue.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" asChild className="rounded-none h-7">
                            <Link to={`/issues/${issue.id}`}>
                              View Log <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
        </CardContent>
      </Card>
    </div>
  )
}
export default TechnicianDashboard

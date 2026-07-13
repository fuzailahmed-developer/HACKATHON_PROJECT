import React from "react"
import { Navigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useAssets } from "@/hooks/useAssets"
import { useIssues } from "@/hooks/useIssues"
import { SummaryCard } from "@/components/dashboard/SummaryCard"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Boxes,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  CalendarClock,
  Plus,
  ArrowRight,
} from "lucide-react"
import { isServiceOverdue } from "@/lib/utils"
import { ClipboardCheck } from "lucide-react"

export function DashboardPage() {
  const { userProfile, isAdmin } = useAuth()
  const { data: assets = [], isLoading: assetsLoading } = useAssets()
  const { data: issues = [], isLoading: issuesLoading } = useIssues()

  if (userProfile?.role === "Technician") {
    return <Navigate to="/technician" replace />
  }

  if (userProfile?.role === "Employee") {
    return <Navigate to="/employee" replace />
  }

  const isLoading = assetsLoading || issuesLoading

  const totalAssets = assets.length

  const openIssues = issues.filter(
    (i) => !["Resolved", "Closed"].includes(i.status)
  )
  const openIssuesCount = openIssues.length

  const criticalIssuesCount = issues.filter(
    (i) => i.priority === "Critical" && !["Resolved", "Closed"].includes(i.status)
  ).length

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const resolvedThisWeekCount = issues.filter((i) => {
    if (!["Resolved", "Closed"].includes(i.status)) return false
    const date = i.updatedAt?.toDate ? i.updatedAt.toDate() : new Date(i.updatedAt)
    return date >= oneWeekAgo
  }).length

  const dueForServiceCount = assets.filter((a) => {
    if (a.status === "Retired") return false
    if (!a.nextServiceDate) return false
    return isServiceOverdue(a.nextServiceDate)
  }).length

  const recentIssues = issues.slice(0, 5)

  const issuesReportedAssets = assets
    .filter((a) => a.status === "Issue Reported" || a.status === "Out of Service")
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-muted/40 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-muted/40 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-muted/40 animate-pulse" />
          <div className="h-64 bg-muted/40 animate-pulse" />
        </div>
      </div>
    )
  }

  // Helper: priority row class
  const priorityRowClass = (priority) => {
    if (priority === "Critical") return "hazard-stripe-row"
    if (priority === "High") return "priority-bar-high"
    if (priority === "Medium") return "priority-bar-medium"
    return "priority-bar-low"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${userProfile?.name || "Administrator"} — Ops Center`}
        description="Live status of physical assets and active maintenance pipeline."
        actions={
          <Button asChild size="sm">
            <Link to="/assets/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Register Asset
            </Link>
          </Button>
        }
      />

      {/* Metric Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard
          label="Total Assets"
          value={totalAssets}
          icon={<Boxes className="h-4 w-4" />}
          description="Registered in database"
        />
        <SummaryCard
          label="Open Issues"
          value={openIssuesCount}
          icon={<ClipboardList className="h-4 w-4" />}
          description="Active repair requests"
          variant={openIssuesCount > 0 ? "warning" : "default"}
        />
        <SummaryCard
          label="Critical"
          value={criticalIssuesCount}
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Requires immediate action"
          variant={criticalIssuesCount > 0 ? "critical" : "default"}
        />
        <SummaryCard
          label="Resolved 7d"
          value={resolvedThisWeekCount}
          icon={<CheckCircle className="h-4 w-4" />}
          description="Completed this week"
        />
        <SummaryCard
          label="Svc Overdue"
          value={dueForServiceCount}
          icon={<CalendarClock className="h-4 w-4" />}
          description="Past scheduled checkup"
          variant={dueForServiceCount > 0 ? "overdue" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Active Issues */}
        <Card className="border-border rounded-none">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ClipboardList className="h-3.5 w-3.5" />
              Recent Service Requests
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 rounded-none font-mono">
              <Link to="/issues">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentIssues.length === 0 ? (
              <EmptyState
                title="Workbench clear."
                description="No active service requests in the pipeline. All units reporting operational."
                className="border-0 rounded-none"
              />
            ) : (
              <div className="divide-y divide-border/50">
                {recentIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors relative ${priorityRowClass(issue.priority)}`}
                    style={{ paddingLeft: issue.priority === "Critical" || issue.priority === "High" || issue.priority === "Medium" || issue.priority === "Low" ? "1.25rem" : "1rem" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] font-bold text-muted-foreground shrink-0">
                          {issue.issueNumber}
                        </span>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {issue.title}
                        </span>
                      </div>
                      <p className="font-mono text-[9px] text-muted-foreground truncate">
                        {issue.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <PriorityBadge priority={issue.priority} />
                      <Button size="icon-sm" variant="ghost" asChild className="rounded-none h-6 w-6">
                        <Link to={`/issues/${issue.id}`}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets Requiring Attention */}
        <Card className="border-border rounded-none">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Boxes className="h-3.5 w-3.5" />
              Assets Requiring Attention
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 rounded-none font-mono">
              <Link to="/assets">
                View Registry <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {issuesReportedAssets.length === 0 ? (
              <EmptyState
                title="All assets operational."
                description="No physical assets are currently flagged. System status nominal."
                icon={<CheckCircle className="h-8 w-8 text-emerald-600/40" />}
                className="border-0 rounded-none"
              />
            ) : (
              <div className="divide-y divide-border/50">
                {issuesReportedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors relative ${asset.status === "Out of Service" ? "hazard-stripe-row" : "priority-bar-high"}`}
                    style={{ paddingLeft: "1.25rem" }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] font-bold text-muted-foreground shrink-0">
                          {asset.code}
                        </span>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {asset.name}
                        </span>
                      </div>
                      <p className="font-mono text-[9px] text-muted-foreground">
                        {asset.location} · {asset.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <StatusBadge status={asset.status} type="asset" />
                      <Button size="icon-sm" variant="ghost" asChild className="rounded-none h-6 w-6">
                        <Link to={`/assets/${asset.id}`}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export default DashboardPage

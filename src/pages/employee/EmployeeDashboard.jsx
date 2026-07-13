import React from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useMyIssues } from "@/hooks/useIssues"
import { useAssets } from "@/hooks/useAssets"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { SummaryCard } from "@/components/dashboard/SummaryCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ClipboardList,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  QrCode,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

export function EmployeeDashboard() {
  const { userProfile } = useAuth()
  const { data: myIssues = [], isLoading: issuesLoading } = useMyIssues(
    userProfile?.id
  )
  const { data: assets = [], isLoading: assetsLoading } = useAssets()

  const isLoading = issuesLoading || assetsLoading

  // Map assets for quick lookup
  const assetMap = React.useMemo(() => {
    return new Map(assets.map((a) => [a.id, a]))
  }, [assets])

  // Counts
  const openIssues = myIssues.filter(
    (i) => !["Resolved", "Closed"].includes(i.status)
  )
  const resolvedIssues = myIssues.filter((i) =>
    ["Resolved", "Closed"].includes(i.status)
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse" />
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
        title={`${userProfile?.name || "Employee"} — My Reports`}
        description="View your submitted issue reports and track their progress."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          label="Total Reports"
          value={myIssues.length}
          icon={<ClipboardList className="h-4 w-4" />}
          description="Issues you have submitted"
        />
        <SummaryCard
          label="Open / Active"
          value={openIssues.length}
          icon={<Clock className="h-4 w-4" />}
          description="Awaiting resolution"
          variant={openIssues.length > 0 ? "warning" : "default"}
        />
        <SummaryCard
          label="Resolved"
          value={resolvedIssues.length}
          icon={<CheckCircle className="h-4 w-4" />}
          description="Completed repairs"
        />
      </div>

      {/* How to Report — instruction banner */}
      <div className="bg-card border border-border p-4 flex items-start gap-3">
        <QrCode className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[9px] font-bold tracking-widest uppercase text-muted-foreground mb-1">
            How to Report an Issue
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Scan the QR code on any registered asset, or visit its public page
            link, then click <strong>"Report Issue"</strong>. Your account will
            be automatically attached as the reporter.
          </p>
        </div>
      </div>

      {/* Active Issues */}
      <Card className="border-border rounded-none shadow-xs">
        <CardHeader className="border-b border-border py-3 px-4 bg-muted/20">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5" />
            Open Reports ({openIssues.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {openIssues.length === 0 ? (
            <EmptyState
              title="No open reports."
              description="You have no pending issue reports. Scan an asset QR code to file a new report."
              className="border-0"
            />
          ) : (
            <div className="divide-y divide-border/50">
              {openIssues.map((issue) => {
                const asset = assetMap.get(issue.assetId)
                return (
                  <div
                    key={issue.id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors relative ${getPriorityRowClass(
                      issue.priority
                    )}`}
                    style={{ paddingLeft: "1.25rem" }}
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
                        {asset?.name || "Unknown Asset"} · {asset?.code || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <StatusBadge status={issue.status} type="issue" />
                      <PriorityBadge priority={issue.priority} />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        asChild
                        className="rounded-none h-6 w-6"
                      >
                        <Link to={`/track/${issue.issueNumber}`}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolved Issues */}
      {resolvedIssues.length > 0 && (
        <Card className="border-border rounded-none shadow-xs">
          <CardHeader className="border-b border-border py-3 px-4 bg-muted/20">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5" />
              Resolved Reports ({resolvedIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {resolvedIssues.map((issue) => {
                const asset = assetMap.get(issue.assetId)
                return (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors opacity-75"
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
                        {asset?.name || "Unknown Asset"} ·{" "}
                        {formatDate(issue.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <StatusBadge status={issue.status} type="issue" />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        asChild
                        className="rounded-none h-6 w-6"
                      >
                        <Link to={`/track/${issue.issueNumber}`}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EmployeeDashboard

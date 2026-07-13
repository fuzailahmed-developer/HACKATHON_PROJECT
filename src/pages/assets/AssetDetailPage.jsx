import React from "react"
import { useParams, Link } from "react-router-dom"
import { useAsset } from "@/hooks/useAssets"
import { useIssues } from "@/hooks/useIssues"
import { useAssetHistoryFull } from "@/hooks/useAssetHistory"
import { QRCodeDisplay } from "@/components/assets/QRCodeDisplay"
import { PrintableLabel } from "@/components/assets/PrintableLabel"
import { AssetTimeline } from "@/components/history/AssetTimeline"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Edit,
  Loader2,
  Calendar,
  MapPin,
  ClipboardList,
  AlertTriangle,
  History,
} from "lucide-react"
import { formatDate, formatRelativeDate } from "@/lib/utils"

export function AssetDetailPage() {
  const { id } = useParams()

  // Fetch asset, issues, and audit history
  const { data: asset, isLoading: assetLoading, error: assetError } = useAsset(id)
  const { data: issues = [], isLoading: issuesLoading } = useIssues()
  const { data: history = [], isLoading: historyLoading } = useAssetHistoryFull(id)

  const isLoading = assetLoading || issuesLoading || historyLoading

  if (assetError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
        <h3 className="font-bold text-lg">Failed to load asset</h3>
        <p className="text-sm text-muted-foreground mt-1">{assetError.message}</p>
        <Button asChild className="mt-4" size="sm">
          <Link to="/assets">Back to Registry</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-muted rounded animate-pulse" />
            <div className="h-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // Filter issues corresponding to this asset
  const assetIssues = issues.filter((issue) => issue.assetId === id)

  // Quick info fields
  const infoFields = [
    { label: "Category", value: asset.category },
    { label: "Location", value: asset.location, icon: <MapPin className="h-3.5 w-3.5 mr-1" /> },
    { label: "Current Condition", value: asset.condition },
    { label: "Last Service", value: formatDate(asset.lastServiceDate) },
    { label: "Next Scheduled Service", value: formatDate(asset.nextServiceDate), icon: <Calendar className="h-3.5 w-3.5 mr-1" /> },
    { label: "Registered At", value: formatDate(asset.createdAt) },
  ]

  return (
    <div className="space-y-6">
      {/* Printable Label View (Only renders when printing) */}
      <PrintableLabel asset={asset} />

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
          <Link to="/assets">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Link>
        </Button>
        <Button size="sm" variant="outline" asChild className="h-8 text-xs">
          <Link to={`/assets/${asset.id}/edit`}>
            <Edit className="h-4 w-4 mr-1.5" /> Edit Specifications
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`${asset.name} (${asset.code})`}
        description="Physical asset specifications, scannable codes, issue queue, and service logs."
        actions={<StatusBadge status={asset.status} type="asset" className="text-sm px-3.5 py-1" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Specifications & Issues */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Specifications Card */}
          <Card className="border-border rounded-none shadow-xs">
            <CardHeader className="border-b border-border py-3 px-4 bg-muted/20">
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">Specifications</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <dl className="grid grid-cols-1 sm:grid-cols-2 text-xs">
                {infoFields.map((field, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center px-4 py-3 border-b border-border/40 hover:bg-muted/10 transition-colors"
                  >
                    <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {field.label}
                    </dt>
                    <dd className="font-mono font-bold text-foreground flex items-center">
                      {field.icon}
                      {field.value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Active Issue Queue Card */}
          <Card className="border-border rounded-none shadow-xs">
            <CardHeader className="border-b border-border py-3 px-4 bg-muted/20">
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                Linked Issues ({assetIssues.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {assetIssues.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground font-mono">
                  No issues have been reported for this asset.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground w-[110px]">Number</TableHead>
                        <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Title</TableHead>
                        <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Priority</TableHead>
                        <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Status</TableHead>
                        <TableHead className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assetIssues.map((issue) => {
                        const rowClass = 
                          issue.priority === "Critical" ? "hazard-stripe-row" :
                          issue.priority === "High" ? "priority-bar-high" :
                          issue.priority === "Medium" ? "priority-bar-medium" :
                          "priority-bar-low";
                        
                        return (
                          <TableRow
                            key={issue.id}
                            className={`hover:bg-muted/25 transition-colors relative ${rowClass}`}
                            style={{ paddingLeft: "1.25rem" }}
                          >
                            <TableCell className="font-mono font-bold text-xs pl-5">
                              <Link to={`/issues/${issue.id}`} className="hover:underline text-primary">
                                {issue.issueNumber}
                              </Link>
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
                            <TableCell className="font-mono text-[10px] text-muted-foreground">
                              {formatRelativeDate(issue.updatedAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit History Timeline Card */}
          <Card className="border-border rounded-none shadow-xs">
            <CardHeader className="border-b border-border py-3 px-4 bg-muted/20">
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <AssetTimeline history={history} isPublic={false} />
            </CardContent>
          </Card>

        </div>

        {/* Digital Identity Side Card */}
        <div className="space-y-6">
          <QRCodeDisplay asset={asset} />
        </div>
      </div>
    </div>
  )
}
export default AssetDetailPage

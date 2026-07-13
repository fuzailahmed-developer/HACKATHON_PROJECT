import React, { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useIssue, useUpdateIssue } from "@/hooks/useIssues"
import { useAsset } from "@/hooks/useAssets"
import { useTechnicians } from "@/hooks/useTechnicians"
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { PageHeader } from "@/components/shared/PageHeader"
import { MaintenanceForm } from "@/components/maintenance/MaintenanceForm"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  UserPlus,
  Wrench,
  Sparkles,
  Paperclip,
  CheckCircle,
} from "lucide-react"
import { getValidTransitions, getTransitionActionLabel, getTransitionButtonVariant } from "@/lib/statusTransitions"
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

export function IssueDetailPage() {
  const { id } = useParams()
  const { userProfile, isAdmin, isTechnician } = useAuth()

  // Fetch issue details, technicians, maintenance records
  const { data: issue, isLoading: issueLoading, error: issueError } = useIssue(id)
  const { data: technicians = [] } = useTechnicians()
  const { data: records = [], isLoading: recordsLoading } = useMaintenanceRecords(id)
  
  // Fetch asset details (only if issue has assetId)
  const { data: asset, isLoading: assetLoading } = useAsset(issue?.assetId)

  const updateIssueMutation = useUpdateIssue()

  const [selectedTech, setSelectedTech] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [isStatusTransitioning, setIsStatusTransitioning] = useState(false)
  const [maintenanceFormOpen, setMaintenanceFormOpen] = useState(false)

  const isLoading = issueLoading || assetLoading || recordsLoading

  if (issueError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
        <h3 className="font-bold text-lg">Failed to load issue</h3>
        <p className="text-sm text-muted-foreground mt-1">{issueError.message}</p>
        <Button asChild className="mt-4" size="sm">
          <Link to="/issues">Back to Issues List</Link>
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

  const assignedTech = technicians.find((t) => t.id === issue.assignedTo)
  const validTransitions = getValidTransitions(issue.status)

  // Enforce technician assignment check
  const isAssignedToMe = issue.assignedTo === userProfile?.id
  const canUpdateStatus = isAdmin || (isTechnician && isAssignedToMe)

  // Handle technician assignment
  const handleAssign = async () => {
    if (!selectedTech) {
      toast.error("Please select a technician first.")
      return
    }
    
    setIsAssigning(true)
    try {
      const techName = technicians.find((t) => t.id === selectedTech)?.name || "Technician"
      await updateIssueMutation.mutateAsync({
        issueId: id,
        updates: { assignedTo: selectedTech },
        technicianName: techName,
      })
      toast.success("Technician assigned successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to assign technician.")
    } finally {
      setIsAssigning(false)
    }
  }

  // Handle standard status transition
  const handleTransition = async (nextStatus) => {
    if (nextStatus === "Resolved") {
      setMaintenanceFormOpen(true)
      return
    }

    setIsStatusTransitioning(true)
    try {
      await updateIssueMutation.mutateAsync({
        issueId: id,
        updates: { status: nextStatus },
      })
      toast.success(`Status updated to ${nextStatus}`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to transition status.")
    } finally {
      setIsStatusTransitioning(false)
    }
  }

  const handleMaintenanceSuccess = () => {
    setMaintenanceFormOpen(false)
    // Now trigger status transition to Resolved
    updateIssueMutation.mutate({
      issueId: id,
      updates: { status: "Resolved" },
    })
  }

  return (
    <div className="space-y-6">
      {/* Maintenance Form Modal Dialog */}
      <Dialog open={maintenanceFormOpen} onOpenChange={setMaintenanceFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Maintenance Log</DialogTitle>
            <DialogDescription>
              A maintenance record is required to resolve this ticket and return the asset to Operational.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <MaintenanceForm
              issueId={id}
              assetId={issue.assetId}
              onSuccess={handleMaintenanceSuccess}
              onCancel={() => setMaintenanceFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
          <Link to={isTechnician ? "/technician" : "/issues"}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`${issue.title} (${issue.issueNumber})`}
        description="Review reporter complaint, inspect AI diagnostic predictions, assign resources, and log resolutions."
        actions={<StatusBadge status={issue.status} type="issue" className="text-sm px-3.5 py-1" />}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Issue Details & Records */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Details Card */}
          <Card className="border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">Ticket Details</CardTitle>
              <PriorityBadge priority={issue.priority} />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wide">
                  Complaint Description
                </Label>
                <p className="text-sm text-foreground mt-1 bg-muted/40 p-3 rounded-lg border leading-relaxed">
                  {issue.description}
                </p>
              </div>

              {/* Grid of basic fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <span className="block text-muted-foreground font-semibold uppercase">Category</span>
                  <span className="text-foreground font-bold text-sm block mt-0.5">{issue.category}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground font-semibold uppercase">Reported At</span>
                  <span className="text-foreground font-bold text-sm block mt-0.5">{formatDateTime(issue.createdAt)}</span>
                </div>
              </div>

              {/* Reporter details - PROTECTED (Admin/Tech only) */}
              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wide">
                  Reporter Information (Internal Only)
                </Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-1 bg-muted/20 p-3 rounded-lg border border-border/60">
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Reporter Name</span>
                    <span className="font-semibold text-foreground text-xs">{issue.reporterName || "Anonymous guest"}</span>
                  </div>
                  {issue.reporterContact && (
                    <div>
                      <span className="block text-[10px] text-muted-foreground uppercase">Reporter Contact</span>
                      <span className="font-mono text-foreground text-xs">{issue.reporterContact}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Evidence Urls */}
              {issue.evidenceUrls && issue.evidenceUrls.length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wide flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" /> Evidence Attachments ({issue.evidenceUrls.length})
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {issue.evidenceUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border rounded-lg overflow-hidden h-20 bg-muted/55 hover:border-primary transition-colors flex items-center justify-center text-xs text-muted-foreground"
                      >
                        {url.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                          <img src={url} alt={`Evidence ${i+1}`} className="w-full h-full object-cover" />
                        ) : (
                          <span>View Attachment {i+1}</span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Asset Card */}
          {asset && (
            <Card className="border-border shadow-xs hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Linked Asset</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-foreground">{asset.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Code: <span className="font-mono font-bold">{asset.code}</span> &bull; Location: {asset.location}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={asset.status} type="asset" />
                  {!isTechnician && (
                    <Button variant="outline" size="sm" asChild className="text-xs h-8">
                      <Link to={`/assets/${asset.id}`}>View Asset</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maintenance Records logs */}
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                Maintenance Record Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {records.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No maintenance records registered for this issue.
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4 bg-card shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-bold text-foreground">Resolved Log</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDateTime(rec.completedAt)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
                        <div>
                          <span className="block text-muted-foreground font-semibold uppercase">Findings</span>
                          <p className="text-foreground mt-0.5 font-medium">{rec.findings}</p>
                        </div>
                        <div>
                          <span className="block text-muted-foreground font-semibold uppercase">Actions Taken</span>
                          <p className="text-foreground mt-0.5 font-medium">{rec.actionsTaken}</p>
                        </div>
                      </div>

                      {rec.partsUsed && rec.partsUsed.length > 0 && (
                        <div className="text-xs pt-1">
                          <span className="block text-muted-foreground font-semibold uppercase mb-1">Parts Replaced</span>
                          <div className="flex flex-wrap gap-1">
                            {rec.partsUsed.map((part, index) => (
                              <span key={index} className="bg-muted border text-foreground px-2 py-0.5 rounded text-[10px] font-semibold">
                                {part}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 text-[10px] border-t pt-2 mt-2 text-muted-foreground">
                        <div>
                          Cost: <span className="font-semibold text-foreground text-xs">{formatCurrency(rec.cost)}</span>
                        </div>
                        <div>
                          Labor: <span className="font-semibold text-foreground text-xs">{rec.timeSpentMinutes} min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Administration Actions & AI Triage */}
        <div className="space-y-6">
          
          {/* Assignment Card */}
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold">Resource Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Assignee info */}
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Assigned Tech</span>
                {assignedTech ? (
                  <div className="mt-1.5 flex items-center gap-2.5 p-2 rounded-lg border bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                      {assignedTech.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-foreground leading-tight">{assignedTech.name}</h5>
                      <span className="text-[10px] text-muted-foreground">{assignedTech.email}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 font-medium">
                    This ticket is currently unassigned.
                  </div>
                )}
              </div>

              {/* Admin assignments modification */}
              {isAdmin && (
                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="tech-select" className="text-xs text-muted-foreground uppercase font-bold tracking-wide">
                    Change Assignee
                  </Label>
                  <div className="flex gap-2">
                    <Select onValueChange={setSelectedTech} defaultValue={issue.assignedTo || ""}>
                      <SelectTrigger id="tech-select" className="h-9 text-xs">
                        <SelectValue placeholder="Select technician" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleAssign} disabled={isAssigning} className="h-9 text-xs shrink-0">
                      {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Transitions Card */}
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold">Workflow Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Warning if tech is trying to update issues assigned to others */}
              {!canUpdateStatus && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg font-semibold mb-2">
                  Workflow controls are locked. Only the assigned technician or administrator can update this ticket.
                </div>
              )}

              {canUpdateStatus && validTransitions.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-2 bg-muted p-2 rounded-lg border">
                  This issue is resolved/closed. No further workflow transitions available.
                </div>
              )}

              {canUpdateStatus && validTransitions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-1">
                    Transition Ticket Status
                  </span>
                  {validTransitions.map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      variant={getTransitionButtonVariant(nextStatus)}
                      onClick={() => handleTransition(nextStatus)}
                      disabled={isStatusTransitioning}
                      className="w-full text-xs h-9 justify-start"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 rotate-180 mr-2 shrink-0" />
                      {getTransitionActionLabel(nextStatus)}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Triage Card */}
          {issue.aiSuggested && (
            <Card className="border-border shadow-xs bg-muted/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  AI Suggested Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Classifications */}
                <div className="grid grid-cols-2 gap-2 border-b pb-3">
                  <div>
                    <span className="block text-muted-foreground font-semibold uppercase">Category</span>
                    <span className="font-bold text-foreground mt-0.5 block">{issue.aiSuggested.category}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground font-semibold uppercase">Priority</span>
                    <span className="font-bold text-foreground mt-0.5 block">{issue.aiSuggested.priority}</span>
                  </div>
                </div>

                {/* Safety Warning */}
                {issue.aiSuggested.safetyWarning && (
                  <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-900 font-semibold leading-relaxed">
                    <span className="font-bold text-red-800 dark:text-red-300 block mb-0.5 uppercase tracking-wide text-[9px]">
                      ⚠️ AI Safety Warning
                    </span>
                    {issue.aiSuggested.safetyWarning}
                  </div>
                )}

                {/* Possible root causes */}
                {issue.aiSuggested.possibleCauses && issue.aiSuggested.possibleCauses.length > 0 && (
                  <div>
                    <span className="block text-muted-foreground font-semibold uppercase mb-1">
                      Possible Root Causes
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-foreground leading-normal pl-1">
                      {issue.aiSuggested.possibleCauses.map((cause, i) => (
                        <li key={i}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Initial diagnostic checks */}
                {issue.aiSuggested.initialChecks && issue.aiSuggested.initialChecks.length > 0 && (
                  <div>
                    <span className="block text-muted-foreground font-semibold uppercase mb-1">
                      Initial Diagnostic Checks
                    </span>
                    <ul className="list-decimal list-inside space-y-1 text-foreground leading-normal pl-1">
                      {issue.aiSuggested.initialChecks.map((check, i) => (
                        <li key={i}>{check}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* User Edit Flag */}
                <div className="text-[10px] text-muted-foreground text-right border-t pt-2">
                  AI suggestions were {issue.aiSuggested.wasEdited ? "edited by reporter" : "submitted unmodified"}.
                </div>
              </CardContent>
            </Card>
          )}

        </div>

      </div>
    </div>
  )
}
export default IssueDetailPage

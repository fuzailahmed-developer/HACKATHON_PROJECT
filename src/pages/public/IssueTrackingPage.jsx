import React, { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useIssueByNumber } from "@/hooks/useIssues"
import { useAsset } from "@/hooks/useAssets"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import {
  AlertTriangle,
  Loader2,
  Search,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ClipboardList,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

export function IssueTrackingPage() {
  const { issueNumber } = useParams()
  const navigate = useNavigate()
  const isLookup = issueNumber === "lookup"

  const [lookupQuery, setLookupQuery] = useState("")

  // Fetch issue details by number (if not in lookup mode)
  const { data: issue, isLoading: issueLoading, error } = useIssueByNumber(!isLookup ? issueNumber : null)
  
  // Fetch asset details (only if issue is loaded and has assetId)
  const { data: asset, isLoading: assetLoading } = useAsset(issue?.assetId)

  const isLoading = !isLookup && (issueLoading || assetLoading)

  const handleLookupSubmit = (e) => {
    e.preventDefault()
    if (!lookupQuery.trim()) return
    navigate(`/track/${lookupQuery.trim().toUpperCase()}`)
  }

  // Define step-based progress track indices
  const getProgressStep = (status) => {
    switch (status) {
      case "Reported":
        return 1
      case "Assigned":
        return 2
      case "Inspection Started":
      case "Maintenance In Progress":
      case "Waiting for Parts":
      case "Reopened":
        return 3
      case "Resolved":
      case "Closed":
        return 4
      default:
        return 1
    }
  }

  if (isLookup) {
    return (
      <div className="max-w-md mx-auto space-y-6 py-6">
        <div className="text-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Service Portal</span>
          <h2 className="text-xl font-bold text-foreground mt-1">Track Ticket Progress</h2>
          <p className="text-xs text-muted-foreground mt-1">Enter your ticket number to look up status updates.</p>
        </div>

        <Card className="border-border shadow-md bg-card">
          <CardContent className="p-6">
            <form onSubmit={handleLookupSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Input
                  placeholder="e.g. ISS-0001"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  className="font-mono text-center uppercase tracking-widest font-black text-sm"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Search className="h-4 w-4 mr-2" /> Search ticket
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-3 bg-muted/20">
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/login">Authorized Portal Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <span className="text-sm text-muted-foreground">Searching database...</span>
      </div>
    )
  }

  if (!issue || error) {
    return (
      <div className="max-w-md mx-auto py-12 text-center px-4 space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Ticket Not Found</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The code <span className="font-mono font-bold bg-muted px-1.5 py-0.5 rounded text-foreground">{issueNumber}</span> does not match any logged ticket in our database.
        </p>
        <div className="flex flex-col gap-2 pt-4">
          <Button onClick={() => navigate("/track/lookup")} variant="default" className="w-full">
            Try Another Code
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Portal Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const currentStep = getProgressStep(issue.status)

  const stepsList = [
    { num: 1, label: "Reported" },
    { num: 2, label: "Assigned" },
    { num: 3, label: "In Service" },
    { num: 4, label: "Resolved" },
  ]

  return (
    <div className="max-w-md mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Live Tracking</span>
        <h2 className="text-2xl font-black text-foreground tracking-tight break-words px-2">
          {issue.title}
        </h2>
        <div className="flex justify-center items-center gap-2 mt-1">
          <span className="font-mono font-bold text-xs bg-muted border px-2 py-0.5 rounded text-foreground">
            {issue.issueNumber}
          </span>
          <StatusBadge status={issue.status} type="issue" />
        </div>
      </div>

      {/* Progress pipeline indicator */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 pt-6">
          <div className="flex items-center justify-between relative px-2">
            {/* Progress line */}
            <div className="absolute left-6 right-6 top-[15px] h-[3px] bg-muted z-0">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (stepsList.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps circles */}
            {stepsList.map((step) => {
              const isCompleted = currentStep >= step.num
              const isActive = currentStep === step.num
              return (
                <div key={step.num} className="flex flex-col items-center z-10 relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs transition-colors ${
                      isCompleted
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-muted"
                    } ${isActive ? "ring-2 ring-primary/40 ring-offset-2" : ""}`}
                  >
                    {step.num}
                  </div>
                  <span className="text-[10px] font-bold mt-1.5 text-muted-foreground uppercase tracking-tight">
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ticket metadata */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Ticket Specifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <dl className="divide-y divide-border/40 text-xs">
            <div className="flex justify-between items-center px-4 py-3">
              <dt className="text-muted-foreground font-semibold">Priority Classification</dt>
              <dd className="font-bold">
                <PriorityBadge priority={issue.priority} />
              </dd>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <dt className="text-muted-foreground font-semibold">Asset Code</dt>
              <dd className="font-mono font-bold text-foreground">
                {asset ? (
                  <Link to={`/asset/${asset.code}`} className="hover:underline text-primary">
                    {asset.code}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <dt className="text-muted-foreground font-semibold">Asset Name</dt>
              <dd className="font-bold text-foreground text-right max-w-[200px] truncate">
                {asset ? asset.name : "Unknown"}
              </dd>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <dt className="text-muted-foreground font-semibold">Asset Location</dt>
              <dd className="font-bold text-foreground text-right max-w-[200px] truncate">
                {asset ? asset.location : "—"}
              </dd>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <dt className="text-muted-foreground font-semibold">Report Date</dt>
              <dd className="font-bold text-foreground">{formatDate(issue.createdAt)}</dd>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <dt className="text-muted-foreground font-semibold">Last Update Activity</dt>
              <dd className="font-bold text-foreground">{formatDate(issue.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Safety Notice block */}
      <div className="text-[10px] text-muted-foreground bg-muted/40 p-4 rounded-lg border leading-relaxed text-center">
        <HelpCircle className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
        <p className="font-medium">
          To protect data security, guest views do not display technician findings, labor cost, or reporter contact info. Contact administrative support if you need further clarifications.
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button variant="outline" className="w-full text-xs h-9" onClick={() => navigate("/track/lookup")}>
          Search Another Ticket Status
        </Button>
        {asset && (
          <Button asChild variant="ghost" className="w-full text-xs h-8">
            <Link to={`/asset/${asset.code}`}>Back to Asset Specifications</Link>
          </Button>
        )}
      </div>

    </div>
  )
}
export default IssueTrackingPage

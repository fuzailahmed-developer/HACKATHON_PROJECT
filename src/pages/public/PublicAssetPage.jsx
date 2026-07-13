import React from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAssetByCode } from "@/hooks/useAssets"
import { useAssetHistorySafe } from "@/hooks/useAssetHistory"
import { AssetTimeline } from "@/components/history/AssetTimeline"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  Loader2,
  MapPin,
  Calendar,
  Wrench,
  Search,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  Cog,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Get status banner style + label for the public asset hero card.
 */
function getStatusDisplay(status) {
  switch (status) {
    case "Operational":
      return {
        className: "status-banner-operational",
        dotColor: "bg-emerald-500",
        textColor: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: <CheckCircle className="h-4 w-4" />,
        headline: "Operational",
        sublabel: "This unit is in active service.",
      }
    case "Issue Reported":
      return {
        className: "status-banner-issue",
        dotColor: "bg-amber-500",
        textColor: "text-amber-700",
        bgColor: "bg-amber-50",
        icon: <AlertTriangle className="h-4 w-4" />,
        headline: "Issue Reported",
        sublabel: "A fault has been logged. Awaiting technician assignment.",
      }
    case "Under Inspection":
      return {
        className: "status-banner-inspection",
        dotColor: "bg-sky-500",
        textColor: "text-sky-700",
        bgColor: "bg-sky-50",
        icon: <Search className="h-4 w-4" />,
        headline: "Under Inspection",
        sublabel: "A technician is currently assessing this unit.",
      }
    case "Under Maintenance":
      return {
        className: "status-banner-maintenance",
        dotColor: "bg-violet-500",
        textColor: "text-violet-700",
        bgColor: "bg-violet-50",
        icon: <Cog className="h-4 w-4 animate-spin" style={{ animationDuration: "3s" }} />,
        headline: "Under Maintenance",
        sublabel: "Scheduled maintenance in progress. Expected downtime may apply.",
      }
    case "Out of Service":
      return {
        className: "status-banner-out-of-service",
        dotColor: "bg-red-600",
        textColor: "text-red-700",
        bgColor: "bg-red-50",
        icon: <XCircle className="h-4 w-4" />,
        headline: "Out of Service",
        sublabel: "This unit is offline and not available for use.",
      }
    case "Retired":
      return {
        className: "status-banner-retired",
        dotColor: "bg-slate-400",
        textColor: "text-slate-600",
        bgColor: "bg-slate-50",
        icon: <Clock className="h-4 w-4" />,
        headline: "Retired",
        sublabel: "This asset has been decommissioned from active service.",
      }
    default:
      return {
        className: "status-banner-operational",
        dotColor: "bg-slate-400",
        textColor: "text-slate-600",
        bgColor: "bg-slate-50",
        icon: <Tag className="h-4 w-4" />,
        headline: status,
        sublabel: "",
      }
  }
}

export function PublicAssetPage() {
  const { code } = useParams()
  const navigate  = useNavigate()
  const { currentUser } = useAuth()

  const { data: asset, isLoading: assetLoading, error } = useAssetByCode(code)
  const { data: history = [], isLoading: historyLoading } = useAssetHistorySafe(asset?.id)

  const isLoading = assetLoading || (asset && historyLoading)

  /* ── Loading ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
          Reading asset tag...
        </span>
      </div>
    )
  }

  /* ── Not Found ───────────────────────────────────────────── */
  if (!asset || error) {
    return (
      <div className="flex flex-col gap-5 py-8">
        {/* Error card */}
        <div className="bg-card border border-red-200 border-l-4 border-l-red-600 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-foreground text-sm mb-1">Tag Not Registered</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The code{" "}
                <code className="font-mono font-bold bg-muted px-1.5 py-0.5 text-foreground">
                  {code}
                </code>{" "}
                doesn't match any asset in this system. The tag may be from a different facility or
                may not yet be registered.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild className="w-full rounded-none font-mono text-xs">
            <Link to="/track/lookup">Track a Known Issue by Ticket Number</Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-none font-mono text-xs">
            <Link to="/login">Staff Portal Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  const statusDisplay = getStatusDisplay(asset.status)
  const isRetired = asset.status === "Retired"

  const specFields = [
    { label: "Category",       value: asset.category },
    { label: "Location",       value: asset.location, icon: <MapPin className="h-3 w-3 mr-1 shrink-0" /> },
    { label: "Condition",      value: asset.condition },
    { label: "Last Inspected", value: formatDate(asset.lastServiceDate) },
    {
      label: "Next Service",
      value: formatDate(asset.nextServiceDate),
      icon: <Calendar className="h-3 w-3 mr-1 shrink-0" />,
    },
  ]

  return (
    <div className="space-y-4 pb-8">

      {/* ── STATUS HERO ───────────────────────────────────── */}
      {/* Primary status communication — thick left border, readable from arm's length */}
      <div className={`bg-card border border-border p-5 ${statusDisplay.className}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Scan label */}
            <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-muted-foreground block mb-2">
              ▸ QR Asset Scan
            </span>
            {/* Asset name */}
            <h1
              className="font-bold text-foreground leading-tight mb-1 break-words"
              style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.1rem, 4vw, 1.4rem)" }}
            >
              {asset.name}
            </h1>
            {/* Asset code — mono, reads like a tag */}
            <div className="font-mono font-bold text-sm text-muted-foreground tracking-widest">
              {asset.code}
            </div>
          </div>
          {/* Status indicator */}
          <div className={`flex flex-col items-end gap-1.5 shrink-0`}>
            <div className={`flex items-center gap-1.5 ${statusDisplay.textColor}`}>
              {statusDisplay.icon}
              <span className="font-mono text-xs font-bold">{statusDisplay.headline}</span>
            </div>
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${statusDisplay.bgColor}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusDisplay.dotColor} animate-pulse`} />
            </div>
          </div>
        </div>

        {/* Status sublabel */}
        {statusDisplay.sublabel && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 leading-relaxed">
            {statusDisplay.sublabel}
          </p>
        )}
      </div>

      {/* ── PRIMARY CTA ──────────────────────────────────── */}
      {/* The most important action — dominant, above fold */}
      <div className="bg-card border border-border">
        {isRetired ? (
          <div className="p-5 text-center">
            <XCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Asset Decommissioned
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This asset is retired from active service. No new reports can be filed.
            </p>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-mono text-[9px] font-bold tracking-widest uppercase text-muted-foreground">
                  Report a Fault
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Spotted a malfunction? File a report in under 60 seconds.
                </p>
              </div>
              <Wrench className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            </div>
            <Button
              size="lg"
              className="w-full rounded-none font-bold font-mono text-sm tracking-wide"
              onClick={() => {
                if (currentUser) {
                  navigate(`/asset/${asset.code}/report`)
                } else {
                  navigate("/login", { state: { from: { pathname: `/asset/${asset.code}/report` } } })
                }
              }}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Report Issue / Malfunction
            </Button>
          </div>
        )}
      </div>

      {/* ── SPECIFICATIONS ───────────────────────────────── */}
      <div className="bg-card border border-border">
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
          <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-muted-foreground">
            Device Specifications
          </span>
        </div>
        <dl className="divide-y divide-border/40">
          {specFields.map((field, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-4 py-3 hover:bg-muted/10 transition-colors"
            >
              <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {field.label}
              </dt>
              <dd className="font-mono text-xs font-bold text-foreground flex items-center">
                {field.icon}
                {field.value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ── MAINTENANCE HISTORY ──────────────────────────── */}
      <div className="bg-card border border-border">
        <div className="px-4 py-2.5 border-b border-border">
          <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-muted-foreground">
            Recent Service Activity
          </span>
        </div>
        <div className="p-4">
          <AssetTimeline history={history} isPublic={true} />
        </div>
      </div>

      {/* ── FOOTER LINK ──────────────────────────────────── */}
      <div className="text-center pt-1">
        <Link
          to="/track/lookup"
          className="font-mono text-[10px] text-primary font-bold hover:underline flex items-center justify-center gap-1.5 uppercase tracking-widest"
        >
          <Search className="h-3 w-3" />
          Track a Previous Report
        </Link>
      </div>
    </div>
  )
}
export default PublicAssetPage

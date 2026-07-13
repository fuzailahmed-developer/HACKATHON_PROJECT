import React from "react"
import { formatDateTime } from "@/lib/utils"
import {
  FileCode,
  Wrench,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  HelpCircle,
  PlusCircle,
  Clock,
} from "lucide-react"

/**
 * AssetTimeline renders a vertical history trail of all events for an asset.
 * @param {object} props
 * @param {array} props.history - List of history documents
 * @param {boolean} [props.isPublic=false] - Whether this is the public-facing guest timeline
 */
export function AssetTimeline({ history = [], isPublic = false }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        No history available for this asset.
      </div>
    )
  }

  // Get matching icon and color for the timeline item
  const getItemDetails = (action = "") => {
    const act = action.toLowerCase()
    
    if (act.includes("created")) {
      return {
        icon: <PlusCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
        bgColor: "bg-emerald-100 dark:bg-emerald-950/30",
        borderColor: "border-emerald-200 dark:border-emerald-800",
      }
    }
    if (act.includes("reported")) {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
        bgColor: "bg-amber-100 dark:bg-amber-950/30",
        borderColor: "border-amber-200 dark:border-amber-800",
      }
    }
    if (act.includes("assigned")) {
      return {
        icon: <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
        bgColor: "bg-blue-100 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800",
      }
    }
    if (act.includes("maintenance") || act.includes("completed")) {
      return {
        icon: <Wrench className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
        bgColor: "bg-purple-100 dark:bg-purple-950/30",
        borderColor: "border-purple-200 dark:border-purple-800",
      }
    }
    if (act.includes("resolved") || act.includes("closed")) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
        bgColor: "bg-emerald-100 dark:bg-emerald-950/30",
        borderColor: "border-emerald-200 dark:border-emerald-800",
      }
    }
    
    // Default
    return {
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      bgColor: "bg-muted",
      borderColor: "border-border",
    }
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
      {history.map((item) => {
        const details = getItemDetails(item.action)
        const dateStr = formatDateTime(item.timestamp)

        return (
          <div key={item.id} className="relative flex flex-col gap-1">
            {/* Dot Circle Container */}
            <div className={`absolute -left-[24px] top-0 flex items-center justify-center w-6.5 h-6.5 rounded-full border bg-background shrink-0 ${details.borderColor}`}>
              {details.icon}
            </div>

            {/* Content Card / Info */}
            <div className="ml-3">
              <span className="text-xs text-muted-foreground block mb-0.5">
                {dateStr}
              </span>
              <p className="text-sm font-semibold text-foreground leading-snug">
                {item.action}
              </p>
              
              {/* Show actor/issue context if authenticated (Admin/Tech view) */}
              {!isPublic && (item.actor || item.relatedIssueId) && (
                <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                  {item.actor && (
                    <span className="text-[10px] font-semibold bg-secondary/80 text-secondary-foreground px-2 py-0.5 rounded">
                      Actor: {item.actor}
                    </span>
                  )}
                  {item.relatedIssueId && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Issue ref: {item.relatedIssueId.slice(0, 8)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default AssetTimeline

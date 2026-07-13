import React from "react"
import { cn, assetStatusColors, issueStatusColors } from "@/lib/utils"

/**
 * StatusBadge renders a physical ink-stamped indicator based on status values.
 * Critical/Out-of-Service statuses get heavier stamp treatment.
 * @param {object} props
 * @param {string} props.status
 * @param {"asset" | "issue"} [props.type="asset"]
 * @param {string} [props.className]
 */
export function StatusBadge({ status, type = "asset", className }) {
  if (!status) return null

  const colorMap = type === "asset" ? assetStatusColors : issueStatusColors
  const colorClass = colorMap[status] || "bg-muted text-muted-foreground border-muted-foreground/30"

  const isUrgent =
    status === "Out of Service" ||
    status === "Reopened" ||
    status === "Reported"

  return (
    <span
      className={cn(
        "stamp-effect tracking-widest font-mono font-bold uppercase select-none shrink-0",
        isUrgent && "stamp-effect-critical",
        colorClass,
        className
      )}
    >
      {status}
    </span>
  )
}
export default StatusBadge

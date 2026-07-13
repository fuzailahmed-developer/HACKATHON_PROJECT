import React from "react"
import { cn, priorityColors } from "@/lib/utils"
import { AlertOctagon, AlertTriangle, Minus, ArrowDown } from "lucide-react"

/**
 * PriorityBadge — stamp-style indicator with icon.
 * Critical gets a ⚠ prefix and heavier stamp rotation.
 * Uses stamp-effect (not rounded pill) to match the service-ticket visual language.
 * @param {object} props
 * @param {"Low" | "Medium" | "High" | "Critical"} props.priority
 * @param {string} [props.className]
 */
export function PriorityBadge({ priority, className }) {
  if (!priority) return null

  const colorClass = priorityColors[priority] || "bg-muted text-muted-foreground border-muted-foreground/30"

  const getIcon = () => {
    switch (priority) {
      case "Critical":
        return <AlertOctagon className="h-3 w-3 mr-1 shrink-0" />
      case "High":
        return <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
      case "Medium":
        return <Minus className="h-3 w-3 mr-1 shrink-0" />
      case "Low":
      default:
        return <ArrowDown className="h-3 w-3 mr-1 shrink-0" />
    }
  }

  return (
    <span
      className={cn(
        "stamp-effect tracking-widest font-mono font-bold uppercase select-none shrink-0 inline-flex items-center",
        priority === "Critical" && "stamp-effect-critical",
        colorClass,
        className
      )}
    >
      {getIcon()}
      {priority}
    </span>
  )
}
export default PriorityBadge

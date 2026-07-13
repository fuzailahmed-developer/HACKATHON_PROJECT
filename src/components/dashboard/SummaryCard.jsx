import React from "react"
import { cn } from "@/lib/utils"

/**
 * SummaryCard — operational metric readout.
 * Styled as instrument gauge display: monospace numbers, no decorative fill,
 * hard border edges. Critical cards get a left-border accent in red-alert.
 * @param {object} props
 * @param {React.ReactNode} props.icon
 * @param {string} props.label
 * @param {string|number} props.value
 * @param {string} [props.description]
 * @param {string} [props.className]
 * @param {"default"|"critical"|"warning"|"overdue"} [props.variant]
 */
export function SummaryCard({ icon, label, value, description, className, variant = "default" }) {
  const variantStyles = {
    default:  "border-border",
    critical: "border-l-[3px] border-l-red-600 border-border",
    warning:  "border-l-[3px] border-l-amber-500 border-border",
    overdue:  "border-l-[3px] border-l-violet-600 border-border",
  }

  return (
    <div
      className={cn(
        "bg-card border overflow-hidden",
        variantStyles[variant],
        className
      )}
    >
      <div className="p-5">
        {/* Icon — raw, no colored circle */}
        <div className="flex items-center justify-between mb-3">
          <span className="metric-readout-label">{label}</span>
          <span className="text-muted-foreground/60">{icon}</span>
        </div>

        {/* Number — monospace instrument readout */}
        <div className="metric-readout-value text-foreground">
          {value}
        </div>

        {description && (
          <p className="font-mono text-[9px] text-muted-foreground/60 mt-2 pt-2 border-t border-border/50 tracking-wide">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
export default SummaryCard

import React from "react"
import { Button } from "@/components/ui/button"
import { Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * EmptyState — shown when no data is found.
 * Written in MaintainIQ's voice: operational, direct, not generic.
 * @param {object} props
 * @param {React.ReactNode} [props.icon]
 * @param {string} props.title
 * @param {string} props.description
 * @param {object} [props.action]
 * @param {string} props.action.label
 * @param {function} props.action.onClick
 * @param {string} [props.className]
 */
export function EmptyState({
  icon = <Wrench className="h-8 w-8 text-muted-foreground/40" />,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-10 text-center border border-dashed border-border bg-card",
        className
      )}
    >
      {/* Icon block — no round circle wrapper, just raw icon */}
      <div className="mb-4 text-muted-foreground/40">
        {icon}
      </div>

      {/* Mono label above title */}
      <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-1 block">
        — system status —
      </span>

      <h3 className="text-base font-bold mb-1 text-foreground font-sans">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>

      {action && (
        <Button onClick={action.onClick} variant="outline" size="sm" className="font-mono text-xs">
          {action.label}
        </Button>
      )}
    </div>
  )
}
export default EmptyState

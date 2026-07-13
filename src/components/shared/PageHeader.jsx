import React from "react"
import { cn } from "@/lib/utils"

/**
 * PageHeader — standard header for authenticated app pages.
 * Features a 3px left accent bar and IBM Plex Sans display weight for the title.
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.actions]
 * @param {string} [props.className]
 */
export function PageHeader({ title, description, actions, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-border mb-6",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Left accent bar */}
        <div className="w-0.5 self-stretch bg-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}>
            {title}
          </h1>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 self-start md:self-auto ml-3 md:ml-0">
          {actions}
        </div>
      )}
    </div>
  )
}
export default PageHeader

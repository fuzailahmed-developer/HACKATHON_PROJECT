import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns"

/**
 * Merge Tailwind CSS classes with conflict resolution
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique code with a given prefix
 * e.g., generateCode("ASSET") => "ASSET-A1B2"
 */
export function generateCode(prefix = "ASSET") {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}-${code}`
}

/**
 * Generate a sequential issue number
 */
export function generateIssueNumber(lastNumber = 0) {
  return `ISS-${String(lastNumber + 1).padStart(4, "0")}`
}

/**
 * Format a Firestore timestamp or JS Date to a readable string
 */
export function formatDate(date, pattern = "MMM d, yyyy") {
  if (!date) return "—"
  const d = date?.toDate ? date.toDate() : new Date(date)
  return format(d, pattern)
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeDate(date) {
  if (!date) return "—"
  const d = date?.toDate ? date.toDate() : new Date(date)
  return formatDistanceToNow(d, { addSuffix: true })
}

/**
 * Format date and time
 */
export function formatDateTime(date) {
  return formatDate(date, "MMM d, yyyy 'at' h:mm a")
}

/**
 * Check if a service date is overdue
 */
export function isServiceOverdue(nextServiceDate) {
  if (!nextServiceDate) return false
  const d = nextServiceDate?.toDate ? nextServiceDate.toDate() : new Date(nextServiceDate)
  return isBefore(d, new Date())
}

/**
 * Check if a date is in the future
 */
export function isDateInFuture(date) {
  if (!date) return false
  const d = date?.toDate ? date.toDate() : new Date(date)
  return isAfter(d, new Date())
}

/**
 * Status color mapping for assets
 */
export const assetStatusColors = {
  "Operational":        "bg-emerald-900/10 text-emerald-700 border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-600/40",
  "Issue Reported":     "bg-amber-900/10 text-amber-700 border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-600/40",
  "Under Inspection":   "bg-sky-900/10 text-sky-700 border-sky-700/40 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-600/40",
  "Under Maintenance":  "bg-violet-900/10 text-violet-700 border-violet-700/40 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-600/40",
  "Out of Service":     "bg-red-900/10 text-red-700 border-red-700/50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-600/50",
  "Retired":            "bg-slate-400/10 text-slate-500 border-slate-400/30 dark:bg-slate-800/20 dark:text-slate-400 dark:border-slate-600/30",
}

/**
 * Status color mapping for issues
 */
export const issueStatusColors = {
  "Reported":                "bg-amber-900/10 text-amber-700 border-amber-700/40",
  "Assigned":                "bg-sky-900/10 text-sky-700 border-sky-700/40",
  "Inspection Started":      "bg-indigo-900/10 text-indigo-700 border-indigo-700/40",
  "Maintenance In Progress": "bg-violet-900/10 text-violet-700 border-violet-700/40",
  "Waiting for Parts":       "bg-orange-900/10 text-orange-700 border-orange-700/40",
  "Resolved":                "bg-emerald-900/10 text-emerald-700 border-emerald-700/40",
  "Closed":                  "bg-slate-400/10 text-slate-500 border-slate-400/30",
  "Reopened":                "bg-red-900/10 text-red-700 border-red-700/50",
}

/**
 * Priority color mapping — coherent with brand palette
 */
export const priorityColors = {
  "Low":      "bg-emerald-900/10 text-emerald-700 border-emerald-700/40",
  "Medium":   "bg-sky-900/10 text-sky-700 border-sky-700/40",
  "High":     "bg-amber-900/10 text-amber-700 border-amber-700/50",
  "Critical": "bg-red-900/15 text-red-700 border-red-700/60",
}

/**
 * Priority indicator dot colors
 */
export const priorityDotColors = {
  "Low":      "bg-emerald-600",
  "Medium":   "bg-sky-600",
  "High":     "bg-amber-500",
  "Critical": "bg-red-600",
}

/**
 * Truncate text to a max length
 */
export function truncate(str, maxLength = 50) {
  if (!str) return ""
  return str.length > maxLength ? str.slice(0, maxLength) + "…" : str
}

/**
 * Get initials from a name
 */
export function getInitials(name) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format cost as currency
 */
export function formatCurrency(amount) {
  if (amount == null) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

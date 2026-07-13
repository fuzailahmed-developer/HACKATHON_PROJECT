import { STATUS_TRANSITIONS, ISSUE_TO_ASSET_STATUS } from "@/lib/constants"

/**
 * Get the list of valid next statuses for a given current issue status
 * @param {string} currentStatus - The current issue status
 * @returns {string[]} Array of valid next statuses
 */
export function getValidTransitions(currentStatus) {
  return STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * Check if a status transition is valid
 * @param {string} from - Current status
 * @param {string} to - Target status
 * @returns {boolean}
 */
export function isValidTransition(from, to) {
  const allowed = STATUS_TRANSITIONS[from]
  return allowed ? allowed.includes(to) : false
}

/**
 * Get the corresponding asset status for an issue status
 * @param {string} issueStatus - The issue status
 * @param {boolean} [hasCriticalSafetyFlag=false] - Whether the issue has a critical safety flag
 * @returns {string} The corresponding asset status
 */
export function getAssetStatusForIssueStatus(issueStatus, hasCriticalSafetyFlag = false) {
  // If resolving a critical safety issue, mark asset as Out of Service instead of Operational
  if ((issueStatus === "Resolved" || issueStatus === "Closed") && hasCriticalSafetyFlag) {
    return "Out of Service"
  }
  return ISSUE_TO_ASSET_STATUS[issueStatus] || "Operational"
}

/**
 * Check if a maintenance record is required for the given transition
 * @param {string} from - Current status
 * @param {string} to - Target status
 * @returns {boolean}
 */
export function requiresMaintenanceRecord(from, to) {
  // Must have a maintenance record when resolving
  return to === "Resolved"
}

/**
 * Get a human-readable label for a status transition action
 * @param {string} to - Target status
 * @returns {string}
 */
export function getTransitionActionLabel(to) {
  const labels = {
    "Assigned": "Assign",
    "Inspection Started": "Start Inspection",
    "Maintenance In Progress": "Start Maintenance",
    "Waiting for Parts": "Waiting for Parts",
    "Resolved": "Mark as Resolved",
    "Closed": "Close Issue",
    "Reopened": "Reopen Issue",
  }
  return labels[to] || to
}

/**
 * Get the button variant for a status transition
 * @param {string} to - Target status
 * @returns {"default" | "destructive" | "outline" | "secondary"}
 */
export function getTransitionButtonVariant(to) {
  switch (to) {
    case "Resolved":
    case "Closed":
      return "default"
    case "Reopened":
      return "destructive"
    default:
      return "outline"
  }
}

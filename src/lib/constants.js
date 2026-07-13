/**
 * Asset status options
 */
export const ASSET_STATUSES = [
  "Operational",
  "Issue Reported",
  "Under Inspection",
  "Under Maintenance",
  "Out of Service",
  "Retired",
]

/**
 * Issue status options
 */
export const ISSUE_STATUSES = [
  "Reported",
  "Assigned",
  "Inspection Started",
  "Maintenance In Progress",
  "Waiting for Parts",
  "Resolved",
  "Closed",
  "Reopened",
]

/**
 * Priority levels
 */
export const PRIORITIES = ["Low", "Medium", "High", "Critical"]

/**
 * Asset categories
 */
export const ASSET_CATEGORIES = [
  "HVAC",
  "Electrical",
  "Plumbing",
  "Elevator",
  "Fire Safety",
  "Structural",
  "IT Infrastructure",
  "Furniture",
  "Security Systems",
  "General Equipment",
]

/**
 * Issue categories (for AI triage classification)
 */
export const ISSUE_CATEGORIES = [
  "Mechanical Failure",
  "Electrical Issue",
  "Plumbing/Leak",
  "HVAC/Climate",
  "Safety Hazard",
  "Noise/Vibration",
  "Performance Degradation",
  "Physical Damage",
  "Cleaning/Hygiene",
  "Software/Controls",
  "General Maintenance",
  "Other",
]

/**
 * Asset conditions
 */
export const ASSET_CONDITIONS = [
  "Excellent",
  "Good",
  "Fair",
  "Poor",
  "Critical",
]

/**
 * Valid issue status transitions
 * Maps current status to an array of allowed next statuses
 */
export const STATUS_TRANSITIONS = {
  "Reported": ["Assigned"],
  "Assigned": ["Inspection Started"],
  "Inspection Started": ["Maintenance In Progress"],
  "Maintenance In Progress": ["Waiting for Parts", "Resolved"],
  "Waiting for Parts": ["Maintenance In Progress"],
  "Resolved": ["Closed", "Reopened"],
  "Closed": ["Reopened"],
  "Reopened": ["Assigned"],
}

/**
 * Maps issue status to corresponding asset status
 */
export const ISSUE_TO_ASSET_STATUS = {
  "Reported": "Issue Reported",
  "Assigned": "Issue Reported",
  "Inspection Started": "Under Inspection",
  "Maintenance In Progress": "Under Maintenance",
  "Waiting for Parts": "Under Maintenance",
  "Resolved": "Operational",
  "Closed": "Operational",
  "Reopened": "Issue Reported",
}

/**
 * User roles
 */
export const USER_ROLES = ["Admin", "Technician"]

/**
 * Organization info (single-org for hackathon)
 */
export const ORG_INFO = {
  name: "MaintainIQ",
  tagline: "Smart Asset Maintenance",
  labelInstructions: "Scan QR code to view asset details or report an issue.",
}

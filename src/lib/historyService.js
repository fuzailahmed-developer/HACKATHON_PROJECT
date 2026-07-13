import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * Write an asset history entry.
 * Asset history is APPEND-ONLY — no update or delete functions exist.
 * 
 * @param {object} params
 * @param {string} params.assetId - The asset this entry belongs to
 * @param {string} params.action - Description of the action (e.g. "Issue Reported", "Status changed to Under Maintenance")
 * @param {string} params.actor - userId or "Public Reporter"
 * @param {string} [params.relatedIssueId] - Optional related issue ID
 */
export async function writeAssetHistory({ assetId, action, actor, relatedIssueId = null }) {
  if (!assetId || !action || !actor) {
    throw new Error("assetId, action, and actor are required for asset history")
  }

  const historyRef = collection(db, "assetHistory")
  
  await addDoc(historyRef, {
    assetId,
    action,
    actor,
    relatedIssueId,
    timestamp: serverTimestamp(),
  })
}

/**
 * Common history action generators
 */
export const historyActions = {
  assetCreated: (assetName) => `Asset "${assetName}" created`,
  assetUpdated: (field, oldValue, newValue) => `${field} changed from "${oldValue}" to "${newValue}"`,
  issueReported: (issueNumber) => `Issue ${issueNumber} reported`,
  issueAssigned: (issueNumber, techName) => `Issue ${issueNumber} assigned to ${techName}`,
  statusChanged: (issueNumber, oldStatus, newStatus) => `Issue ${issueNumber} status changed from "${oldStatus}" to "${newStatus}"`,
  maintenanceCompleted: (issueNumber) => `Maintenance completed for issue ${issueNumber}`,
  issueResolved: (issueNumber) => `Issue ${issueNumber} resolved`,
  issueClosed: (issueNumber) => `Issue ${issueNumber} closed`,
  issueReopened: (issueNumber) => `Issue ${issueNumber} reopened`,
}

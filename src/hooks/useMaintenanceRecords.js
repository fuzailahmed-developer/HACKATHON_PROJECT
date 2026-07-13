import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { writeAssetHistory, historyActions } from "@/lib/historyService"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Fetch maintenance records for a specific issue.
 */
export function useMaintenanceRecords(issueId) {
  return useQuery({
    queryKey: ["maintenance-records", issueId],
    queryFn: async () => {
      if (!issueId) return []
      const q = query(
        collection(db, "maintenanceRecords"),
        where("issueId", "==", issueId)
      )
      const snap = await getDocs(q)
      const records = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      return records.sort((a, b) => {
        const timeA = a.completedAt?.toMillis?.() || (a.completedAt ? new Date(a.completedAt).getTime() : 0)
        const timeB = b.completedAt?.toMillis?.() || (b.completedAt ? new Date(b.completedAt).getTime() : 0)
        return timeB - timeA
      })
    },
    enabled: !!issueId,
  })
}

/**
 * Fetch maintenance records for a specific asset.
 */
export function useAssetMaintenanceRecords(assetId) {
  return useQuery({
    queryKey: ["asset-maintenance-records", assetId],
    queryFn: async () => {
      if (!assetId) return []
      const q = query(
        collection(db, "maintenanceRecords"),
        where("assetId", "==", assetId)
      )
      const snap = await getDocs(q)
      const records = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      return records.sort((a, b) => {
        const timeA = a.completedAt?.toMillis?.() || (a.completedAt ? new Date(a.completedAt).getTime() : 0)
        const timeB = b.completedAt?.toMillis?.() || (b.completedAt ? new Date(b.completedAt).getTime() : 0)
        return timeB - timeA
      })
    },
    enabled: !!assetId,
  })
}

/**
 * Create a new maintenance record and mark the issue as Resolved.
 * Also updates asset's lastServiceDate and nextServiceDate.
 */
export function useCreateMaintenanceRecord() {
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()

  return useMutation({
    mutationFn: async (recordData) => {
      const {
        issueId,
        assetId,
        findings,
        actionsTaken,
        partsUsed,
        cost,
        timeSpentMinutes,
        evidenceUrls,
        nextServiceDate, // JS Date or string or null
      } = recordData

      // 1. Validate cost
      if (cost < 0) {
        throw new Error("Maintenance cost cannot be negative.")
      }

      // 2. Add maintenance record
      const newRecord = {
        issueId,
        assetId,
        technicianId: userProfile?.id || "Unknown Tech",
        findings,
        actionsTaken,
        partsUsed: partsUsed || [],
        cost: Number(cost),
        timeSpentMinutes: Number(timeSpentMinutes),
        evidenceUrls: evidenceUrls || [],
        completedAt: serverTimestamp(),
      }

      const recordDocRef = await addDoc(collection(db, "maintenanceRecords"), newRecord)

      // 3. Update the asset's service dates
      const assetRef = doc(db, "assets", assetId)
      const assetUpdates = {
        lastServiceDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      if (nextServiceDate) {
        assetUpdates.nextServiceDate = new Date(nextServiceDate)
      }

      await updateDoc(assetRef, assetUpdates)

      // 4. Write to asset history
      await writeAssetHistory({
        assetId,
        action: `Maintenance completed. Cost: $${cost}. Findings: ${findings.slice(0, 50)}...`,
        actor: userProfile?.name || "Technician",
        relatedIssueId: issueId,
      })

      return { id: recordDocRef.id, ...newRecord }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records", data.issueId] })
      queryClient.invalidateQueries({ queryKey: ["asset-maintenance-records", data.assetId] })
      queryClient.invalidateQueries({ queryKey: ["issues"] })
      queryClient.invalidateQueries({ queryKey: ["issues", data.issueId] })
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["assets", data.assetId] })
      queryClient.invalidateQueries({ queryKey: ["asset-history", data.assetId] })
    },
  })
}

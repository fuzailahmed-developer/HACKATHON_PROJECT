import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { writeAssetHistory, historyActions } from "@/lib/historyService"
import { getAssetStatusForIssueStatus } from "@/lib/statusTransitions"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Fetch all issues or filtered list.
 */
export function useIssues() {
  return useQuery({
    queryKey: ["issues"],
    queryFn: async () => {
      const querySnapshot = await getDocs(
        query(collection(db, "issues"), orderBy("createdAt", "desc"))
      )
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    },
  })
}

/**
 * Fetch a single issue by ID.
 */
export function useIssue(issueId) {
  return useQuery({
    queryKey: ["issues", issueId],
    queryFn: async () => {
      if (!issueId) return null
      const docSnap = await getDoc(doc(db, "issues", issueId))
      if (!docSnap.exists()) {
        throw new Error("Issue not found")
      }
      return { id: docSnap.id, ...docSnap.data() }
    },
    enabled: !!issueId,
  })
}

/**
 * Fetch a single issue by its unique human-readable issueNumber (e.g. "ISS-0001")
 */
export function useIssueByNumber(issueNumber) {
  return useQuery({
    queryKey: ["issues-by-number", issueNumber],
    queryFn: async () => {
      if (!issueNumber) return null
      const q = query(collection(db, "issues"), where("issueNumber", "==", issueNumber))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        return null
      }
      const issueDoc = querySnapshot.docs[0]
      return { id: issueDoc.id, ...issueDoc.data() }
    },
    enabled: !!issueNumber,
  })
}

/**
 * Create a new issue (Public reporting or Admin dashboard).
 * Automatically updates asset status to "Issue Reported" and writes history.
 */
export function useCreateIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (issueData) => {
      const { assetId, reporterName, reportedBy, title, description, category, priority, evidenceUrls, aiSuggested } = issueData

      // 1. Generate sequential issue number
      const qLast = query(
        collection(db, "issues"),
        orderBy("issueNumber", "desc"),
        limit(1)
      )
      const lastSnap = await getDocs(qLast)
      let nextNumber = "ISS-0001"
      if (!lastSnap.empty) {
        const lastIssue = lastSnap.docs[0].data()
        const lastNumStr = lastIssue.issueNumber?.split("-")[1]
        if (lastNumStr) {
          const lastNum = parseInt(lastNumStr, 10)
          nextNumber = `ISS-${String(lastNum + 1).padStart(4, "0")}`
        }
      }

      // 2. Prepare issue doc
      const newIssue = {
        issueNumber: nextNumber,
        assetId,
        title,
        description,
        category,
        priority,
        status: "Reported",
        reporterName,
        reportedBy: reportedBy || null,
        reporterContact: issueData.reporterContact || null,
        evidenceUrls: evidenceUrls || [],
        assignedTo: null,
        aiSuggested: aiSuggested || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // 3. Write issue to Firestore
      const issueDocRef = await addDoc(collection(db, "issues"), newIssue)

      // 4. Update asset status to "Issue Reported"
      const assetRef = doc(db, "assets", assetId)
      await updateDoc(assetRef, {
        status: "Issue Reported",
        updatedAt: serverTimestamp(),
      })

      // 5. Write to Asset History
      await writeAssetHistory({
        assetId,
        action: historyActions.issueReported(nextNumber),
        actor: reporterName || "Reporter",
        relatedIssueId: issueDocRef.id,
      })

      return { id: issueDocRef.id, ...newIssue }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["issues"] })
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["assets", data.assetId] })
      queryClient.invalidateQueries({ queryKey: ["asset-history", data.assetId] })
    },
  })
}

/**
 * Update issue properties (like assignment, status, fields).
 */
export function useUpdateIssue() {
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()

  return useMutation({
    mutationFn: async ({ issueId, updates, technicianName }) => {
      const issueRef = doc(db, "issues", issueId)
      const issueSnap = await getDoc(issueRef)
      if (!issueSnap.exists()) {
        throw new Error("Issue not found")
      }
      const currentIssue = issueSnap.data()
      const assetId = currentIssue.assetId

      // Prepare updates
      const updatedFields = {
        ...updates,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(issueRef, updatedFields)

      // Log status changes
      if (updates.status && updates.status !== currentIssue.status) {
        // Write to asset history
        await writeAssetHistory({
          assetId,
          action: historyActions.statusChanged(currentIssue.issueNumber, currentIssue.status, updates.status),
          actor: userProfile?.name || "System",
          relatedIssueId: issueId,
        })

        // Auto-update asset status based on issue status transition
        // We check if the issue was marked as critical safety issue
        const isCritical = currentIssue.priority === "Critical"
        const nextAssetStatus = getAssetStatusForIssueStatus(updates.status, isCritical)
        
        // Fetch current asset status first
        const assetRef = doc(db, "assets", assetId)
        const assetSnap = await getDoc(assetRef)
        if (assetSnap.exists()) {
          const currentAssetStatus = assetSnap.data().status
          if (currentAssetStatus !== nextAssetStatus) {
            await updateDoc(assetRef, {
              status: nextAssetStatus,
              updatedAt: serverTimestamp(),
            })

            await writeAssetHistory({
              assetId,
              action: `Asset status auto-updated to "${nextAssetStatus}"`,
              actor: "System",
              relatedIssueId: issueId,
            })
          }
        }
      }

      // Log assignments
      if (updates.assignedTo !== undefined && updates.assignedTo !== currentIssue.assignedTo) {
        const actorName = userProfile?.name || "Administrator"
        const assignedLabel = technicianName ? `assigned to ${technicianName}` : "unassigned"
        await writeAssetHistory({
          assetId,
          action: `Issue ${currentIssue.issueNumber} ${assignedLabel}`,
          actor: actorName,
          relatedIssueId: issueId,
        })

        // Auto-update issue status to "Assigned" if status is "Reported" and technician is assigned
        if (updates.assignedTo && currentIssue.status === "Reported") {
          await updateDoc(issueRef, {
            status: "Assigned",
            updatedAt: serverTimestamp(),
          })
          
          await writeAssetHistory({
            assetId,
            action: historyActions.statusChanged(currentIssue.issueNumber, "Reported", "Assigned"),
            actor: "System",
            relatedIssueId: issueId,
          })
        }
      }

      return { id: issueId, ...updatedFields }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["issues"] })
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: ["issues", data.id] })
        // Invalidate by issue number since we don't have the number here directly
        queryClient.invalidateQueries({ queryKey: ["issues-by-number"] })
      }
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["asset-history"] })
    },
  })
}

/**
 * Fetch issues reported by a specific user (Employee "My Reports" view).
 */
export function useMyIssues(userId) {
  return useQuery({
    queryKey: ["my-issues", userId],
    queryFn: async () => {
      if (!userId) return []
      const q = query(
        collection(db, "issues"),
        where("reportedBy", "==", userId)
      )
      const querySnapshot = await getDocs(q)
      const issues = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      return issues.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0)
        const timeB = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0)
        return timeB - timeA
      })
    },
    enabled: !!userId,
  })
}

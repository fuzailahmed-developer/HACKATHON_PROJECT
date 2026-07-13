import { useQuery } from "@tanstack/react-query"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * Fetch full asset history (Admin / Technician view).
 * Shows all details including actor and related issue.
 */
export function useAssetHistoryFull(assetId) {
  return useQuery({
    queryKey: ["asset-history", "full", assetId],
    queryFn: async () => {
      if (!assetId) return []
      const q = query(
        collection(db, "assetHistory"),
        where("assetId", "==", assetId)
      )
      const snap = await getDocs(q)
      const history = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      return history.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || (a.timestamp ? new Date(a.timestamp).getTime() : 0)
        const timeB = b.timestamp?.toMillis?.() || (b.timestamp ? new Date(b.timestamp).getTime() : 0)
        return timeB - timeA
      })
    },
    enabled: !!assetId,
  })
}

/**
 * Fetch filtered/safe asset history (Public / Guest view).
 * Only includes action and timestamp, hiding actors or internal references.
 */
export function useAssetHistorySafe(assetId) {
  return useQuery({
    queryKey: ["asset-history", "safe", assetId],
    queryFn: async () => {
      if (!assetId) return []
      const q = query(
        collection(db, "assetHistory"),
        where("assetId", "==", assetId)
      )
      const snap = await getDocs(q)
      
      // Filter fields to comply with privacy rules
      const history = snap.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          action: data.action,
          timestamp: data.timestamp,
        }
      })
      return history.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || (a.timestamp ? new Date(a.timestamp).getTime() : 0)
        const timeB = b.timestamp?.toMillis?.() || (b.timestamp ? new Date(b.timestamp).getTime() : 0)
        return timeB - timeA
      })
    },
    enabled: !!assetId,
  })
}

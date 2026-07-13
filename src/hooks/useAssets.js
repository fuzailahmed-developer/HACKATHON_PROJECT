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
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { generateCode } from "@/lib/utils"
import { writeAssetHistory, historyActions } from "@/lib/historyService"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Fetch all assets from Firestore with local search/filtering.
 */
export function useAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const querySnapshot = await getDocs(
        query(collection(db, "assets"), orderBy("createdAt", "desc"))
      )
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    },
  })
}

/**
 * Fetch a single asset by document ID.
 */
export function useAsset(assetId) {
  return useQuery({
    queryKey: ["assets", assetId],
    queryFn: async () => {
      if (!assetId) return null
      const docSnap = await getDoc(doc(db, "assets", assetId))
      if (!docSnap.exists()) {
        throw new Error("Asset not found")
      }
      return { id: docSnap.id, ...docSnap.data() }
    },
    enabled: !!assetId,
  })
}

/**
 * Fetch a single asset by its human-readable code.
 * (Used for public pages /asset/:code)
 */
export function useAssetByCode(code) {
  return useQuery({
    queryKey: ["assets-by-code", code],
    queryFn: async () => {
      if (!code) return null
      const q = query(collection(db, "assets"), where("code", "==", code))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        return null
      }
      const assetDoc = querySnapshot.docs[0]
      return { id: assetDoc.id, ...assetDoc.data() }
    },
    enabled: !!code,
  })
}

/**
 * Create a new asset mutation. Enforces unique codes.
 */
export function useCreateAsset() {
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()

  return useMutation({
    mutationFn: async (assetData) => {
      // 1. Generate unique code
      let isUnique = false
      let code = ""
      let attempts = 0

      while (!isUnique && attempts < 5) {
        code = generateCode("PROJ")
        const q = query(collection(db, "assets"), where("code", "==", code))
        const checkSnap = await getDocs(q)
        if (checkSnap.empty) {
          isUnique = true
        }
        attempts++
      }

      if (!isUnique) {
        throw new Error("Failed to generate a unique asset code. Please try again.")
      }

      // 2. Prepare asset data
      const newAsset = {
        ...assetData,
        code,
        status: "Operational", // default status
        assignedTechnicianId: null,
        lastServiceDate: null,
        nextServiceDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // 3. Write to Firestore
      const docRef = await addDoc(collection(db, "assets"), newAsset)

      // 4. Write to history
      await writeAssetHistory({
        assetId: docRef.id,
        action: historyActions.assetCreated(newAsset.name),
        actor: userProfile?.name || "Administrator",
      })

      return { id: docRef.id, ...newAsset }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] })
    },
  })
}

/**
 * Update an asset mutation.
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()

  return useMutation({
    mutationFn: async ({ assetId, updates }) => {
      const assetRef = doc(db, "assets", assetId)
      
      // Fetch current asset details to detect changes for history
      const originalSnap = await getDoc(assetRef)
      if (!originalSnap.exists()) {
        throw new Error("Asset does not exist")
      }
      const original = originalSnap.data()

      // Perform update
      const cleanedUpdates = {
        ...updates,
        updatedAt: serverTimestamp(),
      }
      await updateDoc(assetRef, cleanedUpdates)

      // Track history of key updates (name, location, condition, status)
      const trackingFields = ["name", "location", "condition", "status"]
      for (const field of trackingFields) {
        if (updates[field] !== undefined && updates[field] !== original[field]) {
          await writeAssetHistory({
            assetId,
            action: historyActions.assetUpdated(
              field.charAt(0).toUpperCase() + field.slice(1),
              original[field] || "None",
              updates[field]
            ),
            actor: userProfile?.name || "Administrator",
          })
        }
      }

      // Special check: nextServiceDate or lastServiceDate change
      if (updates.nextServiceDate !== undefined && updates.nextServiceDate !== original.nextServiceDate) {
        await writeAssetHistory({
          assetId,
          action: `Next service date updated to ${updates.nextServiceDate ? new Date(updates.nextServiceDate).toLocaleDateString() : "None"}`,
          actor: userProfile?.name || "Administrator",
        })
      }

      return { id: assetId, ...cleanedUpdates }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["assets", data.id] })
      queryClient.invalidateQueries({ queryKey: ["assets-by-code", data.code] })
      queryClient.invalidateQueries({ queryKey: ["asset-history", data.id] })
    },
  })
}

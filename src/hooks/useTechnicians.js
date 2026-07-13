import { useQuery } from "@tanstack/react-query"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * Fetch all users with the role "Technician" for assignment dropdowns.
 */
export function useTechnicians() {
  return useQuery({
    queryKey: ["technicians"],
    queryFn: async () => {
      const q = query(
        collection(db, "users"),
        where("role", "==", "Technician")
      )
      const snap = await getDocs(q)
      return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    },
  })
}

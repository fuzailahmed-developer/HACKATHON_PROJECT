import { createContext, useContext, useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user) {
        // Fetch user profile (role, name) from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            setUserProfile({ id: user.uid, ...userDoc.data() })
          } else {
            // User exists in Auth but not in Firestore
            setUserProfile(null)
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  /**
   * Create a new Firebase Auth user and write their profile to Firestore.
   * Firebase automatically signs in the user after creation.
   */
  async function signup(name, email, password, role) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const profile = { name, email, role }

    // Write users/{uid} doc to Firestore
    await setDoc(doc(db, "users", result.user.uid), profile)

    // Optimistically set profile so role-based redirect works immediately
    setUserProfile({ id: result.user.uid, ...profile })

    return result
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password)
    // Fetch profile immediately after login
    const userDoc = await getDoc(doc(db, "users", result.user.uid))
    let role = null
    if (userDoc.exists()) {
      const data = userDoc.data()
      setUserProfile({ id: result.user.uid, ...data })
      role = data.role
    }
    return { user: result.user, role }
  }

  async function logout() {
    setUserProfile(null)
    return signOut(auth)
  }

  /** Role helpers */
  const isAdmin      = userProfile?.role === "Admin"
  const isTechnician = userProfile?.role === "Technician"
  const isEmployee   = userProfile?.role === "Employee"

  /**
   * Returns the default route for the current user's role.
   */
  function getRoleHome() {
    if (isAdmin)      return "/dashboard"
    if (isTechnician) return "/technician"
    if (isEmployee)   return "/employee"
    return "/dashboard"
  }

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    isAdmin,
    isTechnician,
    isEmployee,
    getRoleHome,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider

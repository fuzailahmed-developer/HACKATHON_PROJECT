import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

/**
 * Protected route wrapper.
 * Redirects to /login if not authenticated.
 * Optionally checks for allowed roles (string or array).
 *
 * @param {object}   props
 * @param {React.ReactNode}   props.children
 * @param {string|string[]}   [props.allowedRoles] - e.g. "Admin" or ["Admin","Technician"]
 */
export function ProtectedRoute({ children, allowedRoles, requiredRole }) {
  const { currentUser, userProfile, loading, getRoleHome } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in → send to login with return path
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role check
  const activeRoles = allowedRoles || requiredRole
  if (activeRoles) {
    const roles = Array.isArray(activeRoles) ? activeRoles : [activeRoles]
    const userRole = userProfile?.role

    // Special pass: Admin can access Technician-only pages
    const canAccess =
      roles.includes(userRole) ||
      (roles.includes("Technician") && userRole === "Admin")

    if (!canAccess) {
      // Redirect to the user's own home rather than a hard-coded route
      return <Navigate to={getRoleHome()} replace />
    }
  }

  return children
}

export default ProtectedRoute

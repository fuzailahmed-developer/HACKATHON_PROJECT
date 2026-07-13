import React, { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || "/dashboard"

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please enter email and password.")
      return
    }

    setIsSubmitting(true)
    try {
      const { role } = await login(email, password)
      toast.success("Successfully logged in!")

      let targetPath = from
      // If the destination is general or dashboard, redirect to role-specific dashboard
      if (from === "/dashboard" || from === "/" || from === "/employee" || from === "/technician") {
        if (role === "Admin") {
          targetPath = "/dashboard"
        } else if (role === "Technician") {
          targetPath = "/technician"
        } else if (role === "Employee") {
          targetPath = "/employee"
        }
      }
      navigate(targetPath, { replace: true })
    } catch (error) {
      console.error("Login failed:", error)
      toast.error(error.message || "Invalid credentials. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pre-fill demo accounts helper
  const fillDemoAccount = (role) => {
    if (role === "admin") {
      setEmail("admin@maintainiq.com")
      setPassword("admin123456")
    } else if (role === "tech") {
      setEmail("tech@maintainiq.com")
      setPassword("tech123456")
    } else if (role === "employee") {
      setEmail("employee@maintainiq.com")
      setPassword("employee123456")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm rounded-none border-border bg-card shadow-md">
        {/* Nameplate header */}
        <div className="bg-foreground text-background px-4 py-2.5 flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold tracking-widest uppercase">MaintainIQ · Security Gateway</span>
          <span className="font-mono text-[9px] text-background/40">SEC-01</span>
        </div>
        <CardHeader className="space-y-1.5 text-center pt-5">
          {/* Square Wrench icon */}
          <div className="mx-auto w-9 h-9 bg-primary flex items-center justify-center mb-1.5 shadow-sm text-primary-foreground">
            <svg
              width="18"
              height="18"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M10.5 1.5C9.1 1.5 8 2.6 8 4c0 .3.1.6.2.9L2.8 9.3A2.5 2.5 0 0 0 1.5 11.5c0 1.4 1.1 2.5 2.5 2.5a2.5 2.5 0 0 0 2.2-1.3l5.4-5.4c.3.1.6.2.9.2 1.4 0 2.5-1.1 2.5-2.5 0-.4-.1-.8-.3-1.1L12.2 5.4l-1.6.4-.4 1.6-1.5 1.1c0-.1-.1-.3-.1-.5 0-.6.5-1 1-1 .1 0 .3 0 .4.1L11.4 5l1-1-.1-.1C12 3.6 11.3 3 10.5 3c-.1 0-.3 0-.4.1L11.5 1.8C11.2 1.6 10.9 1.5 10.5 1.5z"
                fill="currentColor"
              />
              <circle cx="4" cy="11.5" r="1" fill="currentColor" />
            </svg>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>MaintainIQ Portal</CardTitle>
          <CardDescription className="text-xs">
            Authenticate to access the asset registry and resolve assigned tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@maintainiq.com"
                className="rounded-none font-sans"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="rounded-none font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full mt-2 rounded-none font-mono text-xs" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Authenticating...
                </>
              ) : (
                "Establish Connection"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-dashed border-border px-5 py-4 text-xs text-muted-foreground text-center">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">demo bypass presets</span>
            <div className="flex gap-2 justify-center mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillDemoAccount("admin")}
                className="text-xs h-7 py-1 px-3 rounded-none font-mono"
                disabled={isSubmitting}
              >
                Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillDemoAccount("tech")}
                className="text-xs h-7 py-1 px-3 rounded-none font-mono"
                disabled={isSubmitting}
              >
                Technician
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillDemoAccount("employee")}
                className="text-xs h-7 py-1 px-3 rounded-none font-mono"
                disabled={isSubmitting}
              >
                Employee
              </Button>
            </div>
          </div>
          <div>
            <span>Don't have an account? </span>
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </div>
          <span className="font-mono text-[9px] text-muted-foreground/50 mt-1 uppercase tracking-widest">
            MaintainIQ · SMIT Track B
          </span>
        </CardFooter>
      </Card>
    </div>
  )
}
export default LoginPage


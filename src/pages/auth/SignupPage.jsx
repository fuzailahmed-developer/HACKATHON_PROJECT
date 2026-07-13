import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"

const ROLES = ["Employee", "Technician", "Admin"]

export function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("Employee")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { signup, getRoleHome } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim() || !email || !password) {
      toast.error("Please fill in all required fields.")
      return
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    setIsSubmitting(true)
    try {
      await signup(name.trim(), email, password, role)
      toast.success("Account created successfully!")
      // signup() auto-signs in via Firebase — redirect to role home
      const home =
        role === "Admin"
          ? "/dashboard"
          : role === "Technician"
          ? "/technician"
          : "/employee"
      navigate(home, { replace: true })
    } catch (error) {
      console.error("Signup failed:", error)
      if (error.code === "auth/email-already-in-use") {
        toast.error("This email is already registered. Try logging in instead.")
      } else {
        toast.error(error.message || "Signup failed. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm rounded-none border-border bg-card shadow-md">
        {/* Nameplate header */}
        <div className="bg-foreground text-background px-4 py-2.5 flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold tracking-widest uppercase">
            MaintainIQ · New Account
          </span>
          <span className="font-mono text-[9px] text-background/40">REG-01</span>
        </div>

        <CardHeader className="space-y-1.5 text-center pt-5">
          {/* Icon */}
          <div className="mx-auto w-9 h-9 bg-primary flex items-center justify-center mb-1.5 shadow-sm text-primary-foreground">
            <UserPlus className="h-[18px] w-[18px]" />
          </div>
          <CardTitle
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Create Account
          </CardTitle>
          <CardDescription className="text-xs">
            Register to report issues, track assets, and manage maintenance.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-5 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="signup-name"
                className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
              >
                Full Name
              </Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="John Doe"
                className="rounded-none font-sans"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="signup-email"
                className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
              >
                Email Address
              </Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                className="rounded-none font-sans"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="signup-password"
                className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
              >
                Password
              </Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                className="rounded-none font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="signup-confirm"
                className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
              >
                Confirm Password
              </Label>
              <Input
                id="signup-confirm"
                type="password"
                placeholder="••••••••"
                className="rounded-none font-mono"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Role Selector */}
            <div className="space-y-1.5">
              <Label
                htmlFor="signup-role"
                className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
              >
                Account Role
              </Label>
              <Select
                value={role}
                onValueChange={setRole}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="signup-role"
                  className="rounded-none text-sm"
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                {role === "Employee" &&
                  "Report issues on assets and track your submitted tickets."}
                {role === "Technician" &&
                  "Receive assignments, update maintenance status, and resolve issues."}
                {role === "Admin" &&
                  "Full access — manage assets, issues, technicians, and analytics."}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full mt-2 rounded-none font-mono text-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />{" "}
                  Creating Account...
                </>
              ) : (
                "Register Account"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-dashed border-border px-5 py-4 text-xs text-muted-foreground text-center">
          <span>
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
            >
              Sign in
            </Link>
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/50 mt-1 uppercase tracking-widest">
            MaintainIQ · SMIT Track B
          </span>
        </CardFooter>
      </Card>
    </div>
  )
}

export default SignupPage

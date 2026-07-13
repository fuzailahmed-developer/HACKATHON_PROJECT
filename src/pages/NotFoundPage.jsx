import React from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { HelpCircle, ArrowLeft } from "lucide-react"

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/20 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
        <HelpCircle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-black text-foreground tracking-tight">404 - Page Not Found</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        The link you scanned or navigated to does not exist or has been removed from our systems.
      </p>
      <Button asChild className="mt-6" size="sm">
        <Link to="/login">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go to Login Portal
        </Link>
      </Button>
    </div>
  )
}
export default NotFoundPage

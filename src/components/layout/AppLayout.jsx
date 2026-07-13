import React, { useState } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "./Sidebar"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Bell } from "lucide-react"

// Human-readable route labels for breadcrumb
const routeLabels = {
  "/dashboard": "Dashboard",
  "/assets": "Asset Registry",
  "/assets/new": "Register Asset",
  "/issues": "Issue Queue",
  "/technician": "My Assignments",
}

/**
 * AppLayout — main wrapper for authenticated users.
 * Desktop sidebar + mobile header with industrial styling.
 */
export function AppLayout() {
  const { userProfile } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Derive a breadcrumb label for the current route
  const currentLabel =
    routeLabels[location.pathname] ||
    (location.pathname.includes("/assets/") && location.pathname.includes("/edit")
      ? "Edit Asset"
      : location.pathname.includes("/assets/")
      ? "Asset Detail"
      : location.pathname.includes("/issues/")
      ? "Issue Detail"
      : "")

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <Sidebar className="h-full" />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between h-14 px-4 md:px-6 bg-card border-b-2 border-border z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64" showCloseButton={false}>
                <Sidebar className="h-full border-r-0" onClose={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Brand (mobile) */}
            <span className="text-sm font-bold text-foreground md:hidden tracking-tight">
              MaintainIQ
            </span>

            {/* Breadcrumb path (desktop) */}
            {currentLabel && (
              <div className="hidden md:flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-muted-foreground/60 tracking-widest uppercase">
                  MaintainIQ
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/40">/</span>
                <span className="font-mono text-[10px] text-foreground/70 tracking-wider uppercase font-semibold">
                  {currentLabel}
                </span>
              </div>
            )}
          </div>

          {/* Right: Bell + User info */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-muted rounded-none h-8 w-8"
            >
              <Bell className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 border-l pl-3 border-border">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-foreground leading-tight">
                  {userProfile?.name}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground tracking-wider uppercase">
                  {userProfile?.role}
                </span>
              </div>
              {/* Avatar initials */}
              <div className="flex items-center justify-center w-7 h-7 bg-primary text-primary-foreground font-mono font-bold text-xs">
                {userProfile?.name
                  ? userProfile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                  : "?"}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
export default AppLayout

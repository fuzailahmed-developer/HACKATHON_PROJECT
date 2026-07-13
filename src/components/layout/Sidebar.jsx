import React from "react"
import { NavLink } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  Boxes,
  ClipboardList,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Sidebar — role-aware navigation.
 * Steel dark background, left-border active indicator (not background fill),
 * brand mark as a wrench-in-square SVG icon.
 */
export function Sidebar({ className, onClose }) {
  const { userProfile, logout, isAdmin, isTechnician } = useAuth()

  const links = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["Admin", "Technician"],
    },
    {
      to: "/assets",
      label: "Asset Registry",
      icon: Boxes,
      roles: ["Admin"],
    },
    {
      to: "/issues",
      label: "Issue Queue",
      icon: ClipboardList,
      roles: ["Admin"],
    },
    {
      to: "/technician",
      label: "My Assignments",
      icon: ClipboardList,
      roles: ["Technician"],
    },
    {
      to: "/employee",
      label: "My Reports",
      icon: ClipboardList,
      roles: ["Employee"],
    },
  ]

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border">
        {/* Wrench-in-square brand mark */}
        <div className="flex items-center justify-center w-7 h-7 bg-primary shrink-0">
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10.5 1.5C9.1 1.5 8 2.6 8 4c0 .3.1.6.2.9L2.8 9.3A2.5 2.5 0 0 0 1.5 11.5c0 1.4 1.1 2.5 2.5 2.5a2.5 2.5 0 0 0 2.2-1.3l5.4-5.4c.3.1.6.2.9.2 1.4 0 2.5-1.1 2.5-2.5 0-.4-.1-.8-.3-1.1L12.2 5.4l-1.6.4-.4 1.6-1.5 1.1c0-.1-.1-.3-.1-.5 0-.6.5-1 1-1 .1 0 .3 0 .4.1L11.4 5l1-1-.1-.1C12 3.6 11.3 3 10.5 3c-.1 0-.3 0-.4.1L11.5 1.8C11.2 1.6 10.9 1.5 10.5 1.5z"
              fill="currentColor"
              className="text-primary-foreground"
            />
            <circle cx="4" cy="11.5" r="1" fill="currentColor" className="text-primary-foreground" />
          </svg>
        </div>
        <div>
          <span
            className="font-bold text-sidebar-foreground tracking-tight leading-none block"
            style={{ fontFamily: "var(--font-heading)", fontSize: "14px" }}
          >
            MaintainIQ
          </span>
          <span className="font-mono text-[9px] text-sidebar-foreground/40 tracking-widest uppercase">
            ops platform
          </span>
        </div>
      </div>

      {/* Separator label */}
      <div className="px-5 pt-5 pb-2">
        <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-sidebar-foreground/30">
          Navigation
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-0.5">
        {links
          .filter((link) => link.roles.includes(userProfile?.role))
          .map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors relative group",
                    isActive
                      ? "text-sidebar-foreground bg-sidebar-accent border-l-2 border-primary pl-[10px]"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            )
          })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          {/* Square avatar */}
          <div className="flex items-center justify-center w-8 h-8 bg-primary/20 text-primary font-mono font-bold text-xs shrink-0">
            {userProfile?.name
              ? userProfile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {userProfile?.name || "User"}
            </p>
            <p className="font-mono text-[9px] text-sidebar-foreground/40 tracking-widest uppercase truncate">
              {userProfile?.role || "Role"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            logout()
            if (onClose) onClose()
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
export default Sidebar

import React from "react"
import { Outlet, Link } from "react-router-dom"
import { ShieldCheck } from "lucide-react"

/**
 * PublicLayout — minimal layout for public-facing QR scan pages.
 * Clean, mobile-first. Navbar uses steel background for authority/trust.
 */
export function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Public Navbar — steel dark for trust/authority */}
      <nav className="bg-sidebar border-b border-sidebar-border py-3 px-4 sticky top-0 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {/* Brand mark */}
            <div className="flex items-center justify-center w-6 h-6 bg-primary shrink-0">
              <svg width="12" height="12" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path
                  d="M10.5 1.5C9.1 1.5 8 2.6 8 4c0 .3.1.6.2.9L2.8 9.3A2.5 2.5 0 0 0 1.5 11.5c0 1.4 1.1 2.5 2.5 2.5a2.5 2.5 0 0 0 2.2-1.3l5.4-5.4c.3.1.6.2.9.2 1.4 0 2.5-1.1 2.5-2.5 0-.4-.1-.8-.3-1.1L12.2 5.4l-1.6.4-.4 1.6-1.5 1.1c0-.1-.1-.3-.1-.5 0-.6.5-1 1-1 .1 0 .3 0 .4.1L11.4 5l1-1-.1-.1C12 3.6 11.3 3 10.5 3c-.1 0-.3 0-.4.1L11.5 1.8C11.2 1.6 10.9 1.5 10.5 1.5z"
                  fill="white"
                />
                <circle cx="4" cy="11.5" r="1" fill="white" />
              </svg>
            </div>
            <span
              className="font-bold text-sidebar-foreground tracking-tight text-sm"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              MaintainIQ
            </span>
          </Link>
          <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-sidebar-foreground/50 uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3 text-primary" />
            Secure QR Scan
          </div>
        </div>
      </nav>

      {/* Main Container — narrow, mobile-first */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-5 border-t border-border text-center">
        <div className="max-w-lg mx-auto px-4">
          <p className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-widest">
            © {new Date().getFullYear()} MaintainIQ · Secure Asset Portal · No login required for guest reporters
          </p>
        </div>
      </footer>
    </div>
  )
}
export default PublicLayout

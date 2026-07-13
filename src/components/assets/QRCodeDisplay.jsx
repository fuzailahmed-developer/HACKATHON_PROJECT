import React, { useRef } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Download, Link as LinkIcon, ExternalLink, Printer } from "lucide-react"
import { toast } from "sonner"
import { ORG_INFO } from "@/lib/constants"

/**
 * QRCodeDisplay — equipment nameplate / asset tag.
 * Styled to look like a physical, printable equipment tag
 * with registration corner marks, hard black border, and asset code
 * displayed in large monospace below the QR code.
 *
 * @param {object} props
 * @param {object} props.asset - Asset document
 */
export function QRCodeDisplay({ asset }) {
  const canvasRef = useRef(null)

  if (!asset) return null

  const publicUrl = `${window.location.origin}/asset/${asset.code}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    toast.success("Public asset URL copied to clipboard!")
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      toast.error("Failed to generate download image.")
      return
    }
    const pngUrl = canvas.toDataURL("image/png")
    const downloadLink = document.createElement("a")
    downloadLink.href = pngUrl
    downloadLink.download = `MaintainIQ-QR-${asset.code}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    toast.success("QR code downloaded successfully!")
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-3">
      {/* ── NAMEPLATE CARD ───────────────────────────────────── */}
      {/* Styled as a physical equipment identification tag */}
      <div className="nameplate-tag p-0 overflow-hidden">
        {/* Corner registration marks are injected by CSS ::before ::after + span children */}
        <span className="nameplate-corner-bl" aria-hidden="true">+</span>
        <span className="nameplate-corner-br" aria-hidden="true">+</span>

        {/* Header bar */}
        <div className="bg-foreground text-background px-4 py-2 flex items-center justify-between">
          <span
            className="font-mono text-[9px] font-bold tracking-widest uppercase"
            style={{ letterSpacing: "0.14em" }}
          >
            {ORG_INFO.name} · Equipment ID
          </span>
          <span className="font-mono text-[9px] text-background/50 tracking-widest">
            MIQ-TAG
          </span>
        </div>

        {/* QR Code — centered, white background for scannability */}
        <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-5">
          <div className="p-3 bg-white border border-border/40">
            <QRCodeCanvas
              id={`qr-canvas-${asset.code}`}
              value={publicUrl}
              size={148}
              level="H"
              includeMargin={false}
              ref={canvasRef}
            />
          </div>

          {/* Asset code — large mono, reads like a stamped nameplate */}
          <div className="text-center">
            <div
              className="font-mono font-bold tracking-widest text-foreground border border-border/60 px-3 py-1.5 bg-muted/40 text-base"
              style={{ letterSpacing: "0.12em" }}
            >
              {asset.code}
            </div>
            <p className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mt-1.5">
              {asset.name}
            </p>
          </div>

          {/* Scan instruction */}
          <p className="font-mono text-[9px] text-muted-foreground text-center leading-relaxed max-w-[200px] border-t border-dashed border-border pt-3 w-full">
            Scan to access asset status &amp; report issues. No login required.
          </p>
        </div>
      </div>

      {/* ── PUBLIC URL ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-muted/40 border border-border px-3 py-2">
        <span className="font-mono text-[9px] text-muted-foreground break-all flex-1 select-all">
          {publicUrl}
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          className="h-5 w-5 shrink-0 rounded-none"
          onClick={handleCopyLink}
          title="Copy link"
        >
          <LinkIcon className="h-3 w-3" />
        </Button>
      </div>

      {/* ── ACTIONS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" onClick={handleDownload} className="text-xs rounded-none font-mono">
          <Download className="h-3.5 w-3.5 mr-1.5" /> Download
        </Button>
        <Button size="sm" variant="outline" onClick={handlePrint} className="text-xs rounded-none font-mono">
          <Printer className="h-3.5 w-3.5 mr-1.5" /> Print Label
        </Button>
        <Button size="sm" variant="secondary" asChild className="text-xs col-span-2 rounded-none font-mono">
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Public Page
          </a>
        </Button>
      </div>
    </div>
  )
}
export default QRCodeDisplay

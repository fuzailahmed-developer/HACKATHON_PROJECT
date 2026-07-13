import React from "react"
import { QRCodeCanvas } from "qrcode.react"
import { ORG_INFO } from "@/lib/constants"

/**
 * PrintableLabel — print-only nameplate tag.
 * Formats the asset as a physical equipment identification tag
 * when window.print() is executed. Matches the on-screen nameplate aesthetic.
 * @param {object} props
 * @param {object} props.asset
 */
export function PrintableLabel({ asset }) {
  if (!asset) return null

  const publicUrl = `${window.location.origin}/asset/${asset.code}`

  return (
    <div className="printable-label hidden print:block">
      {/* Nameplate tag — hard black border, registration marks, ready to laminate */}
      <div
        style={{
          border: "2px solid #1C2B35",
          maxWidth: "320px",
          margin: "0 auto",
          fontFamily: "'IBM Plex Mono', monospace",
          backgroundColor: "white",
          color: "#1C2B35",
          position: "relative",
        }}
      >
        {/* Corner marks */}
        <span style={{ position: "absolute", top: 4, left: 8, fontSize: 10, fontWeight: 700, color: "#6B7B8A" }}>+</span>
        <span style={{ position: "absolute", top: 4, right: 8, fontSize: 10, fontWeight: 700, color: "#6B7B8A" }}>+</span>
        <span style={{ position: "absolute", bottom: 4, left: 8, fontSize: 10, fontWeight: 700, color: "#6B7B8A" }}>+</span>
        <span style={{ position: "absolute", bottom: 4, right: 8, fontSize: 10, fontWeight: 700, color: "#6B7B8A" }}>+</span>

        {/* Header bar */}
        <div
          style={{
            backgroundColor: "#1C2B35",
            color: "white",
            padding: "6px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 9, letterSpacing: "0.14em", fontWeight: 700, textTransform: "uppercase" }}>
            {ORG_INFO.name} · Equipment ID
          </span>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>
            MIQ-TAG
          </span>
        </div>

        {/* QR Code */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px 24px 16px",
            gap: "12px",
          }}
        >
          <div style={{ padding: 8, border: "1px solid #CDD4DA", backgroundColor: "white" }}>
            <QRCodeCanvas value={publicUrl} size={140} level="H" includeMargin={false} />
          </div>

          {/* Asset code */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.12em",
                border: "1px solid #CDD4DA",
                padding: "4px 12px",
                backgroundColor: "#F0F2F4",
                display: "inline-block",
              }}
            >
              {asset.code}
            </div>
            <div style={{ fontSize: 9, color: "#6B7B8A", marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {asset.name}
            </div>
          </div>

          {/* Specs */}
          <div
            style={{
              borderTop: "1px dashed #CDD4DA",
              paddingTop: 10,
              width: "100%",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px 16px",
              fontSize: 9,
            }}
          >
            <div>
              <div style={{ color: "#6B7B8A", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Location</div>
              <div style={{ fontWeight: 700 }}>{asset.location || "—"}</div>
            </div>
            <div>
              <div style={{ color: "#6B7B8A", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Category</div>
              <div style={{ fontWeight: 700 }}>{asset.category || "—"}</div>
            </div>
          </div>

          {/* Instruction */}
          <p
            style={{
              fontSize: 8,
              color: "#6B7B8A",
              textAlign: "center",
              borderTop: "1px dashed #CDD4DA",
              paddingTop: 8,
              width: "100%",
              lineHeight: 1.5,
              letterSpacing: "0.04em",
            }}
          >
            {ORG_INFO.labelInstructions}
          </p>
        </div>
      </div>
    </div>
  )
}
export default PrintableLabel

import React, { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAssetByCode } from "@/hooks/useAssets"
import { useCreateIssue } from "@/hooks/useIssues"
import { useAuth } from "@/contexts/AuthContext"
import { triageIssue } from "@/lib/api"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  Loader2,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Camera,
  Clipboard,
  ShieldAlert,
  UserCheck,
} from "lucide-react"
import { ISSUE_CATEGORIES, PRIORITIES } from "@/lib/constants"
import { toast } from "sonner"

export function PublicReportPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { currentUser, userProfile, loading: authLoading } = useAuth()

  // Gate check: must be logged in to report an issue
  useEffect(() => {
    if (!authLoading && !currentUser) {
      toast.error("You must be logged in to report an issue.")
      navigate("/login", {
        state: { from: { pathname: `/asset/${code}/report` } },
        replace: true,
      })
    }
  }, [currentUser, authLoading, code, navigate])

  // Fetch corresponding asset
  const { data: asset, isLoading: assetLoading } = useAssetByCode(code)
  const createIssueMutation = useCreateIssue()

  // Form State
  const [description, setDescription] = useState("")
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // AI & Triage Step State
  const [step, setStep] = useState(1) // 1: Initial Form, 2: Review Triage, 3: Success Screen
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState(null)
  
  // Editable fields prefilled by AI (or manual fallback)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("General Maintenance")
  const [priority, setPriority] = useState("Medium")
  const [possibleCauses, setPossibleCauses] = useState([])
  const [initialChecks, setInitialChecks] = useState([])
  const [safetyWarning, setSafetyWarning] = useState(null)
  const [wasEdited, setWasEdited] = useState(false)

  // Final ticket number
  const [issueNumber, setIssueNumber] = useState("")

  const isLoading = authLoading || assetLoading

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground mt-2">Loading asset tag metadata...</span>
      </div>
    )
  }

  // Prevent render if not logged in to avoid flash of form before redirect
  if (!currentUser) {
    return null
  }

  if (!asset) {
    return (
      <div className="max-w-md mx-auto py-12 text-center px-4 space-y-4">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <h3 className="font-bold text-lg">Asset Not Found</h3>
        <p className="text-sm text-muted-foreground">The asset you are attempting to report on is invalid.</p>
        <Button asChild size="sm">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    )
  }

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  // Handle initial submission - call AI Triage
  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error("Please describe the issue or problem.")
      return
    }

    setAiLoading(true)
    try {
      // Call edge AI Triage proxy
      const triage = await triageIssue({
        complaint: description,
        assetType: asset.name,
        assetCategory: asset.category,
      })

      if (triage) {
        setAiResults(triage)
        setTitle(triage.title || "")
        setCategory(triage.category || "General Maintenance")
        setPriority(triage.priority || "Medium")
        setPossibleCauses(triage.possibleCauses || [])
        setInitialChecks(triage.initialChecks || [])
        setSafetyWarning(triage.safetyWarning || null)
        
        toast.success("AI Triage analysis completed successfully!")
      } else {
        // Fallback to fully manual form
        toast.warning("AI triage analysis unavailable. Switching to manual categorization.")
        setTitle(`Malfunction in ${asset.name}`)
        setCategory("General Maintenance")
        setPriority("Medium")
        setSafetyWarning(null)
      }
      setStep(2)
    } catch (err) {
      console.error(err)
      toast.error("Failed to process issue details. Proceeding with manual input.")
      setTitle(`Malfunction in ${asset.name}`)
      setCategory("General Maintenance")
      setPriority("Medium")
      setStep(2)
    } finally {
      setAiLoading(false)
    }
  }

  // Handle final submission (including file uploads and Firestore save)
  const handleSubmitFinal = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Please enter a short title for the ticket.")
      return
    }

    setUploadingFiles(true)
    try {
      // 1. Upload files to Storage if any
      const evidenceUrls = []
      for (const file of selectedFiles) {
        const fileRef = ref(storage, `evidence/${asset.code}/${Date.now()}_${file.name}`)
        await uploadBytes(fileRef, file)
        const downloadUrl = await getDownloadURL(fileRef)
        evidenceUrls.push(downloadUrl)
      }

      // Check if user edited AI suggestions
      const isTitleEdited = aiResults && title !== aiResults.title
      const isCategoryEdited = aiResults && category !== aiResults.category
      const isPriorityEdited = aiResults && priority !== aiResults.priority
      const isEditedNow = isTitleEdited || isCategoryEdited || isPriorityEdited || wasEdited

      // Reporter identity details
      const reporterName = userProfile?.name || currentUser.displayName || currentUser.email || "Unknown Employee"
      const reporterContact = currentUser.email || null

      // 2. Submit ticket
      const issue = await createIssueMutation.mutateAsync({
        assetId: asset.id,
        reporterName,
        reportedBy: currentUser.uid,
        reporterContact,
        title,
        description,
        category,
        priority,
        evidenceUrls,
        aiSuggested: aiResults
          ? {
              ...aiResults,
              wasEdited: isEditedNow,
            }
          : null,
      })

      setIssueNumber(issue.issueNumber)
      setStep(3)
      toast.success("Ticket submitted successfully!")
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Failed to submit ticket.")
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(issueNumber)
    toast.success("Issue number copied to clipboard!")
  }

  return (
    <div className="space-y-4 pb-8">

      {/* Header Info — asset nameplate strip */}
      <div className="bg-card border border-border">
        <div className="bg-foreground text-background px-4 py-2 flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold tracking-widest uppercase">Service Ticket — New Issue Report</span>
          <span className="font-mono text-[9px] text-background/40">{step}/3</span>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h2
              className="font-bold text-foreground leading-tight"
              style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem" }}
            >
              {asset.name}
            </h2>
            <span className="font-mono text-xs text-muted-foreground tracking-widest">{asset.code}</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-6 h-1 transition-all ${s <= step ? 'bg-primary' : 'bg-muted-foreground/20'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Initial Complaint */}
      {step === 1 && (
        <div className="bg-card border border-border">
          <form id="complaint-form" onSubmit={handleAnalyze}>
            {/* 01 — DESCRIBE THE ISSUE */}
            <div className="service-ticket-step px-4">
              <span className="service-ticket-number">01 — Describe the Issue</span>
              <p className="text-xs text-muted-foreground mb-3">
                What did you notice? Be as specific as possible — our AI will classify and prioritize automatically.
              </p>
              <Textarea
                id="complaint-desc"
                placeholder="e.g. Elevator doors are stuck on floor 2. There is a grinding noise when the motor runs."
                className="min-h-[110px] rounded-none font-sans text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={aiLoading}
              />
            </div>

            {/* 02 — REPORTER IDENTITY (READ-ONLY) */}
            <div className="service-ticket-step px-4">
              <span className="service-ticket-number">02 — Reporter Identity</span>
              <p className="text-xs text-muted-foreground mb-3">
                Your report will be automatically tracked under the following authenticated identity.
              </p>
              <div className="bg-muted/40 border border-border/80 p-3 font-mono text-xs space-y-1.5 rounded-none flex items-start gap-2.5">
                <UserCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>
                    <span className="text-muted-foreground uppercase text-[10px] tracking-wider">Name:</span>{" "}
                    <span className="font-bold text-foreground">{userProfile?.name || currentUser.displayName || "Unknown User"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase text-[10px] tracking-wider">Email:</span>{" "}
                    <span className="font-bold text-foreground">{currentUser.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase text-[10px] tracking-wider">Role:</span>{" "}
                    <span className="font-bold text-primary uppercase text-[10px] tracking-widest">{userProfile?.role || "Employee"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 03 — ATTACH PHOTOS */}
            <div className="service-ticket-step px-4">
              <span className="service-ticket-number">03 — Attach Photo Evidence <span className="font-normal normal-case">(optional)</span></span>
              <div className="space-y-1.5">
                <Input
                  id="evidence-files"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={aiLoading}
                  className="text-xs"
                />
                {selectedFiles.length > 0 && (
                  <p className="font-mono text-[9px] text-muted-foreground mt-1">
                    {selectedFiles.length} file(s) attached
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="service-ticket-step px-4 flex items-center justify-between">
              <Button variant="outline" size="sm" asChild disabled={aiLoading} className="rounded-none font-mono text-xs">
                <Link to={`/asset/${asset.code}`}>Cancel</Link>
              </Button>
              <Button
                form="complaint-form"
                type="submit"
                size="sm"
                disabled={aiLoading}
                className="rounded-none font-mono text-xs"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    Analyze &amp; Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Review AI Triage Prefills */}
      {step === 2 && (
        <div className="bg-card border border-border">
          {/* Safety Warning — full width, prominent */}
          {safetyWarning && (
            <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900 border-l-4 border-l-red-600 p-4 flex gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 text-red-700 mt-0.5" />
              <div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-red-800 dark:text-red-300 block mb-0.5">
                  ⚠ Critical Safety Flag
                </span>
                <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed font-semibold">{safetyWarning}</p>
              </div>
            </div>
          )}

          <form id="triage-form" onSubmit={handleSubmitFinal}>
            {/* AI badge */}
            <div className="service-ticket-step px-4">
              <span className="service-ticket-number">
                <Sparkles className="h-2.5 w-2.5 inline-block mr-1 text-primary" />
                AI Classification — Review &amp; Confirm
              </span>
              <p className="text-xs text-muted-foreground mb-3">
                Our AI analyzed your complaint. Review and edit the fields below before filing the ticket.
              </p>

              {/* Short Title */}
              <div className="space-y-1.5 mb-3">
                <Label htmlFor="triage-title" className="font-mono text-[10px] uppercase tracking-wider">Ticket Summary Title</Label>
                <Input
                  id="triage-title"
                  className="rounded-none font-sans"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setWasEdited(true) }}
                  required
                  disabled={uploadingFiles}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="triage-category" className="font-mono text-[10px] uppercase tracking-wider">Category</Label>
                  <Select onValueChange={(val) => { setCategory(val); setWasEdited(true) }} value={category} disabled={uploadingFiles}>
                    <SelectTrigger id="triage-category" className="rounded-none text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {ISSUE_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="triage-priority" className="font-mono text-[10px] uppercase tracking-wider">Priority</Label>
                  <Select onValueChange={(val) => { setPriority(val); setWasEdited(true) }} value={priority} disabled={uploadingFiles}>
                    <SelectTrigger id="triage-priority" className="rounded-none text-xs">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* AI extra context */}
            {aiResults && (possibleCauses.length > 0 || initialChecks.length > 0) && (
              <div className="service-ticket-step px-4">
                <span className="service-ticket-number">AI Diagnostic Notes</span>
                <div className="space-y-3 text-xs">
                  {possibleCauses.length > 0 && (
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Possible Causes</span>
                      <ul className="list-disc list-inside space-y-0.5 text-muted-foreground leading-relaxed pl-1">
                        {possibleCauses.slice(0, 3).map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                  {initialChecks.length > 0 && (
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Suggested Diagnostics</span>
                      <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground leading-relaxed font-medium pl-1">
                        {initialChecks.slice(0, 3).map((c, i) => <li key={i}>{c}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="service-ticket-step px-4 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} disabled={uploadingFiles} className="rounded-none font-mono text-xs">
                ← Back
              </Button>
              <Button form="triage-form" type="submit" size="sm" disabled={uploadingFiles} className="rounded-none font-mono text-xs">
                {uploadingFiles ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Filing ticket...</>
                ) : (
                  "File Ticket Report →"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Success Confirmation — Ticket Receipt */}
      {step === 3 && (
        <div className="bg-card border border-border">
          {/* Dark header bar */}
          <div className="bg-foreground text-background px-4 py-2 flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-emerald-400" /> Ticket Filed
            </span>
            <span className="font-mono text-[9px] text-background/40">3/3 Complete</span>
          </div>

          <div className="px-4 py-6 space-y-5 text-center">
            {/* Ticket number — the main event, large mono */}
            <div>
              <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-muted-foreground block mb-2">
                Ticket Reference Number
              </span>
              <div className="nameplate-tag inline-block mx-auto px-6 py-3">
                <span className="nameplate-corner-bl" aria-hidden="true">+</span>
                <span className="nameplate-corner-br" aria-hidden="true">+</span>
                <div
                  className="font-mono font-black text-foreground tracking-widest"
                  style={{ fontSize: "clamp(1.4rem, 5vw, 1.8rem)", letterSpacing: "0.1em" }}
                >
                  {issueNumber}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyNumber}
                className="mt-2 font-mono text-[10px] uppercase tracking-widest rounded-none"
              >
                <Clipboard className="h-3 w-3 mr-1.5" /> Copy Number
              </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Ticket logged. Our technicians will review your report and update the asset status.
              Keep this number — you can use it to track progress anytime.
            </p>

            <div className="flex flex-col gap-2 border-t border-dashed border-border pt-5">
              <Button asChild size="sm" className="w-full rounded-none font-mono text-xs">
                <Link to={`/track/${issueNumber}`}>Track This Issue</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full rounded-none font-mono text-xs">
                <Link to={`/asset/${asset.code}`}>← Back to Asset</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
export default PublicReportPage

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as zod from "zod"
import { useCreateMaintenanceRecord } from "@/hooks/useMaintenanceRecords"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"

// Validation schema
const maintenanceSchema = zod.object({
  findings: zod.string().min(5, "Findings must be at least 5 characters"),
  actionsTaken: zod.string().min(5, "Actions taken must be at least 5 characters"),
  cost: zod.coerce
    .number()
    .min(0, "Cost must be a positive number"),
  timeSpentMinutes: zod.coerce
    .number()
    .min(1, "Must spend at least 1 minute"),
  nextServiceDate: zod.string().optional().refine(
    (val) => !val || new Date(val) > new Date(),
    { message: "Next scheduled service date must be in the future" }
  ),
})

/**
 * MaintenanceForm modal content.
 * @param {object} props
 * @param {string} props.issueId
 * @param {string} props.assetId
 * @param {function} props.onSuccess - Callback on successful submission
 * @param {function} props.onCancel - Callback to close/dismiss
 */
export function MaintenanceForm({ issueId, assetId, onSuccess, onCancel }) {
  const createRecordMutation = useCreateMaintenanceRecord()
  const [parts, setParts] = useState([])
  const [partInput, setPartInput] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      findings: "",
      actionsTaken: "",
      cost: 0,
      timeSpentMinutes: 30,
      nextServiceDate: "",
    },
  })

  // Handle tags/parts used
  const handleAddPart = (e) => {
    e.preventDefault()
    if (!partInput.trim()) return
    if (parts.includes(partInput.trim())) return
    setParts([...parts, partInput.trim()])
    setPartInput("")
  }

  const handleRemovePart = (index) => {
    setParts(parts.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    try {
      await createRecordMutation.mutateAsync({
        issueId,
        assetId,
        findings: data.findings,
        actionsTaken: data.actionsTaken,
        partsUsed: parts,
        cost: data.cost,
        timeSpentMinutes: data.timeSpentMinutes,
        nextServiceDate: data.nextServiceDate || null,
      })
      toast.success("Maintenance log recorded successfully!")
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Failed to submit maintenance notes.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-0 divide-y divide-border/60">
      {/* Findings */}
      <div className="service-ticket-step pb-4">
        <span className="service-ticket-number">01 — Technical Findings / Diagnostics</span>
        <div className="space-y-1.5 mt-2">
          <Label htmlFor="findings" className="sr-only">Diagnostic Notes</Label>
          <Textarea
            id="findings"
            placeholder="Describe the issue identified (e.g. blown capacitor, worn fan belt)"
            className="rounded-none min-h-[80px]"
            {...register("findings")}
          />
          {errors.findings && (
            <p className="text-xs font-mono font-bold text-destructive mt-1">{errors.findings.message}</p>
          )}
        </div>
      </div>

      {/* Actions Taken */}
      <div className="service-ticket-step py-4">
        <span className="service-ticket-number">02 — Actions Taken / Repairs Performed</span>
        <div className="space-y-1.5 mt-2">
          <Label htmlFor="actionsTaken" className="sr-only">Repairs Performed</Label>
          <Textarea
            id="actionsTaken"
            placeholder="Describe how the issue was resolved (e.g. replaced fan belt, calibrated thermostat)"
            className="rounded-none min-h-[80px]"
            {...register("actionsTaken")}
          />
          {errors.actionsTaken && (
            <p className="text-xs font-mono font-bold text-destructive mt-1">{errors.actionsTaken.message}</p>
          )}
        </div>
      </div>

      {/* Parts Used */}
      <div className="service-ticket-step py-4">
        <span className="service-ticket-number">03 — Parts &amp; Materials Used</span>
        <div className="space-y-1.5 mt-2">
          <div className="flex gap-2">
            <Input
              id="parts"
              placeholder="e.g. Fan Belt XL-40"
              className="rounded-none font-sans"
              value={partInput}
              onChange={(e) => setPartInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddPart(e)
                }
              }}
            />
            <Button type="button" variant="secondary" className="rounded-none font-mono text-xs" onClick={handleAddPart}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          {parts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 bg-muted/50 p-2 border border-border">
              {parts.map((part, index) => (
                <span
                  key={index}
                  className="text-[10px] font-mono bg-card text-foreground border border-border font-bold px-2 py-0.5 rounded-none flex items-center gap-1.5"
                >
                  {part}
                  <button
                    type="button"
                    onClick={() => handleRemovePart(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cost & Time */}
      <div className="service-ticket-step py-4">
        <span className="service-ticket-number">04 — Time &amp; Cost Tracking</span>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* Cost */}
          <div className="space-y-1.5">
            <Label htmlFor="cost" className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Material/Labor Cost ($)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              className="rounded-none font-mono"
              {...register("cost")}
            />
            {errors.cost && (
              <p className="text-xs font-mono font-bold text-destructive">{errors.cost.message}</p>
            )}
          </div>

          {/* Time Spent */}
          <div className="space-y-1.5">
            <Label htmlFor="timeSpentMinutes" className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Labor Time (Minutes)</Label>
            <Input
              id="timeSpentMinutes"
              type="number"
              min="1"
              className="rounded-none font-mono"
              {...register("timeSpentMinutes")}
            />
            {errors.timeSpentMinutes && (
              <p className="text-xs font-mono font-bold text-destructive">{errors.timeSpentMinutes.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Next scheduled service */}
      <div className="service-ticket-step py-4">
        <span className="service-ticket-number">05 — Follow-up Schedule (Optional)</span>
        <div className="space-y-1.5 mt-2">
          <Label htmlFor="nextServiceDate" className="sr-only">Next Service Date</Label>
          <Input
            id="nextServiceDate"
            type="date"
            className="rounded-none font-mono"
            {...register("nextServiceDate")}
          />
          {errors.nextServiceDate && (
            <p className="text-xs font-mono font-bold text-destructive mt-1">{errors.nextServiceDate.message}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="service-ticket-step pt-4 flex justify-end gap-2 border-t border-border mt-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-none font-mono text-xs"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="rounded-none font-mono text-xs"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            "Complete Resolution"
          )}
        </Button>
      </div>
    </form>
  )
}
export default MaintenanceForm

import React, { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as zod from "zod"
import { useAsset, useCreateAsset, useUpdateAsset } from "@/hooks/useAssets"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ASSET_CATEGORIES, ASSET_CONDITIONS, ASSET_STATUSES } from "@/lib/constants"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Save } from "lucide-react"

// Form validation schema
const assetSchema = zod.object({
  name: zod.string().min(3, "Name must be at least 3 characters").max(100, "Name too long"),
  category: zod.string().min(1, "Please select a category"),
  location: zod.string().min(2, "Location must specify a place"),
  condition: zod.string().min(1, "Please select an asset condition"),
  status: zod.string().optional(), // only used on edit
})

export function AssetFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  // Fetch asset details if in edit mode
  const { data: asset, isLoading: assetLoading } = useAsset(id)
  const createAssetMutation = useCreateAsset()
  const updateAssetMutation = useUpdateAsset()

  const [isSubmitting, setIsSubmitting] = useState(false)

  // react-hook-form setup
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      category: "",
      location: "",
      condition: "Good",
      status: "Operational",
    },
  })

  // Pre-fill form if editing
  useEffect(() => {
    if (isEditMode && asset) {
      setValue("name", asset.name || "")
      setValue("category", asset.category || "")
      setValue("location", asset.location || "")
      setValue("condition", asset.condition || "")
      setValue("status", asset.status || "Operational")
    }
  }, [isEditMode, asset, setValue])

  const onSubmit = async (formData) => {
    setIsSubmitting(true)
    try {
      if (isEditMode) {
        // Update asset
        const updates = {
          name: formData.name,
          category: formData.category,
          location: formData.location,
          condition: formData.condition,
          status: formData.status,
        }
        await updateAssetMutation.mutateAsync({ assetId: id, updates })
        toast.success("Asset updated successfully!")
        navigate(`/assets/${id}`)
      } else {
        // Create asset
        const newAsset = {
          name: formData.name,
          category: formData.category,
          location: formData.location,
          condition: formData.condition,
        }
        const created = await createAssetMutation.mutateAsync(newAsset)
        toast.success(`Asset created! Code: ${created.code}`)
        navigate("/assets")
      }
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Something went wrong saving the asset.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditMode && assetLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground mt-2">Loading asset data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
          <Link to={isEditMode ? `/assets/${id}` : "/assets"}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Link>
        </Button>
      </div>

      <PageHeader
        title={isEditMode ? `Edit Asset: ${asset?.code}` : "Register Physical Asset"}
        description={
          isEditMode
            ? "Modify asset description, placement, current condition, and mechanical status."
            : "Adding a new asset registers its unique ID and immediately generates a scannable QR label."
        }
      />

      <div className="max-w-2xl mx-auto">
        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle>{isEditMode ? "Asset Specifications" : "New Asset Information"}</CardTitle>
            <CardDescription>Fill out all required specifications accurately.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="asset-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Asset Name / Title</Label>
                <Input
                  id="name"
                  placeholder="e.g. Server Room HVAC Primary, Central Boiler"
                  {...register("name")}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-xs font-semibold text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSET_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && (
                    <p className="text-xs font-semibold text-destructive">{errors.category.message}</p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <Label htmlFor="location">Location / Placement</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Basement Utility Room, Floor 3 Office"
                    {...register("location")}
                    disabled={isSubmitting}
                  />
                  {errors.location && (
                    <p className="text-xs font-semibold text-destructive">{errors.location.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Condition */}
                <div className="space-y-1.5">
                  <Label htmlFor="condition">Asset Condition</Label>
                  <Controller
                    name="condition"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="condition">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSET_CONDITIONS.map((cond) => (
                            <SelectItem key={cond} value={cond}>
                              {cond}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.condition && (
                    <p className="text-xs font-semibold text-destructive">{errors.condition.message}</p>
                  )}
                </div>

                {/* Status - Only Visible in Edit Mode */}
                {isEditMode && (
                  <div className="space-y-1.5">
                    <Label htmlFor="status">Operational Status</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {ASSET_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.status && (
                      <p className="text-xs font-semibold text-destructive">{errors.status.message}</p>
                    )}
                  </div>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t pt-4">
            <Button
              variant="outline"
              asChild
              disabled={isSubmitting}
            >
              <Link to={isEditMode ? `/assets/${id}` : "/assets"}>Cancel</Link>
            </Button>
            <Button
              form="asset-form"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? "Save Changes" : "Register Asset"}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
export default AssetFormPage

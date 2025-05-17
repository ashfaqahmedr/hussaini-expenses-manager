"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { observer } from "mobx-react-lite"
import { useStore } from "@/store/StoreProvider"
import { toast } from "@/components/ui/use-toast"

interface EditOilEntryDialogProps {
  entry: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EditOilEntryDialog = observer(({ entry, open, onOpenChange }: EditOilEntryDialogProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const store = useStore()
  const { vehicles, vendors } = store

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toISOString().split("T")[0]
    } catch (error) {
      return ""
    }
  }

  // Form state
  const [date, setDate] = useState("")
  const [vehicleNo, setVehicleNo] = useState(entry?.VehicleNo || "")
  const [oilLiters, setOilLiters] = useState(entry?.OilinLiters || "")
  const [purchasedStock, setPurchasedStock] = useState(entry?.PurchasedStock || "")
  const [invoiceAmount, setInvoiceAmount] = useState(entry?.InvoiceAmount || "")
  const [vendor, setVendor] = useState(entry?.Vendor || "")
  const [remarks, setRemarks] = useState(entry?.Remarks || "")
  const [status, setStatus] = useState(entry?.Status || "Pending")

  useEffect(() => {
    if (open && entry) {
      // Set the date when the dialog opens
      setDate(formatDateForInput(entry.Date))
      setVehicleNo(entry.VehicleNo || "")
      setOilLiters(entry.OilinLiters || "")
      setPurchasedStock(entry.PurchasedStock || "")
      setInvoiceAmount(entry.InvoiceAmount || "")
      setVendor(entry.Vendor || "")
      setRemarks(entry.Remarks || "")
      setStatus(entry.Status || "Pending")
    }
    setIsDataLoading(false)
  }, [open, entry, store])

  const handleVehicleChange = (value: string) => {
    setVehicleNo(value)
    const selectedVehicle = vehicles.find((v) => v.VehicleNo === value)
    if (selectedVehicle) {
      setOilLiters(selectedVehicle.OilInLiters || "")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (entry.EntryType === "Sales" && (!vehicleNo || !oilLiters)) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    if (entry.EntryType === "Purchase" && (!purchasedStock || !invoiceAmount || !vendor)) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const updatedEntry = {
        ...entry,
        Date: date,
        VehicleNo: entry.EntryType === "Sales" ? vehicleNo : undefined,
        OilinLiters: entry.EntryType === "Sales" ? oilLiters : undefined,
        PurchasedStock: entry.EntryType === "Purchase" ? purchasedStock : undefined,
        InvoiceAmount: entry.EntryType === "Purchase" ? invoiceAmount : undefined,
        Vendor: entry.EntryType === "Purchase" ? vendor : undefined,
        Remarks: remarks,
        Status: status,
      }

      const success = await store.updateOilEntry(updatedEntry)
      if (success) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error updating entry:", error)
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit {entry?.EntryType} Entry</DialogTitle>
        </DialogHeader>

        {isDataLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            {entry?.EntryType === "Sales" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="vehicleNo">Vehicle No</Label>
                  <div className="relative">
                    <Input
                      id="vehicleNo"
                      list="vehicleList"
                      placeholder="Select or search Vehicle No"
                      value={vehicleNo}
                      onChange={(e) => handleVehicleChange(e.target.value)}
                      required
                    />
                    <datalist id="vehicleList">
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.VehicleNo} value={vehicle.VehicleNo} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oilLiters">Oil (Liters)</Label>
                  <Input
                    id="oilLiters"
                    type="text"
                    value={oilLiters}
                    onChange={(e) => setOilLiters(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="purchasedStock">Purchased Stock (Liters)</Label>
                  <Input
                    id="purchasedStock"
                    type="number"
                    value={purchasedStock}
                    onChange={(e) => setPurchasedStock(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceAmount">Invoice Amount</Label>
                  <Input
                    id="invoiceAmount"
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <div className="relative">
                    <Input
                      id="vendor"
                      list="vendorList"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      required
                    />
                    <datalist id="vendorList">
                      {vendors.map((v, index) => (
                        <option key={index} value={v as string} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>

                <SelectContent>
                  {store.entryStatus.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Entry"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
})

export default EditOilEntryDialog

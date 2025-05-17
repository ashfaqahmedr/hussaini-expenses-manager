"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react"
import { observer } from "mobx-react-lite"
import { useStore } from "@/store/StoreProvider"
import { toast } from "@/components/ui/use-toast"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
// import { TableHeader, TableRow, TableHead, TableBody, TableCell } from "./ui/table"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"

import type { TempEntry } from "@/store/store"

interface SaleEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SaleEntryDialog = observer(({ open, onOpenChange }: SaleEntryDialogProps) => {
  const store = useStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [vehicleNo, setVehicleNo] = useState("")
  const [oilLiters, setOilLiters] = useState("")
  const [remarks, setRemarks] = useState("")

  const handleVehicleChange = (value: string) => {
    setVehicleNo(value)
    const selectedVehicle = store.vehicles.find((v) => v.vehicleNo === value)
    if (selectedVehicle) {
      setOilLiters(selectedVehicle.oilInLiters || "")
    }
  }

  const handleAddEntry = () => {
    if (!vehicleNo || !oilLiters) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    // If it's a new vehicle, add it to the store
    const vehicleExists = store.vehicles.some((v) => v.vehicleNo === vehicleNo)
    if (!vehicleExists) {
      store.addVehicle({
        vehicleNo: vehicleNo,
        oilInLiters: oilLiters,
        contractor: "",
      })
    }

    if (isEditing) {
      // Update existing entry
      store.updateTempSaleEntry(isEditing, {
        Date: date,
        VehicleNo: vehicleNo,
        OilinLiters: oilLiters,
        Remarks: remarks,
      })
      setIsEditing(null)
    } else {
      // Add new entry
      store.addTempSaleEntry({
        SheetID: `temp-${Date.now()}`,
        EntryType: "Sales",
        Date: date,
        VehicleNo: vehicleNo,
        OilinLiters: oilLiters,
        Remarks: remarks,
      })
    }

    // Reset form
    resetForm()
  }

  const handleEditEntry = (entry: TempEntry) => {
    setDate(entry.Date)
    setVehicleNo(entry.VehicleNo || "")
    setOilLiters(entry.OilinLiters || "")
    setRemarks(entry.Remarks || "")
    setIsEditing(entry.SheetID)
  }

  const handleDeleteEntry = (id: string) => {
    store.removeTempSaleEntry(id)
  }

  const handleSubmitAll = async () => {
    if (store.tempSaleEntries.length === 0) {
      toast({
        title: "No Entries",
        description: "Please add at least one entry before submitting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const success = await store.submitSaleEntriesBulk()
      if (success) {
        resetForm()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setDate(new Date().toISOString().split("T")[0])
    setVehicleNo("")
    setOilLiters("")
    setRemarks("")
    setIsEditing(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-6xl max-h-[100vh] overflow-y-auto p-0 flex flex-col">
        <DialogHeader className="p-2">
          <DialogTitle>New Sale Entry</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Entry Form (always visible at top) */}
          <Card className="bg-background">
            {/* <CardHeader>
          <CardTitle>Add a new Sale entry</CardTitle>
        </CardHeader> */}
            <CardContent className="space-y-0">
              {/* Form Inputs */}
              <div className="flex flex-wrap gap-2 md:gap-2">
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="vehicleNo">Vehicle No</Label>
                  <Input
                    id="vehicleNo"
                    list="vehicleList"
                    placeholder="Select or search Vehicle No"
                    value={vehicleNo}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    required
                  />
                  <datalist id="vehicleList">
                    {store.vehicles.map((vehicle) => (
                      <option key={vehicle.vehicleNo} value={vehicle.vehicleNo} />
                    ))}
                  </datalist>
                </div>

                <div className="flex-1 min-w-[50px]">
                  <Label htmlFor="oilLiters">Oil (Liters)</Label>
                  <Input
                    id="oilLiters"
                    type="text"
                    value={oilLiters}
                    onChange={(e) => setOilLiters(e.target.value)}
                    required
                  />
                </div>

                <div className="flex-1 min-w-[100px] flex items-end">
                  <Button onClick={handleAddEntry} className="w-full">
                    {isEditing ? (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Enter any additional information"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={1}
                  className="min-h-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Scrollable Table Section */}
          {store.tempSaleEntries.length > 0 && (
            <div className="flex-1 overflow-auto p-0">
              <Card className="h-auto bg-background p-0">
                <CardHeader>
                  <CardTitle className="text-sm p-0">All Entries</CardTitle>
                </CardHeader>
                <CardContent className="overflow-auto p-0">
                  <div className="sticky w-auto overflow-x-auto p-0">
                    <Table className="min-w-[150px] text-sm">
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Oil</TableHead>
                          {/* <TableHead>Remarks</TableHead> */}
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {store.tempSaleEntries.map((entry) => (
                          <TableRow key={entry.SheetID}>
                            <TableCell>{entry.Date}</TableCell>
                            <TableCell>{entry.VehicleNo}</TableCell>
                            <TableCell>{entry.OilinLiters}</TableCell>
                            {/* <TableCell className="truncate max-w-[150px]">{entry.Remarks}</TableCell> */}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditEntry(entry)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.SheetID)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        <DialogFooter className="p-1 flex items-center justify-between flex-wrap gap-1 sm:flex-nowrap">
          <div className="text-sm text-muted-foreground">
            {store.tempSaleEntries.length} {store.tempSaleEntries.length === 1 ? "entry" : "entries"} ready to submit
          </div>
          <Button onClick={handleSubmitAll} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Entries"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

export default SaleEntryDialog

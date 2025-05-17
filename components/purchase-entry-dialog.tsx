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

interface PurchaseEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PurchaseEntryDialog = observer(({ open, onOpenChange }: PurchaseEntryDialogProps) => {
  const store = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isEditing, setIsEditing] = useState<string | null>(null)

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [purchasedStock, setPurchasedStock] = useState("")
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [vendor, setVendor] = useState("")
  const [remarks, setRemarks] = useState("")

  const handleAddEntry = () => {
    if (!purchasedStock || !invoiceAmount || !vendor) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    if (isEditing) {
      // Update existing entry
      store.updateTempPurchaseEntry(isEditing, {
        Date: date,
        PurchasedStock: purchasedStock,
        InvoiceAmount: invoiceAmount,
        Vendor: vendor,
        Remarks: remarks,
      })
      setIsEditing(null)
    } else {
      // Add new entry
      store.addTempPurchaseEntry({
        SheetID: `temp-${Date.now()}`,
        EntryType: "Purchase",
        Date: date,
        PurchasedStock: purchasedStock,
        InvoiceAmount: invoiceAmount,
        Vendor: vendor,
        Remarks: remarks,
      })
    }

    // Reset form
    resetForm()
  }

  const handleEditEntry = (entry: TempEntry) => {
    setDate(entry.Date)
    setPurchasedStock(entry.PurchasedStock || "")
    setInvoiceAmount(entry.InvoiceAmount || "")
    setVendor(entry.Vendor || "")
    setRemarks(entry.Remarks || "")
    setIsEditing(entry.SheetID)
  }

  const handleDeleteEntry = (id: string) => {
    store.removeTempPurchaseEntry(id)
  }

  const handleSubmitAll = async () => {
    if (store.tempPurchaseEntries.length === 0) {
      toast({
        title: "No Entries",
        description: "Please add at least one entry before submitting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const success = await store.submitPurchaseEntriesBulk()
      if (success) {
        resetForm()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setDate(new Date().toISOString().split("T")[0])
    setPurchasedStock("")
    setInvoiceAmount("")
    setVendor("")
    setRemarks("")
    setIsEditing(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-6xl max-h-[100vh] overflow-y-auto p-0 flex flex-col">
        <DialogHeader className="p-2">
          <DialogTitle>New Purchase Entry</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Sticky Entry Form Card */}
          <Card className="bg-background">
            {/* <CardHeader>
          <CardTitle>Add a new purchase entry</CardTitle>
        
        </CardHeader> */}
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 md:gap-2">
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="purchasedStock">Stock (Liters)</Label>
                  <Input
                    id="purchasedStock"
                    type="number"
                    placeholder="Enter quantity"
                    value={purchasedStock}
                    onChange={(e) => setPurchasedStock(e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="invoiceAmount">Invoice Amount</Label>
                  <Input
                    id="invoiceAmount"
                    type="number"
                    placeholder="Enter amount"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    list="vendorList"
                    placeholder="Select vendor"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    required
                  />
                  <datalist id="vendorList">
                    {store.vendors.map((v, index) => (
                      <option key={index} value={v as string} />
                    ))}
                  </datalist>
                </div>
                <div className="flex-1 min-w-[100px] flex items-end">
                  <Button onClick={handleAddEntry} className="w-full">
                    {isEditing ? (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Entry
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Entry
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

          {/* Table Section */}
          {store.tempPurchaseEntries.length > 0 && (
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
                          <TableHead>Oil</TableHead>
                          {/* <TableHead>Invoice Amount</TableHead> */}
                          <TableHead>Vendor</TableHead>
                          {/* <TableHead>Remarks</TableHead> */}
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {store.tempPurchaseEntries.map((entry) => (
                          <TableRow key={entry.SheetID}>
                            <TableCell>{entry.Date}</TableCell>
                            <TableCell>{entry.PurchasedStock}</TableCell>
                            {/* <TableCell>{entry.InvoiceAmount}</TableCell> */}
                            <TableCell>{entry.Vendor}</TableCell>
                            {/* <TableCell className="truncate max-w-[200px]">{entry.Remarks}</TableCell> */}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditEntry(entry)}>
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.SheetID)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
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
          <span className="text-sm text-muted-foreground">
            {store.tempPurchaseEntries.length} {store.tempPurchaseEntries.length === 1 ? "entry" : "entries"} ready to
            submit
          </span>
          <Button onClick={handleSubmitAll} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit All Entries"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

export default PurchaseEntryDialog

"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { observer } from "mobx-react-lite"
import { useStore } from "@/store/StoreProvider"
import EditOilEntryDialog from "@/components/edit-oil-entry-dialog"
import DeleteOilEntryDialog from "@/components/delete-oil-entry-dialog"

interface OilDataTableProps {
  data: any[]
}

const OilDataTable = observer(({ data }: OilDataTableProps) => {
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [deletingEntry, setDeletingEntry] = useState<any>(null)
  const store = useStore()

  // Update the canEdit function to check user permissions properly
  const canEdit = (entry: any) => {
    return (
      store.currentUser?.userType === "SuperAdmin" ||
      store.currentUser?.userType === "Admin" ||
      (store.currentUser?.userType === "User" && entry.EnteredBy === store.currentUser?.fullName)
    )
  }

  const getEntryTypeBadge = (entryType: string) => {
    switch (entryType) {
      case "Sales":
        return <Badge variant="destructive">Sales</Badge>
      case "Purchase":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
            Purchase
          </Badge>
        )
      default:
        return <Badge variant="outline">{entryType}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "Approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Approved
          </Badge>
        )
      case "Rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="sticky rounded-md border">
      <div className="overflow-auto max-h-[calc(100vh-150px)]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle/Vendor</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  No entries found
                </TableCell>
              </TableRow>
            ) : (
              data.map((entry) => (
                <TableRow key={entry?.sheetID || entry?.id}>
                  <TableCell>{getEntryTypeBadge(entry.entryType)}</TableCell>
                  <TableCell>{formatDate(entry.date)}</TableCell>
                  <TableCell>{entry.entryType === "Sales" ? entry.vehicleNo : entry.vendor}</TableCell>
                  <TableCell>
                    {entry.entryType === "Sales" ? `${entry.oilinLiters} L` : `${entry.purchasedStock} L`}
                  </TableCell>
                  <TableCell>{getStatusBadge(entry.status || "Pending")}</TableCell>
                  <TableCell className="text-right">
                    {canEdit(entry) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingEntry(entry)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button variant="ghost" size="icon" disabled>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions not available</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingEntry && (
        <EditOilEntryDialog
          entry={editingEntry}
          open={!!editingEntry}
          onOpenChange={(open) => !open && setEditingEntry(null)}
        />
      )}

      {deletingEntry && (
        <DeleteOilEntryDialog
          entry={deletingEntry}
          open={!!deletingEntry}
          onOpenChange={(open) => !open && setDeletingEntry(null)}
        />
      )}
    </div>
  )
})

// Make sure to export as default
export default OilDataTable

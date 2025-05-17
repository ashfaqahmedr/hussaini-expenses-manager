"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { observer } from "mobx-react-lite"
import { useStore } from "@/store/StoreProvider"
import { toast } from "@/components/ui/use-toast"

interface DeleteOilEntryDialogProps {
  entry: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DeleteOilEntryDialog = observer(({ entry, open, onOpenChange }: DeleteOilEntryDialogProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const store = useStore()

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const success = await store.deleteOilEntry(entry)
      if (success) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete {entry?.EntryType} Entry</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this {entry?.EntryType?.toLowerCase()} entry? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Entry"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

export default DeleteOilEntryDialog

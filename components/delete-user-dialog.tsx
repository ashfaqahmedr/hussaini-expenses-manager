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
import { useStore } from "@/store/StoreProvider"

interface DeleteUserDialogProps {
  user: any
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: any
}

const DeleteUserDialog = ({ user, open, onOpenChange, currentUser }: DeleteUserDialogProps) => {
  const store = useStore()
  const { users } = store
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)

    const success = await store.deleteUser(user)

    if (success) {
      // Optionally, you can show a success message or perform any other action

      // Remove user from store
      const index = users.findIndex((u) => u.SheetID === user.SheetID)
      if (index !== -1) {
        users.splice(index, 1)
      }
    }

    onOpenChange(false)

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the user "{user.FullName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={() => handleDelete()} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteUserDialog

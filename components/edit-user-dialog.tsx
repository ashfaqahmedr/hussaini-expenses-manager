"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

import { useStore } from "@/store/StoreProvider"

interface EditUserDialogProps {
  user: any
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: any
}

const EditUserDialog = ({ user, open, onOpenChange, currentUser }: EditUserDialogProps) => {
  const store = useStore()
  const { users } = store
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Form state
  const [fullName, setFullName] = useState(user.FullName || "")
  const [username, setUsername] = useState(user.userName || "")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState(user.UserType || "User")
  const [timeout, setTimeout] = useState(user.TimeOutMinute || "60")
  const [status, setStatus] = useState(user.Status || "Active")

  useEffect(() => {
    if (user) {
      setFullName(user.FullName || "")
      setUsername(user.userName || "")
      setPassword("")
      setUserType(user.UserType || "User")
      setTimeout(user.TimeOutMinute || "60")
      setStatus(user.Status || "Active")
    }
  }, [user])

  // Update the handleSubmit function to use the correct API call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName || !username) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const success = await store.updateUser({
      SheetID: user.SheetID,
      FullName: fullName.trim(),
      userName: username.trim(),
      Password: password || undefined, // Only update if provided
      UserType: userType,
      TimeOutMinute: timeout,
      Status: status,
    })

    // Real-time update in the store
    if (success) {
      const index = users.findIndex((u) => u.SheetID === user.SheetID)
      if (index !== -1) {
        users[index] = {
          ...users[index],
          FullName: fullName.trim(),
          userName: username.trim(),
          UserType: userType,
          TimeOutMinute: timeout,
          Status: status,
          ...(password ? { Password: password } : {}),
        }
      }
    }
    onOpenChange(false)

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password (leave blank to keep current)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter only to change password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userType">User Type</Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                {store.userTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeout">Timeout (minutes)</Label>
            <Input
              id="timeout"
              type="number"
              value={timeout}
              onChange={(e) => setTimeout(e.target.value)}
              min="1"
              max="1440"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {store.userStatuses.map((status) => (
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
                "Update User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditUserDialog

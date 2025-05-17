"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import EditUserDialog from "@/components/edit-user-dialog"
import DeleteUserDialog from "@/components/delete-user-dialog"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UserDataTableProps {
  data: any[]
  currentUser: any
}

const UserDataTable = ({ data, currentUser }: UserDataTableProps) => {
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deletingUser, setDeletingUser] = useState<any>(null)

  // Update the canManageUsers check to include Admin role
  const canManageUsers = currentUser?.userType === "SuperAdmin"

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case "SuperAdmin":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Super Admin</Badge>
      case "Admin":
        return <Badge variant="secondary">Admin</Badge>
      default:
        return <Badge variant="outline">User</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    return status === "Active" ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        Disabled
      </Badge>
    )
  }

  // Improve mobile responsiveness in the user data table
  return (
    <div className="rounded-md border">
      <div className="overflow-auto max-h-[calc(100vh-150px)]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead className="hidden md:table-cell">Username</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead className="hidden md:table-cell">Timeout (min)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              data.map((user) => (
                <TableRow key={user.SheetID}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell className="hidden md:table-cell">{user.userName}</TableCell>
                  <TableCell>{getUserTypeBadge(user.UserType)}</TableCell>
                  <TableCell className="hidden md:table-cell">{user.timeOutMinute}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-right">
                    {canManageUsers ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingUser(user)}>
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

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          currentUser={currentUser}
        />
      )}

      {deletingUser && (
        <DeleteUserDialog
          user={deletingUser}
          open={!!deletingUser}
          onOpenChange={(open) => !open && setDeletingUser(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}

export default UserDataTable

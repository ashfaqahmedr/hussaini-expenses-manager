"use client"

import { Button } from "@/components/ui/button"
import { UserPlus, Plus, ShoppingCart } from "lucide-react"
import { observer } from "mobx-react-lite"
import { useStore } from "@/store/StoreProvider"
import { Input } from "./ui/input"

interface DashboardHeaderProps {
  title: string
  description: string
  onAddUserClick: () => void
  onAddSaleClick: () => void
  onAddPurchaseClick: () => void
}

const DashboardHeader = observer(
  ({ title, description, onAddUserClick, onAddSaleClick, onAddPurchaseClick }: DashboardHeaderProps) => {
    const store = useStore()
    const isSuperAdmin = store.currentUser?.userType === "SuperAdmin"

    return (
      <div className="sticky flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4 top-0 bg-background z-30 py-4 border-b mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Input
          type="text"
          placeholder="Search entries..."
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
          className="w-full md:w-1/4"
        />
        <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
          <div className="sticky top-[65px] z-20 bg-background p-4"></div>
          <Button
            className="flex-1 md:flex-none"
            onClick={onAddSaleClick}
            // onClick={() => {
            //   // store.setActiveTab("sales")
            //   onClick={onAddSaleClick}
            // }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Sale
          </Button>
          <Button
            className="flex-1 md:flex-none"
            variant="outline"
            onClick={onAddPurchaseClick}
            // onClick={() => router.push("/dashboard/purchases")}
            // onClick={() => {
            //   // store.setActiveTab("purchases")
            //   onClick={onAddUserClick}
            // }}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Purchase
          </Button>
          {isSuperAdmin && (
            <Button className="flex-1 md:flex-none" variant="secondary" onClick={onAddUserClick}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
        </div>
      </div>
    )
  },
)

// Make sure to export as default
export default DashboardHeader

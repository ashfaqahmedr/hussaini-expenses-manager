import { makeAutoObservable, runInAction } from "mobx"
import { toast as showToast } from "@/components/ui/use-toast"
import { getSession } from "next-auth/react"

// Define types for our data
export interface OilEntry {
  id: string
  entryType: "Sales" | "Purchase"
  date: string
  vehicleNo?: string
  oilLiters?: string
  purchasedStock?: string
  invoiceAmount?: string
  vendor?: string
  remarks?: string
  createdOn: string
  enteredBy: string
  editedOn?: string
  editedBy?: string
  status: "Pending" | "Updated" | "Rejected"
}

interface SaleInput {
  date: string
  vehicleNo: string
  oilLiters: string
  remarks?: string
}

interface PurchaseInput {
  date: string
  purchasedStock: string
  invoiceAmount: string
  vendor: string
  remarks?: string
}

export interface User {
  id: string
  fullName: string
  userName: string
  userType: "User" | "Admin" | "SuperAdmin"
  timeOutMinute: number
  status: "Active" | "Disabled"
}

export interface Report {
  id: string
  srNo: string
  vehicleNo: string
  lastDateOfOilChange: string
  tripAfterOilChange: string
}

export interface Vehicle {
  vehicleNo: string
  oilInLiters: string
  contractor: string
}

export interface TempEntry {
  id: string
  entryType: "Sales" | "Purchase"
  date: string
  vehicleNo?: string
  oilLiters?: string
  purchasedStock?: string
  invoiceAmount?: string
  vendor?: string
  remarks?: string
}

class AppStore {
  // Data
  oilEntries: OilEntry[] = []
  users: User[] = []
  reports: Report[] = []
  vehicles: Vehicle[] = []
  vendors: string[] = []
  entryStatus: string[] = ["Pending", "Updated", "Rejected"]
  userTypes: string[] = ["User", "Admin", "SuperAdmin"]
  userStatuses: string[] = ["Active", "Disabled"]
  searchQuery = ""

  // Temporary entries for bulk submission
  tempSaleEntries: TempEntry[] = []
  tempPurchaseEntries: TempEntry[] = []

  // UI state
  isLoading = false
  isNavigating = false
  currentUser: any = null
  dataInitialized = false
  activeTab = "all" // default tab

  constructor() {
    makeAutoObservable(this)
  }

  async fetchCurrentUser() {
    const session = await getSession()
    if (session?.user) {
      this.setCurrentUser(session.user)
    }
  }

  setCurrentUser(user: any) {
    runInAction(() => {
      this.currentUser = user
    })
  }

  updateFromDashboardData(data: any) {
    runInAction(() => {
      if (Array.isArray(data?.oilEntries)) {
        const sortedData = data.oilEntries.sort((a: any, b: any) => {
          const dateA = new Date(a.date).getTime() || 0
          const dateB = new Date(b.date).getTime() || 0
          return dateB - dateA
        })
        this.oilEntries = sortedData
      }

      if (Array.isArray(data?.vehicles)) {
        this.vehicles = data.vehicles
      }

      if (Array.isArray(data?.reports)) {
        this.reports = data.reports
      }

      if (this.currentUser?.userType === "SuperAdmin" && Array.isArray(data?.users)) {
        this.users = data.users
      }

      if (Array.isArray(data?.vendors)) {
        this.vendors = data.vendors
      }

      this.dataInitialized = true
      this.isLoading = false
      this.isNavigating = false
    })
  }

  setSearchQuery = (query: string) => {
    this.searchQuery = query
  }

  setActiveTab(tab: string) {
    this.activeTab = tab
  }

  setNavigating(value: boolean) {
    this.isNavigating = value
  }

  setLoading(loading: boolean) {
    this.isLoading = loading
  }

  toast(props: any) {
    showToast(props)
  }

  // Get today's date in YYYY-MM-DD format
  private getToday(): string {
    return new Date().toISOString().split("T")[0]
  }

  // Add a vehicle to the local store
  addVehicle(vehicle: Vehicle) {
    const exists = this.vehicles.some((v) => v.vehicleNo === vehicle.vehicleNo)
    if (!exists) {
      runInAction(() => {
        this.vehicles = [...this.vehicles, vehicle]
      })
    }
  }

  // Temporary entries management
  addTempSaleEntry(entry: TempEntry) {
    runInAction(() => {
      this.tempSaleEntries.push(entry)
    })
    return entry
  }

  removeTempSaleEntry(id: string) {
    runInAction(() => {
      this.tempSaleEntries = this.tempSaleEntries.filter((entry) => entry.id !== id)
    })
  }

  updateTempSaleEntry(id: string, updatedEntry: Partial<TempEntry>) {
    runInAction(() => {
      this.tempSaleEntries = this.tempSaleEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updatedEntry } : entry
      )
    })
  }

  addTempPurchaseEntry(entry: TempEntry) {
    runInAction(() => {
      this.tempPurchaseEntries.push(entry)
    })
    return entry
  }

  removeTempPurchaseEntry(id: string) {
    runInAction(() => {
      this.tempPurchaseEntries = this.tempPurchaseEntries.filter((entry) => entry.id !== id)
    })
  }

  updateTempPurchaseEntry(id: string, updatedEntry: Partial<TempEntry>) {
    runInAction(() => {
      this.tempPurchaseEntries = this.tempPurchaseEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updatedEntry } : entry
      )
    })
  }

  // Data fetching
  async fetchAllData() {
    runInAction(() => {
      this.isLoading = true
      this.isNavigating = true
    })

    try {
      const res = await fetch("/api/dashboard")
      if (!res.ok) {
        throw new Error("Network response was not ok")
      }

      const result = await res.json()
      if (!result.success || typeof result.data !== "object" || result.data === null) {
        throw new Error("Invalid response format from server.")
      }

      this.updateFromDashboardData(result.data)

      this.toast({
        title: "Data Loaded",
        description: "All application data has been fetched successfully",
        variant: "success",
      })
    } catch (error) {
      console.error("Dashboard data fetch error:", error)
      this.toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      runInAction(() => {
        this.isLoading = false
        this.isNavigating = false
      })
    }
  }

  logout() {
    runInAction(() => {
      this.currentUser = null
    })

    this.toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    })
  }
}

// Create a singleton instance
const store = new AppStore()
export default store
import { makeAutoObservable, runInAction } from "mobx"
import { toast } from "@/components/ui/use-toast"

// Types
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

export interface User {
  id: string
  fullName: string
  userName: string
  userType: "User" | "Admin" | "SuperAdmin"
  timeOutMinute: number
  status: "Active" | "Disabled"
}

export interface Vehicle {
  vehicleNo: string
  oilInLiters: string
  contractor: string
}

export interface Report {
  id: string
  srNo: string
  vehicleNo: string
  lastDateOfOilChange: string
  tripAfterOilChange: string
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

class UnifiedStore {
  // State
  oilEntries: OilEntry[] = []
  users: User[] = []
  vehicles: Vehicle[] = []
  reports: Report[] = []
  vendors: string[] = []
  
  // UI State
  isLoading = false
  currentUser: User | null = null
  searchQuery = ""
  activeTab = "all"
  
  // Constants
  readonly userTypes = ["User", "Admin", "SuperAdmin"]
  readonly userStatuses = ["Active", "Disabled"]
  readonly entryStatuses = ["Pending", "Updated", "Rejected"]
  
  // Temp entries for bulk operations
  tempSaleEntries: TempEntry[] = []
  tempPurchaseEntries: TempEntry[] = []

  constructor() {
    makeAutoObservable(this)
  }

  // Actions
  setCurrentUser(user: User | null) {
    runInAction(() => {
      this.currentUser = user
      if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user))
      } else {
        localStorage.removeItem("currentUser")
      }
    })
  }

  setLoading(loading: boolean) {
    this.isLoading = loading
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
  }

  setActiveTab(tab: string) {
    this.activeTab = tab
  }

  // Oil Entry Actions
  addOilEntry(entry: OilEntry) {
    runInAction(() => {
      this.oilEntries.unshift(entry)
    })
  }

  updateOilEntry(id: string, updates: Partial<OilEntry>) {
    runInAction(() => {
      const index = this.oilEntries.findIndex(entry => entry.id === id)
      if (index !== -1) {
        this.oilEntries[index] = { ...this.oilEntries[index], ...updates }
      }
    })
  }

  deleteOilEntry(id: string) {
    runInAction(() => {
      this.oilEntries = this.oilEntries.filter(entry => entry.id !== id)
    })
  }

  // Temp Entry Actions
  addTempSaleEntry(entry: TempEntry) {
    runInAction(() => {
      this.tempSaleEntries.push(entry)
    })
  }

  addTempPurchaseEntry(entry: TempEntry) {
    runInAction(() => {
      this.tempPurchaseEntries.push(entry)
    })
  }

  clearTempEntries() {
    runInAction(() => {
      this.tempSaleEntries = []
      this.tempPurchaseEntries = []
    })
  }

  // User Actions
  addUser(user: User) {
    runInAction(() => {
      this.users.push(user)
    })
  }

  updateUser(id: string, updates: Partial<User>) {
    runInAction(() => {
      const index = this.users.findIndex(user => user.id === id)
      if (index !== -1) {
        this.users[index] = { ...this.users[index], ...updates }
      }
    })
  }

  deleteUser(id: string) {
    runInAction(() => {
      this.users = this.users.filter(user => user.id !== id)
    })
  }

  // Vehicle Actions
  addVehicle(vehicle: Vehicle) {
    runInAction(() => {
      this.vehicles.push(vehicle)
    })
  }

  updateVehicle(vehicleNo: string, updates: Partial<Vehicle>) {
    runInAction(() => {
      const index = this.vehicles.findIndex(v => v.vehicleNo === vehicleNo)
      if (index !== -1) {
        this.vehicles[index] = { ...this.vehicles[index], ...updates }
      }
    })
  }

  deleteVehicle(vehicleNo: string) {
    runInAction(() => {
      this.vehicles = this.vehicles.filter(v => v.vehicleNo !== vehicleNo)
    })
  }

  // Helper Methods
  showToast(props: any) {
    toast(props)
  }

  // Data Loading
  async loadInitialData() {
    this.setLoading(true)
    try {
      const savedUser = localStorage.getItem("currentUser")
      if (savedUser) {
        this.setCurrentUser(JSON.parse(savedUser))
      }
      
      // Load data using server actions (implemented separately)
      await this.fetchAllData()
      
    } catch (error) {
      console.error("Error loading initial data:", error)
      this.showToast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive"
      })
    } finally {
      this.setLoading(false)
    }
  }

  async fetchAllData() {
    // This will be implemented with server actions
  }
}

// Create singleton instance
const store = new UnifiedStore()
export default store
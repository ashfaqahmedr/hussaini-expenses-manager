import { makeAutoObservable, runInAction } from "mobx"
import { toast as showToast } from "@/components/ui/use-toast"
import prisma from "@/lib/prisma"

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

export interface Settings {
  key: string
  value: string
}

class DatabaseStore {
  
  // Data
  oilEntries: OilEntry[] = []
  users: User[] = []
  reports: Report[] = []
  vehicles: Vehicle[] = []
  vendors: string[] = []
  settings: Settings[] = []
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
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  // Add method to set current user
  setCurrentUser(user: any) {
    runInAction(() => {
      this.currentUser = user
      localStorage.setItem("currentUser", JSON.stringify(user))
    })
  }

    setLoading(loading: boolean): void {
    this.isLoading = loading
  }
  
  // Add method to update store from dashboard data
  updateFromDashboardData(data: any) {
    runInAction(() => {
      if (Array.isArray(data?.OilData)) {
        // Sort data by Date in descending order
        const sortedData = data.OilData.sort((a: any, b: any) => {
          const dateA = new Date(a.date).getTime() || 0
          const dateB = new Date(b.date).getTime() || 0
          return dateB - dateA // Descending order
        })
        this.oilEntries = sortedData
      }

      if (Array.isArray(data?.VehicleData)) {
        this.vehicles = data.VehicleData
      }

      if (Array.isArray(data?.Reports)) {
        this.reports = data.Reports
      }

      // Only assign users if currentUser is SuperAdmin
      if (this.currentUser?.userType === "SuperAdmin" && Array.isArray(data?.UsersInfo)) {
        this.users = data.UsersInfo
      }

      // Extract unique vendors
      if (Array.isArray(data?.Vendors)) {
        this.vendors = data.Vendors
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

  toast(props: any) {
    showToast(props)
  }

  // Get today's date in YYYY-MM-DD format
  private getToday(): string {
    return new Date().toISOString().split("T")[0]
  }

  // User operations
  async getUsers() {
    this.isLoading = true
    this.error = null

    try {
      const users = await prisma.user.findMany()
      runInAction(() => {
        this.isLoading = false
      })
      return users
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error =
          typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error)
      })
      return []
    }
  }

  async createUser(userData: any) {
    this.isLoading = true
    this.error = null

    try {
      const user = await prisma.user.create({
        data: userData,
      })
      runInAction(() => {
        this.isLoading = false
      })
      return user
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error =
          typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error)
      })
      return null
    }
  }

  // Oil entry operations
  async getOilEntries() {
    this.isLoading = true
    this.error = null

    try {
      const entries = await prisma.oilEntry.findMany({
        orderBy: { date: "desc" },
      })
      runInAction(() => {
        this.isLoading = false
      })
      return entries
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error =
          typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error)
      })
      return []
    }
  }

  async createOilEntry(entryData: any) {
    this.isLoading = true
    this.error = null

    try {
      const entry = await prisma.oilEntry.create({
        data: entryData,
      })
      runInAction(() => {
        this.isLoading = false
      })
      return entry
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error =
          typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error)
      })
      return null
    }
  }

  // Vehicle operations
  async getVehicles() {
    this.isLoading = true
    this.error = null

    try {
      const vehicles = await prisma.vehicle.findMany()
      runInAction(() => {
        this.isLoading = false
      })
      return vehicles
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
        this.error =
          typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error)
      })
      return []
    }
  }

  // Settings operations
  async getSetting(key: any) {
    try {
      const setting = await prisma.settings.findUnique({
        where: { key },
      })
      return setting?.value
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error)
      return null
    }
  }

  async setSetting(key: any, value: any) {
    try {
      await prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
      return true
    } catch (error) {
      console.error(`Error setting ${key}:`, error)
      return false
    }
  }

  // Oil Data Actions
  async loadOilData() {
    if (!this.currentUser) return

    this.isLoading = true
    try {
      const response = await fetch("/api/oil-entries")
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        runInAction(() => {
          this.oilEntries = result.data
        })
      } else {
        this.toast({
          title: "Error",
          description: "Failed to load oil data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Load Error:", error)
      this.toast({
        title: "Error",
        description: "Could not fetch oil data",
        variant: "destructive",
      })
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  async loadVehicleData() {
    if (!this.currentUser) return

    try {
      const response = await fetch("/api/vehicles")
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        runInAction(() => {
          this.vehicles = result.data
        })
        return result.data
      } else {
        this.toast({
          title: "Error",
          description: "Failed to load vehicle data",
          variant: "destructive",
        })
      }
      return []
    } catch (error) {
      console.error("Load Error:", error)
      this.toast({
        title: "Error",
        description: "Could not fetch vehicle data",
        variant: "destructive",
      })
      return []
    }
  }

  async loadSettings() {
    if (!this.currentUser) return

    try {
      const response = await fetch("/api/settings")
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        runInAction(() => {
          this.settings = result.data
        })
        return result.data
      } else {
        this.toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
      }
      return []
    } catch (error) {
      console.error("Load Error:", error)
      this.toast({
        title: "Error",
        description: "Could not fetch settings",
        variant: "destructive",
      })
      return []
    }
  }

  async updateSetting(key: string, value: string) {
    if (!this.currentUser) return false

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, value }),
      })

      const result = await response.json()

      if (result.success) {
        runInAction(() => {
          const index = this.settings.findIndex((s) => s.key === key)
          if (index !== -1) {
            this.settings[index] = result.data
          } else {
            this.settings.push(result.data)
          }
        })
        return true
      } else {
        throw new Error(result.error || "Failed to update setting")
      }
    } catch (error) {
      console.error("Update Setting Error:", error)
      this.toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      })
      return false
    }
  }

  // Add a vehicle to the local store
  async addVehicle(vehicle: Vehicle) {
    if (!this.currentUser) return false

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicle),
      })

      const result = await response.json()

      if (result.success) {
        runInAction(() => {
          this.vehicles.push(result.data)
        })
        return true
      } else {
        throw new Error(result.error || "Failed to add vehicle")
      }
    } catch (error) {
      console.error("Add Vehicle Error:", error)
      this.toast({
        title: "Error",
        description: "Failed to add vehicle",
        variant: "destructive",
      })
      return false
    }
  }

  // Add a temporary sale entry
  addTempSaleEntry(entry: TempEntry) {
    runInAction(() => {
      this.tempSaleEntries.push(entry)
    })
    return entry
  }

  // Remove a temporary sale entry
  removeTempSaleEntry(id: string) {
    runInAction(() => {
      this.tempSaleEntries = this.tempSaleEntries.filter((entry) => entry.id !== id)
    })
  }

  // Update a temporary sale entry
  updateTempSaleEntry(id: string, updatedEntry: Partial<TempEntry>) {
    runInAction(() => {
      this.tempSaleEntries = this.tempSaleEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updatedEntry } : entry,
      )
    })
  }

  // Add a temporary purchase entry
  addTempPurchaseEntry(entry: TempEntry) {
    runInAction(() => {
      this.tempPurchaseEntries.push(entry)
    })
    return entry
  }

  // Remove a temporary purchase entry
  removeTempPurchaseEntry(id: string) {
    runInAction(() => {
      this.tempPurchaseEntries = this.tempPurchaseEntries.filter((entry) => entry.id !== id)
    })
  }

  // Update a temporary purchase entry
  updateTempPurchaseEntry(id: string, updatedEntry: Partial<TempEntry>) {
    runInAction(() => {
      this.tempPurchaseEntries = this.tempPurchaseEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updatedEntry } : entry,
      )
    })
  }

  // Submit all temporary sale entries in bulk
  async submitSaleEntriesBulk() {
    if (!this.currentUser || this.tempSaleEntries.length === 0) return false

    this.isLoading = true
    try {
      const promises = this.tempSaleEntries.map((entry) =>
        fetch("/api/oil-entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entryType: "Sales",
            date: entry.date,
            vehicleNo: entry.vehicleNo,
            oilLiters: entry.oilLiters,
            remarks: entry.remarks,
          }),
        }).then((res) => res.json()),
      )

      const results = await Promise.all(promises)

      if (results.every((result) => result.success)) {
        // Create new entries with the data we have
        const newEntries: OilEntry[] = results.map((result, index) => ({
          id: result.data.id,
          entryType: "Sales",
          date: this.tempSaleEntries[index].date,
          vehicleNo: this.tempSaleEntries[index].vehicleNo,
          oilLiters: this.tempSaleEntries[index].oilLiters,
          remarks: this.tempSaleEntries[index].remarks,
          createdOn: this.getToday(),
          enteredBy: this.currentUser.name,
          status: "Pending",
        }))

        // Update local state
        runInAction(() => {
          this.oilEntries = [...newEntries, ...this.oilEntries]
          this.tempSaleEntries = [] // Clear temp entries after successful submission
        })

        this.toast({
          title: "Success",
          description: `${newEntries.length} sale entries submitted successfully`,
          variant: "success",
        })
        return true
      } else {
        throw new Error("Some entries failed to submit")
      }
    } catch (err: any) {
      console.error("Submit Error:", err)
      this.toast({
        title: "Error",
        description: err.message || "Failed to submit sale entries",
        variant: "destructive",
      })
      return false
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  // Submit all temporary purchase entries in bulk
  async submitPurchaseEntriesBulk() {
    if (!this.currentUser || this.tempPurchaseEntries.length === 0) return false

    this.isLoading = true
    try {
      const promises = this.tempPurchaseEntries.map((entry) =>
        fetch("/api/oil-entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entryType: "Purchase",
            date: entry.date,
            purchasedStock: entry.purchasedStock,
            invoiceAmount: entry.invoiceAmount,
            vendor: entry.vendor,
            remarks: entry.remarks,
          }),
        }).then((res) => res.json()),
      )

      const results = await Promise.all(promises)

      if (results.every((result) => result.success)) {
        // Create new entries with the data we have
        const newEntries: OilEntry[] = results.map((result, index) => ({
          id: result.data.id,
          entryType: "Purchase",
          date: this.tempPurchaseEntries[index].date,
          purchasedStock: this.tempPurchaseEntries[index].purchasedStock,
          invoiceAmount: this.tempPurchaseEntries[index].invoiceAmount,
          vendor: this.tempPurchaseEntries[index].vendor,
          remarks: this.tempPurchaseEntries[index].remarks,
          createdOn: this.getToday(),
          enteredBy: this.currentUser.name,
          status: "Pending",
        }))

        // Update local state
        runInAction(() => {
          this.oilEntries = [...newEntries, ...this.oilEntries]
          this.tempPurchaseEntries = [] // Clear temp entries after successful submission
        })

        this.toast({
          title: "Success",
          description: `${newEntries.length} purchase entries submitted successfully`,
          variant: "success",
        })
        return true
      } else {
        throw new Error("Some entries failed to submit")
      }
    } catch (err: any) {
      console.error("Submit Error:", err)
      this.toast({
        title: "Error",
        description: err.message || "Failed to submit purchase entries",
        variant: "destructive",
      })
      return false
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  async addSaleEntry(saleData: SaleInput) {
    if (!this.currentUser) return false

    try {
      const response = await fetch("/api/oil-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryType: "Sales",
          date: saleData.date,
          vehicleNo: saleData.vehicleNo,
          oilLiters: saleData.oilLiters,
          remarks: saleData.remarks,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Create a new entry with the data we have
        const newEntry: OilEntry = {
          id: result.data.id,
          entryType: "Sales",
          date: saleData.date,
          vehicleNo: saleData.vehicleNo,
          oilLiters: saleData.oilLiters,
          remarks: saleData.remarks,
          createdOn: this.getToday(),
          enteredBy: this.currentUser.name,
          status: "Pending",
        }

        // Update local state
        runInAction(() => {
          this.oilEntries = [newEntry, ...this.oilEntries]
        })

        this.toast({
          title: "Success",
          description: "Sale entry submitted successfully",
          variant: "success",
        })
        return true
      } else {
        throw new Error(result.error || "Submission failed")
      }
    } catch (err: any) {
      console.error("Submit Error:", err)
      this.toast({
        title: "Error",
        description: err.message || "Failed to submit sale entry",
        variant: "destructive",
      })
      return false
    }
  }

  async addPurchaseEntry(purchaseData: PurchaseInput) {
    if (!this.currentUser) return false

    try {
      const response = await fetch("/api/oil-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryType: "Purchase",
          date: purchaseData.date,
          purchasedStock: purchaseData.purchasedStock,
          invoiceAmount: purchaseData.invoiceAmount,
          vendor: purchaseData.vendor,
          remarks: purchaseData.remarks,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Create a new entry with the data we have
        const newEntry: OilEntry = {
          id: result.data.id,
          entryType: "Purchase",
          date: purchaseData.date,
          purchasedStock: purchaseData.purchasedStock,
          invoiceAmount: purchaseData.invoiceAmount,
          vendor: purchaseData.vendor,
          remarks: purchaseData.remarks,
          createdOn: this.getToday(),
          enteredBy: this.currentUser.name,
          status: "Pending",
        }

        // Update local state
        runInAction(() => {
          this.oilEntries = [newEntry, ...this.oilEntries]
        })

        this.toast({
          title: "Success",
          description: "Purchase entry submitted successfully",
          variant: "success",
        })
        return true
      } else {
        throw new Error(result.error || "Submission failed")
      }
    } catch (err: any) {
      console.error("Submit Error:", err)
      this.toast({
        title: "Error",
        description: err.message || "Failed to submit purchase entry",
        variant: "destructive",
      })
      return false
    }
  }

  async updateOilEntry(entry: any) {
    if (!this.currentUser) return false

    try {
      const response = await fetch(`/api/oil-entries/${entry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryType: entry.entryType,
          date: entry.date,
          vehicleNo: entry.entryType === "Sales" ? entry.vehicleNo : undefined,
          oilLiters: entry.entryType === "Sales" ? entry.oilLiters : undefined,
          purchasedStock: entry.entryType === "Purchase" ? entry.purchasedStock : undefined,
          invoiceAmount: entry.entryType === "Purchase" ? entry.invoiceAmount : undefined,
          vendor: entry.entryType === "Purchase" ? entry.vendor : undefined,
          remarks: entry.remarks,
          status: entry.status,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        runInAction(() => {
          const index = this.oilEntries.findIndex((item) => item.id === entry.id)
          if (index !== -1) {
            this.oilEntries[index] = {
              ...this.oilEntries[index],
              ...entry,
              editedOn: this.getToday(),
              editedBy: this.currentUser.name,
            }
          }
        })

        this.toast({
          title: "Success",
          description: `${entry.entryType} entry updated successfully`,
          variant: "success",
        })
        return true
      } else {
        throw new Error(result.error || "Update failed")
      }
    } catch (err: any) {
      console.error("Update Error:", err)
      this.toast({
        title: "Error",
        description: err.message || `Failed to update ${entry.entryType.toLowerCase()} entry`,
        variant: "destructive",
      })
      return false
    }
  }

  async deleteOilEntry(entry: any) {
    if (!this.currentUser) return false

    try {
      const response = await fetch(`/api/oil-entries/${entry.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        runInAction(() => {
          this.oilEntries = this.oilEntries.filter((item) => item.id !== entry.id)
        })

        this.toast({
          title: "Success",
          description: "Entry deleted successfully",
        })
        return true
      } else {
        throw new Error(result.error || "Failed to delete entry")
      }
    } catch (err: any) {
      console.error("Delete Entry Error:", err)
      this.toast({
        title: "Error",
        description: err.message || "Failed to delete entry",
        variant: "destructive",
      })
      return false
    }
  }

  // User Data Actions
  async loadUserData() {
    if (!this.currentUser) return

    this.isLoading = true
    try {
      const response = await fetch("/api/users")
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        runInAction(() => {
          this.users = result.data
        })
      } else {
        this.toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Load Error:", error)
      this.toast({
        title: "Error",
        description: "Could not fetch user data",
        variant: "destructive",
      })
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  async addUser(userData: any) {
    if (!this.currentUser) return false

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: userData.fullName.trim(),
          username: userData.username.trim(),
          password: userData.password,
          userType: userData.userType,
          timeout: userData.timeout,
          status: userData.status,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Create a new user with the data we have
        const newUser: User = {
          id: result.data.id,
          fullName: userData.fullName.trim(),
          userName: userData.username.trim(),
          userType: userData.userType,
          timeOutMinute: Number.parseInt(userData.timeout),
          status: userData.status,
        }

        // Update local state
        runInAction(() => {
          this.users = [...this.users, newUser]
        })

        this.toast({
          title: "Success",
          description: "User created successfully",
          variant: "success",
        })
        return true
      } else {
        throw new Error(result.error || "Failed to create user")
      }
    } catch (err: any) {
      console.error("Add User Error:", err)
      this.toast({
        title: "Error",
        description: err.message || "Failed to create user",
        variant: "destructive",
      })
      return false
    }
  }

  async updateUser(user: any) {
    if (!this.currentUser) return false

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: user.fullName.trim(),
          userName: user.userName.trim(),
          password: user.password || undefined, // Only update if provided
          userType: user.userType,
          timeOutMinute: user.timeOutMinute,
          status: user.status,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        runInAction(() => {
          const index = this.users.findIndex((item) => item.id === user.id)
          if (index !== -1) {
            this.users[index] = {
              ...this.users[index],
              ...user,
            }
          }
        })

        this.toast({
          title: "Success",
          description: "User updated successfully",
        })
        return true
      } else {
        throw new Error(result.error || "Failed to update user")
      }
    } catch (err: any) {
      console.error("Edit User Error:", err)
      this.toast({
        title: "Error",
        description: err.message || "Failed to update user",
        variant: "destructive",
      })
      return false
    }
  }

  async deleteUser(user: any) {
    if (!this.currentUser) return false

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        runInAction(() => {
          this.users = this.users.filter((item) => item.id !== user.id)
        })

        this.toast({
          title: "Success",
          description: "User deleted successfully",
        })
        return true
      } else {
        throw new Error(result.error || "Failed to delete user")
      }
    } catch (err: any) {
      console.error("Delete User Error:", err)
      this.toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "destructive",
      })
      return false
    }
  }

  // Reports Data Actions
  async loadReportsData() {
    if (!this.currentUser) return

    this.isLoading = true
    try {
      const response = await fetch("/api/reports")
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        runInAction(() => {
          this.reports = result.data
        })
      } else {
        this.toast({
          title: "Error",
          description: "Failed to load reports data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Load Error:", error)
      this.toast({
        title: "Error",
        description: "Could not fetch reports data",
        variant: "destructive",
      })
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  // Authentication
  async login(username: string, password: string) {
    this.isLoading = true
    try {
      const response = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          redirect: false,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const user = {
          username: username,
          fullName: data.fullName,
          userType: data.userType,
          token: data.token,
          timeoutInMinutes: data.timeoutInMinutes,
          userStatus: data.userStatus,
        }

        runInAction(() => {
          this.currentUser = user
          localStorage.setItem("currentUser", JSON.stringify(user))
        })

        this.toast({
          title: "Login Successful",
          type: "success",
          variant: "default",
          icon: "check",
          description: `Welcome, ${data.fullName}!`,
        })
        return true
      } else {
        this.toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Login Error:", error)
      this.toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
      return false
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  logout() {
    runInAction(() => {
      this.currentUser = null
      localStorage.removeItem("currentUser")
    })

    this.toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    })
  }

  // Fetch all data in background
  async fetchAllData() {
    runInAction(() => {
      this.isLoading = true
      this.isNavigating = true
    })

    try {
      const response = await fetch("/api/dashboard")
      const result = await response.json()

      if (!result.success) {
        throw new Error("Failed to fetch dashboard data")
      }

      const data = result.data

      runInAction(() => {
        if (Array.isArray(data?.OilData)) {
          // Sort data by Date in descending order
          const sortedData = data.OilData.sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime() || 0
            const dateB = new Date(b.date).getTime() || 0
            return dateB - dateA // Descending order
          })
          this.oilEntries = sortedData
        }

        if (Array.isArray(data?.VehicleData)) {
          this.vehicles = data.VehicleData
        }

        if (Array.isArray(data?.Reports)) {
          this.reports = data.Reports
        }

        // Only assign users if currentUser is SuperAdmin
        if (this.currentUser?.userType === "SuperAdmin" && Array.isArray(data?.UsersInfo)) {
          this.users = data.UsersInfo
        }

        // Extract unique vendors
        if (Array.isArray(data?.Vendors)) {
          this.vendors = data.Vendors
        }

        this.dataInitialized = true
        this.isLoading = false
        this.isNavigating = false
      })

      this.toast({
        title: "Data Loaded",
        description: "All application data has been fetched successfully",
        variant: "success",
      })
    } catch (error) {
      console.error("Dashboard data fetch error:", error)
      runInAction(() => {
        this.isLoading = false
        this.isNavigating = false
      })
      this.toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    }
  }
}

// Create a singleton instance
const databaseStore = new DatabaseStore()
export default databaseStore

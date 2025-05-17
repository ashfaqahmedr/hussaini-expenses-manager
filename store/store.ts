import { makeAutoObservable, runInAction } from "mobx"
import { toast as showToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"
import { envConfig } from "@/lib/env-config"
import { getSession } from "next-auth/react"

// Define types for our data
export interface OilEntry {
  SheetID: string
  Timestamp: string
  EntryType: "Sales" | "Purchase"
  Date: string
  VehicleNo?: string
  OilinLiters?: string
  PurchasedStock?: string
  InvoiceAmount?: string
  Vendor?: string
  Remarks?: string
  CreatedOn: string
  EnteredBy: string
  EditedOn?: string
  EditedBy?: string
  Status: "Pending" | "Updated" | "Rejected"
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
  SheetID: string
  FullName: string
  userName: string
  UserType: "User" | "Admin" | "SuperAdmin"
  TimeOutMinute: string
  Status: "Active" | "Disabled"
}

export interface Report {
  SrNo: string
  VehicleNo: string
  LastDateofOilChange: string
  TripafterOilChange: string
}

export interface Vehicle {
  vehicleNo: string
  oilInLiters: string
  contractor: string
}

export interface TempEntry {
  SheetID: string
  EntryType: "Sales" | "Purchase"
  Date: string
  VehicleNo?: string
  OilinLiters?: string
  PurchasedStock?: string
  InvoiceAmount?: string
  Vendor?: string
  Remarks?: string
}

class AppStore {
  // Data
  GOOGLE_SCRIPT_URL = envConfig.google.publicScriptUrl

  oilEntries: OilEntry[] = []
  users: User[] = []
  reports: Report[] = []
  vehicles: Vehicle[] = []
  vendors: unknown[] = []
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

    // Check if Google Script URL is available
    if (!this.GOOGLE_SCRIPT_URL) {
      console.warn("Google Script URL is not configured. Google Sheets integration will not work.")
    }
  }

  async fetchCurrentUser () { 
   const session = await getSession()
if (session?.user) {
  this.setCurrentUser(session.user)
}
  }
  // Add method to set current user
  setCurrentUser(user: any) {
    runInAction(() => {
      this.currentUser = user
      // localStorage.setItem("currentUser", JSON.stringify(user))
    })
  }

  // Add method to update store from dashboard data
  updateFromDashboardData(data: any) {
    runInAction(() => {
      if (Array.isArray(data?.OilData)) {
        // Sort data by Date in descending order
        const sortedData = data.OilData.sort((a: any, b: any) => {
          const dateA = new Date(a.Date).getTime() || 0
          const dateB = new Date(b.Date).getTime() || 0
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

      // Extract unique vendors from OilData
      if (data?.OilData) {
        const vendorSet = new Set(
          data.OilData.map((entry: any) => entry?.Vendor?.trim()).filter(
            (vendor: string | undefined) => vendor && vendor !== "",
          ),
        )
        this.vendors = Array.from(vendorSet)
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

  // Oil Data Actions
  async loadOilData() {
    if (!this.currentUser?.token) return

    this.isLoading = true
    try {
      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "getProjects",
          token: this.currentUser.token,
          dataItems: [
            {
              columnsToReturn: [
                "SheetID",
                "Timestamp",
                "EntryType",
                "Date",
                "VehicleNo",
                "OilinLiters",
                "PurchasedStock",
                "InvoiceAmount",
                "Vendor",
                "Remarks",
                "CreatedOn",
                "EnteredBy",
                "EditedOn",
                "EditedBy",
                "Status",
              ],
            },
          ],
        }),
      })

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        // Sort data by Date in descending order
        const sortedData = result.data.sort((a: any, b: any) => {
          const dateA = new Date(a.Date).getTime() || 0
          const dateB = new Date(b.Date).getTime() || 0
          return dateB - dateA // Descending order
        })

        runInAction(() => {
          this.oilEntries = sortedData
          // localStorage.setItem("cachedOilData", JSON.stringify(sortedData))
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
    if (!this.currentUser?.token) return

    try {
      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "getJSON",
          token: this.currentUser.token,
          sheetName: "VehicleData",
          dataItems: [
            {
              columnsToReturn: ["VehicleNo", "OilInLiters", "Contractor"],
            },
          ],
        }),
      })

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        runInAction(() => {
          this.vehicles = result.data
          // localStorage.setItem("cachedVehicleData", JSON.stringify(result.data))
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

  async loadVendorData() {
    if (!this.currentUser?.username) return

    try {
      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "getJSON",
          token: this.currentUser.token,
          sheetName: "OilData",
          dataItems: [
            {
              columnsToReturn: ["Vendor"],
            },
          ],
        }),
      })

      const result = await response.json()
      if (result.success && result.uniqueData?.Vendors) {
        const vendorList = result.uniqueData.Vendors.map((v: any) => v[0]).filter((v: string) => v.trim() !== "")

        runInAction(() => {
          this.vendors = vendorList
          // localStorage.setItem("cachedVendorData", JSON.stringify(vendorList))
        })
        return vendorList
      } else {
        this.toast({
          title: "Error",
          description: "Failed to load vendor data",
          variant: "destructive",
        })
      }
      return []
    } catch (error) {
      console.error("Load Error:", error)
      this.toast({
        title: "Error",
        description: "Could not fetch vendor data",
        variant: "destructive",
      })
      return []
    }
  }

  // Get today's date in YYYY-MM-DD format
  private getToday(): string {
    return new Date().toISOString().split("T")[0]
  }

  // Add a vehicle to the local store
  addVehicle(vehicle: Vehicle) {
    // Check if vehicle already exists
    const exists = this.vehicles.some((v) => v.vehicleNo === vehicle.vehicleNo)
    if (!exists) {
      runInAction(() => {
        this.vehicles = [...this.vehicles, vehicle]
        // localStorage.setItem("cachedVehicleData", JSON.stringify(this.vehicles))
      })
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
      this.tempSaleEntries = this.tempSaleEntries.filter((entry) => entry.SheetID !== id)
    })
  }

  // Update a temporary sale entry
  updateTempSaleEntry(id: string, updatedEntry: Partial<TempEntry>) {
    runInAction(() => {
      this.tempSaleEntries = this.tempSaleEntries.map((entry) =>
        entry.SheetID === id ? { ...entry, ...updatedEntry } : entry,
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
      this.tempPurchaseEntries = this.tempPurchaseEntries.filter((entry) => entry.SheetID !== id)
    })
  }

  // Update a temporary purchase entry
  updateTempPurchaseEntry(id: string, updatedEntry: Partial<TempEntry>) {
    runInAction(() => {
      this.tempPurchaseEntries = this.tempPurchaseEntries.map((entry) =>
        entry.SheetID === id ? { ...entry, ...updatedEntry } : entry,
      )
    })
  }

  // Submit all temporary sale entries in bulk
  async submitSaleEntriesBulk() {
    if (!this.currentUser?.token || this.tempSaleEntries.length === 0) return false

    this.isLoading = true
    try {
      const dataItems = this.tempSaleEntries.map((entry) => ({
        SheetID: uuidv4(),
        EntryType: "Sales",
        Date: entry.Date,
        VehicleNo: entry.VehicleNo,
        OilinLiters: entry.OilinLiters,
        Remarks: entry.Remarks,
        CreatedOn: this.getToday(),
        EnteredBy: this.currentUser.fullName,
        Status: "Pending",
      }))

      const data = {
        action: "addProjectData",
        token: this.currentUser.token,
        sheetName: "OilData",
        dataItems,
      }

      // console.log("Submit Result:", data)

      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      // console.log("Submit Result:", result)

      if (Array.isArray(result) && result.every((r) => r.success)) {
        // Create new entries with the data we have
        const newEntries: OilEntry[] = this.tempSaleEntries.map((entry, index) => ({
          SheetID: result[index].SheetID,
          Timestamp: new Date().toISOString(),
          EntryType: "Sales",
          Date: entry.Date,
          VehicleNo: entry.VehicleNo,
          OilinLiters: entry.OilinLiters,
          Remarks: entry.Remarks,
          CreatedOn: this.getToday(),
          EnteredBy: this.currentUser.fullName,
          Status: "Pending",
        }))

        // Update local state
        runInAction(() => {
          this.oilEntries = [...newEntries, ...this.oilEntries]
          // localStorage.setItem("cachedOilData", JSON.stringify(this.oilEntries))
          this.tempSaleEntries = [] // Clear temp entries after successful submission
        })

        this.toast({
          title: "Success",
          description: `${newEntries.length} sale entries submitted successfully`,
          variant: "success",
        })
        return true
      } else {
        throw new Error(result[0]?.message || "Submission failed")
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
    if (!this.currentUser?.token || this.tempPurchaseEntries.length === 0) return false

    this.isLoading = true
    try {
      const dataItems = this.tempPurchaseEntries.map((entry) => ({
        SheetID: uuidv4(),
        EntryType: "Purchase",
        Date: entry.Date,
        PurchasedStock: entry.PurchasedStock,
        InvoiceAmount: entry.InvoiceAmount,
        Vendor: entry.Vendor,
        Remarks: entry.Remarks,
        CreatedOn: this.getToday(),
        EnteredBy: this.currentUser.fullName,
        Status: "Pending",
      }))

      const data = {
        action: "addProjectData",
        token: this.currentUser.token,
        sheetName: "OilData",
        dataItems,
      }

      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (Array.isArray(result) && result.every((r) => r.success)) {
        // Create new entries with the data we have
        const newEntries: OilEntry[] = this.tempPurchaseEntries.map((entry, index) => ({
          SheetID: result[index]?.SheetID || uuidv4(),
          Timestamp: new Date().toISOString(),
          EntryType: "Purchase",
          Date: entry.Date,
          PurchasedStock: entry.PurchasedStock,
          InvoiceAmount: entry.InvoiceAmount,
          Vendor: entry.Vendor,
          Remarks: entry.Remarks,
          CreatedOn: this.getToday(),
          EnteredBy: this.currentUser.fullName,
          Status: "Pending",
        }))

        // Update local state
        runInAction(() => {
          this.oilEntries = [...newEntries, ...this.oilEntries]
          // localStorage.setItem("cachedOilData", JSON.stringify(this.oilEntries))
          this.tempPurchaseEntries = [] // Clear temp entries after successful submission
        })

        this.toast({
          title: "Success",
          description: `${newEntries.length} purchase entries submitted successfully`,
          variant: "success",
        })
        return true
      } else {
        throw new Error(result[0]?.message || "Submission failed")
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
    if (!this.currentUser?.username) return false

    try {
      const data = {
        action: "addProjectData",
        token: this.currentUser.token,
        SheetName: "OilData",
        dataItems: [
          {
            SheetID: uuidv4(),
            EntryType: "Sales",
            Date: saleData.date,
            VehicleNo: saleData.vehicleNo,
            OilinLiters: saleData.oilLiters,
            Remarks: saleData.remarks,
            CreatedOn: this.getToday(),
            EnteredBy: this.currentUser.fullName,
            Status: "Pending",
          },
        ],
      }

      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (Array.isArray(result) && result[0]?.success) {
        // Create a new entry with the data we have
        const newEntry: OilEntry = {
          SheetID: result[0]?.SheetID || `temp-${Date.now()}`,
          Timestamp: new Date().toISOString(),
          EntryType: "Sales",
          Date: saleData.date,
          VehicleNo: saleData.vehicleNo,
          OilinLiters: saleData.oilLiters,
          Remarks: saleData.remarks,
          CreatedOn: this.getToday(),
          EnteredBy: this.currentUser.fullName,
          Status: "Pending",
        }

        // Update local state
        runInAction(() => {
          this.oilEntries = [newEntry, ...this.oilEntries]
          // localStorage.setItem("cachedOilData", JSON.stringify(this.oilEntries))
        })

        this.toast({
          title: "Success",
          description: "Sale entry submitted successfully",
          variant: "success",
        })
        return true
      } else {
        throw new Error(result[0]?.message || "Submission failed")
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
    if (!this.currentUser?.username) return false

    try {
      const data = {
        action: "addProjectData",
        token: this.currentUser.token,
        SheetName: "OilData",
        dataItems: [
          {
            SheetID: uuidv4(),
            EntryType: "Purchase",
            Date: purchaseData.date,
            PurchasedStock: purchaseData.purchasedStock,
            InvoiceAmount: purchaseData.invoiceAmount,
            Vendor: purchaseData.vendor,
            Remarks: purchaseData.remarks,
            CreatedOn: this.getToday(),
            EnteredBy: this.currentUser.fullName,
            Status: "Pending",
          },
        ],
      }

      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (Array.isArray(result) && result[0]?.success) {
        // Create a new entry with the data we have
        const newEntry: OilEntry = {
          SheetID: result[0]?.SheetID || `temp-${Date.now()}`,
          Timestamp: new Date().toISOString(),
          EntryType: "Purchase",
          Date: purchaseData.date,
          PurchasedStock: purchaseData.purchasedStock,
          InvoiceAmount: purchaseData.invoiceAmount,
          Vendor: purchaseData.vendor,
          Remarks: purchaseData.remarks,
          CreatedOn: this.getToday(),
          EnteredBy: this.currentUser.fullName,
          Status: "Pending",
        }

        // Update local state
        runInAction(() => {
          this.oilEntries = [newEntry, ...this.oilEntries]
          // localStorage.setItem("cachedOilData", JSON.stringify(this.oilEntries))
        })

        this.toast({
          title: "Success",
          description: "Purchase entry submitted successfully",
          variant: "success",
        })
        return true
      } else {
        throw new Error(result[0]?.message || "Submission failed")
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
    if (!this.currentUser?.token) return false

    try {
      const data = {
        action: "updateProjectsData",
        token: this.currentUser.token,
        sheetName: "OilData",
        dataItems: [
          {
            columntoFind: "SheetID",
            valueToFind: entry.SheetID,
            EntryType: entry.EntryType,
            Date: entry.Date,
            VehicleNo: entry.EntryType === "Sales" ? entry.VehicleNo : undefined,
            OilinLiters: entry.EntryType === "Sales" ? entry.OilinLiters : undefined,
            PurchasedStock: entry.EntryType === "Purchase" ? entry.PurchasedStock : undefined,
            InvoiceAmount: entry.EntryType === "Purchase" ? entry.InvoiceAmount : undefined,
            Vendor: entry.EntryType === "Purchase" ? entry.Vendor : undefined,
            Remarks: entry.Remarks,
            EditedOn: this.getToday(),
            EditedBy: this.currentUser.fullName,
            Status: entry.Status,
          },
        ],
      }

      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      // console.log("Update Result:", result)

      if (Array.isArray(result) && result[0]?.success) {
        // Update local state
        runInAction(() => {
          const index = this.oilEntries.findIndex((item) => item.SheetID === entry.SheetID)
          if (index !== -1) {
            this.oilEntries[index] = {
              ...this.oilEntries[index],
              ...entry,
              EditedOn: this.getToday(),
              EditedBy: this.currentUser.fullName,
            }
            // localStorage.setItem("cachedOilData", JSON.stringify(this.oilEntries))
          }
        })

        this.toast({
          title: "Success",
          description: `${entry.EntryType} entry updated successfully`,
          variant: "success",
        })
        return true
      } else {
        throw new Error(result[0]?.message || "Update failed")
      }
    } catch (err: any) {
      console.error("Update Error:", err)
      this.toast({
        title: "Error",
        description: err.message || `Failed to update ${entry.EntryType.toLowerCase()} entry`,
        variant: "destructive",
      })
      return false
    }
  }

  async deleteOilEntry(entry: any) {
    if (!this.currentUser?.username) return false

    try {
      const data = {
        action: "deleteProjectsData",
        token: this.currentUser.token,
        dataItems: [
          {
            columntoFind: "SheetID",
            valueToFind: entry.SheetID,
          },
        ],
      }

      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (Array.isArray(result) && result[0]?.success) {
        // Update local state
        runInAction(() => {
          this.oilEntries = this.oilEntries.filter((item) => item.SheetID !== entry.SheetID)
          // localStorage.setItem("cachedOilData", JSON.stringify(this.oilEntries))
        })

        this.toast({
          title: "Success",
          description: "Entry deleted successfully",
        })
        return true
      } else {
        throw new Error(result[0]?.message || "Failed to delete entry")
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
    if (!this.currentUser?.username) return

    this.isLoading = true
    try {
      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "getUsers",
          token: this.currentUser.token,
          dataItems: [
            {
              columnsToReturn: ["SheetID", "FullName", "userName", "UserType", "TimeOutMinute", "Status"],
            },
          ],
        }),
      })

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        runInAction(() => {
          this.users = result.data
          // localStorage.setItem("cachedUserData", JSON.stringify(result.data))
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
    if (!this.currentUser?.token) return false

    try {
      const data = {
        action: "addUsersData",
        token: this.currentUser.token,
        dataItems: [
          {
            SheetID: uuidv4(),
            FullName: userData.fullName.trim(),
            userName: userData.username.trim(),
            Password: userData.password,
            UserType: userData.userType,
            TimeOutMinute: userData.timeout,
            Status: userData.status,
          },
        ],
      }

      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (Array.isArray(result) && result[0]?.success) {
        // Create a new user with the data we have
        const newUser: User = {
          SheetID: result[0]?.SheetID || `temp-${Date.now()}`,
          FullName: userData.fullName.trim(),
          userName: userData.username.trim(),
          UserType: userData.userType,
          TimeOutMinute: userData.timeout,
          Status: userData.status,
        }

        // Update local state
        runInAction(() => {
          this.users = [...this.users, newUser]
          // localStorage.setItem("cachedUserData", JSON.stringify(this.users))
        })

        this.toast({
          title: "Success",
          description: "User created successfully",
          variant: "success",
        })
        return true
      } else {
        throw new Error(result[0]?.message || "Failed to create user")
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
    if (!this.currentUser?.username) return false

    try {
      const data = {
        action: "updateUsersData",
        token: this.currentUser.token,
        dataItems: [
          {
            columntoFind: "SheetID",
            valueToFind: user.SheetID,
            FullName: user.FullName.trim(),
            userName: user.userName.trim(),
            Password: user.Password || undefined, // Only update if provided
            UserType: user.UserType,
            TimeOutMinute: user.TimeOutMinute,
            Status: user.Status,
          },
        ],
      }

      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (Array.isArray(result) && result[0]?.success) {
        // Update local state
        runInAction(() => {
          const index = this.users.findIndex((item) => item.SheetID === user.SheetID)
          if (index !== -1) {
            this.users[index] = {
              ...this.users[index],
              ...user,
            }
            // localStorage.setItem("cachedUserData", JSON.stringify(this.users))
          }
        })

        this.toast({
          title: "Success",
          description: "User updated successfully",
        })
        return true
      } else {
        throw new Error(result[0]?.message || "Failed to update user")
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
    if (!this.currentUser?.username) return false

    try {
      const data = {
        action: "deleteUsersData",
        token: this.currentUser.token,
        dataItems: [
          {
            columntoFind: "SheetID",
            valueToFind: user.SheetID,
          },
        ],
      }

      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (Array.isArray(result) && result[0]?.success) {
        // Update local state
        runInAction(() => {
          this.users = this.users.filter((item) => item.SheetID !== user.SheetID)
          // Remove user from store
          const index = this.users.findIndex((u) => u.SheetID === user.SheetID)
          if (index !== -1) {
            this.users.splice(index, 1)
          }
          // localStorage.setItem("cachedUserData", JSON.stringify(this.users))
        })

        this.toast({
          title: "Success",
          description: "User deleted successfully",
        })
        return true
      } else {
        throw new Error(result[0]?.message || "Failed to delete user")
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
    if (!this.currentUser?.username) return

    this.isLoading = true
    try {
      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "getJSON",
          token: this.currentUser.token,
          sheetName: "Reports",
          dataItems: [
            {
              columnsToReturn: ["SrNo", "VehicleNo", "LastDateofOilChange", "TripafterOilChange"],
            },
          ],
        }),
      })

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        runInAction(() => {
          this.reports = result.data
          // localStorage.setItem("cachedReportsData", JSON.stringify(result.data))
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
      const response = await fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          username,
          password,
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

  setLoading(loading: boolean): void {
    this.isLoading = loading
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
  async fetchAllDataOld2() {
    // if (!this.currentUser?.token || !this.currentUser?.username || !this.currentUser?.password) {
    //   this.toast({
    //     title: "Error",
    //     description: "Missing credentials. Please login again.",
    //     variant: "destructive",
    //   })
    //   return
    // }

    runInAction(() => {
      this.isLoading = true
      this.isNavigating = true
    })

    try {
      // const Apidata = {
      //   action: "getDashBoardData",
      //   token: this.currentUser.token,
      //   dataItems: [
      //     {
      //       sheetName: "OilData",
      //       columnsToReturn: [
      //         "SheetID",
      //         "Timestamp",
      //         "EntryType",
      //         "Date",
      //         "VehicleNo",
      //         "OilinLiters",
      //         "PurchasedStock",
      //         "Vendor",
      //         "Remarks",
      //         "CreatedOn",
      //         "EnteredBy",
      //         "Status",
      //       ],
      //     },
      //     {
      //       sheetName: "VehicleData",
      //       columnsToReturn: ["VehicleNo", "OilInLiters", "Contractor"],
      //     },
      //     {
      //       sheetName: "UsersInfo",
      //       columnsToReturn: ["SheetID", "FullName", "userName", "UserType", "TimeOutMinute", "Status"],
      //     },
      //     {
      //       sheetName: "Reports",
      //       columnsToReturn: ["SrNo", "VehicleNo", "LastDateofOilChange", "TripafterOilChange"],
      //     },
      //   ],
      // }

      // const res = await fetch(this.GOOGLE_SCRIPT_URL, {
      //   method: "POST",

      //   // body: JSON.stringify({
      //   //   action: "getDashBoardData",
      //   //  "username": "ASHFAQ",
      //   //   "password": "AshfaqSA",
      //   //   dataItems: [
      //   //     {
      //   //       sheetName: "OilData",
      //   //       columnsToReturn: ["EntryType", "Date", "VehicleNo", "OilinLiters", "PurchasedStock", "Vendor", "Remarks", "CreatedOn", "EnteredBy", "Status"]
      //   //     },
      //   //     {
      //   //       sheetName: "VehicleData",
      //   //       columnsToReturn: ["VehicleNo", "OilInLiters", "Contractor"]
      //   //     },
      //   //     {
      //   //       sheetName: "UsersInfo",
      //   //       columnsToReturn: ["SheetID", "FullName", "userName", "UserType", "TimeOutMinute", "Status"]
      //   //     },
      //   //     {
      //   //       sheetName: "Reports",
      //   //       columnsToReturn: ["SrNo", "VehicleNo", "LastDateofOilChange", "TripafterOilChange"]
      //   //     }
      //   //   ]
      //   // }),

      //   body: JSON.stringify(Apidata),
      // })
      
      const res = await fetch("/api/dashboard")

      if (!res.ok) {
        throw new Error("Network response was not ok")
      }
      const result = await res.json()

      // if (!result.success || !Array.isArray(result.data)) {
      //   throw new Error("Invalid response format from server.")
      // }

      const data = result?.data

      console.table("Fetched Data:", data)

      runInAction(() => {
        // this.oilEntries = data.OilData[0] || []

        if (result.success && Array.isArray(data?.OilData)) {
          // Sort data by Date in descending order
          const sortedData = data?.OilData?.sort((a: any, b: any) => {
            const dateA = new Date(a.Date).getTime() || 0
            const dateB = new Date(b.Date).getTime() || 0
            return dateB - dateA // Descending order
          })

          runInAction(() => {
            this.oilEntries = sortedData
            // localStorage.setItem("cachedOilData", JSON.stringify(sortedData))
          })
        } else {
          this.toast({
            title: "Error",
            description: "Failed to load oil data",
            variant: "destructive",
          })
        }

        if (result.success && Array.isArray(data?.VehicleData)) {
          this.vehicles = data?.VehicleData || []
        }

        if (result.success && Array.isArray(data?.Reports)) {
          this.reports = data?.Reports || []
        }

        // Only assign users if currentUser is SuperAdmin

        if (this.currentUser?.userType === "SuperAdmin") {
          this.users = data?.UsersInfo || []
        }

        // Extract unique vendors from OilData
        const vendorSet = new Set(
          (data?.OilData || [])
            .map((entry: any) => entry?.vendor?.trim())
            .filter((vendor: string | undefined) => vendor && vendor !== ""),
        )
        this.vendors = Array.from(vendorSet)

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

      console.log("Result:", result)

     // Fix here: Check data is an object, not an array
    if (!result.success || typeof result.data !== "object" || result.data === null) {
      throw new Error("Invalid response format from server.")
    }

    const data = result.data

    console.table("Fetched Data:", data)

      runInAction(() => {
        // this.oilEntries = data.OilData[0] || []

        if (result.success && Array.isArray(data?.OilData)) {
          // Sort data by Date in descending order
          const sortedData = data?.OilData?.sort((a: any, b: any) => {
            const dateA = new Date(a.Date).getTime() || 0
            const dateB = new Date(b.Date).getTime() || 0
            return dateB - dateA // Descending order
          })

          runInAction(() => {
            this.oilEntries = sortedData
            // localStorage.setItem("cachedOilData", JSON.stringify(sortedData))
          })
        } else {
          this.toast({
            title: "Error",
            description: "Failed to load oil data",
            variant: "destructive",
          })
        }

        if (result.success && Array.isArray(data?.VehicleData)) {
          this.vehicles = data?.VehicleData || []
        }

        if (result.success && Array.isArray(data?.Reports)) {
          this.reports = data?.Reports || []
        }

        // Only assign users if currentUser is SuperAdmin

        if (this.currentUser?.userType === "SuperAdmin") {
          this.users = data?.UsersInfo || []
        }

        // Extract unique vendors from OilData
        const vendorSet = new Set(
          (data?.OilData || [])
            .map((entry: any) => entry?.Vendor?.trim())
            .filter((vendor: string | undefined) => vendor && vendor !== ""),
        )
        this.vendors = Array.from(vendorSet)

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
    } finally {
      runInAction(() => {
        this.isLoading = false
        this.isNavigating = false
      })
    }
  }

  // async fetchAllDataOld() {
  //   if (!this.currentUser?.username) return

  //   try {
  //     // Create an array of promises for parallel fetching
  //     const fetchPromises = [this.loadOilData(), this.loadVehicleData(), this.loadVendorData(), this.loadReportsData()]

  //     // Only fetch users data if SuperAdmin
  //     if (this.currentUser.userType === "SuperAdmin") {
  //       fetchPromises.push(this.loadUserData())
  //     }

  //     // Wait for all fetches to complete
  //     await Promise.all(fetchPromises)

  //     this.toast({
  //       title: "Data Loaded",
  //       description: "All application data has been fetched successfully",
  //       variant: "success",
  //     })

  //     runInAction(() => {
  //       this.dataInitialized = true
  //       this.isLoading = false
  //       this.isNavigating = false

  //     })

  //   } catch (error) {
  //     console.error("Background data fetch error:", error)
  //     this.toast({
  //       title: "Warning",
  //       description: "Some data could not be loaded. Please refresh the page.",
  //       variant: "destructive",
  //     })
  //   }
  // }
}

// Create a singleton instance
const store = new AppStore()
export default store

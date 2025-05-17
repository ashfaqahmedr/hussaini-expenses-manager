import { makeAutoObservable } from "mobx"
import originalStore from "./store"
import databaseStore from "./database-store"

class RootStore {
  // Data source preference
  dataSource: "google" | "mysql" | "both" = "mysql"
  isInitialized = false
  isLoading = false

  constructor() {
    makeAutoObservable(this)
    this.initializeFromLocalStorage()
  }

  setLoading(loading: boolean) {
    this.isLoading = loading
    // Also set loading state in both stores for consistency
    databaseStore.setLoading(loading)
    originalStore.setLoading(loading)
  }

  setDataSource(source: "google" | "mysql" | "both") {
    this.dataSource = source
    localStorage.setItem("dataSource", source)

    // Update the setting in the database if user is logged in
    if (databaseStore.currentUser) {
      databaseStore.updateSetting("dataSource", source)
    }
  }

  async loadDataSourcePreference() {
    // First try to load from localStorage for immediate UI response
    const savedSource = localStorage.getItem("dataSource") as "google" | "mysql" | "both"
    if (savedSource) {
      this.dataSource = savedSource
    }

    // Then try to load from database if user is logged in
    if (databaseStore.currentUser) {
      try {
        const response = await fetch("/api/settings")
        const result = await response.json()

        if (result.success && Array.isArray(result.data)) {
          const dataSourceSetting = result.data.find((setting: any) => setting.key === "dataSource")
          if (dataSourceSetting) {
            this.dataSource = dataSourceSetting.value as "google" | "mysql" | "both"
            localStorage.setItem("dataSource", this.dataSource)
          }
        }
      } catch (error) {
        console.error("Error loading data source from API:", error)
      }
    }

    this.isInitialized = true
  }

  get activeStore() {
    switch (this.dataSource) {
      case "google":
        return originalStore
      case "mysql":
        return databaseStore
      case "both":
        // For "both", we'll use the MySQL store as the primary
        // but sync operations will happen in the API layer
        return databaseStore
      default:
        return databaseStore
    }
  }

  // Set current user in both stores and localStorage
  setCurrentUser(user: any) {
    console.log("Setting current user in root store:", user)

    // Set in both stores
    databaseStore.setCurrentUser(user)
    originalStore.setCurrentUser(user)

    // Save to localStorage for persistence
    localStorage.setItem("currentUser", JSON.stringify(user))
  }

  // Proxy methods to the active store
  get currentUser() {
    return this.activeStore.currentUser
  }

  get oilEntries() {
    return this.activeStore.oilEntries || []
  }

  get users() {
    return this.activeStore.users || []
  }

  get vehicles() {
    return this.activeStore.vehicles || []
  }

  get reports() {
    return this.activeStore.reports || []
  }

  get vendors() {
    return this.activeStore.vendors || []
  }

  get tempSaleEntries() {
    return this.activeStore.tempSaleEntries || []
  }

  get tempPurchaseEntries() {
    return this.activeStore.tempPurchaseEntries || []
  }

  get userTypes() {
    return this.activeStore.userTypes || []
  }

  get userStatuses() {
    return this.activeStore.userStatuses || []
  }

  get entryStatus() {
    return this.activeStore.entryStatus || []
  }

  get activeTab() {
    return this.activeStore.activeTab || "all"
  }

  get dataInitialized() {
    return this.activeStore.dataInitialized || false
  }

  get searchQuery() {
    return this.activeStore.searchQuery || ""
  }

  setActiveTab(tab: string) {
    this.activeStore.setActiveTab(tab)
  }

  setSearchQuery(query: string) {
    this.activeStore.setSearchQuery(query)
  }

  // Authentication methods
  async login(username: string, password: string) {
    try {
      // This is now handled in the login-form component
      // This method is kept for backward compatibility
      console.log("Root store login method called - this is now handled in the login form")
      return true
    } catch (error) {
      console.error("Login Error:", error)
      this.toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
      return false
    }
  }

  logout() {
    // Logout from both stores
    databaseStore.logout()
    originalStore.logout()

    // Clear localStorage
    localStorage.removeItem("currentUser")

    this.toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    })
  }

  // Data fetching methods
  async fetchAllData() {
    // Use the dashboard API which handles data source selection
    try {
      console.log("Fetching all data from dashboard API")
      this.setLoading(true)

      const response = await fetch("/api/dashboard")
      const result = await response.json()

      console.log("Dashboard API response:", result)

      if (!result.success) {
        throw new Error("Failed to fetch dashboard data")
      }

      // Update the active store with the fetched data
      this.activeStore.updateFromDashboardData(result.data)

      this.toast({
        title: "Data Loaded",
        description: "All application data has been fetched successfully",
        variant: "success",
      })

      return true
    } catch (error) {
      console.error("Dashboard data fetch error:", error)
      this.toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      this.setLoading(false)
    }
  }

  // Oil entry methods
  async addSaleEntry(data: any) {
    const result = await this.activeStore.addSaleEntry(data)

    // If using both data sources, sync with Google Sheets
    if (this.dataSource === "both" && result) {
      try {
        // Call the sync API endpoint
        await fetch("/api/sync/oil-entry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "add",
            entryType: "Sales",
            data: data,
          }),
        })
      } catch (error) {
        console.error("Sync error:", error)
      }
    }

    return result
  }

  async addPurchaseEntry(data: any) {
    const result = await this.activeStore.addPurchaseEntry(data)

    // If using both data sources, sync with Google Sheets
    if (this.dataSource === "both" && result) {
      try {
        // Call the sync API endpoint
        await fetch("/api/sync/oil-entry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "add",
            entryType: "Purchase",
            data: data,
          }),
        })
      } catch (error) {
        console.error("Sync error:", error)
      }
    }

    return result
  }

  async updateOilEntry(entry: any) {
    const result = await this.activeStore.updateOilEntry(entry)

    // If using both data sources, sync with Google Sheets
    if (this.dataSource === "both" && result) {
      try {
        // Call the sync API endpoint
        await fetch("/api/sync/oil-entry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update",
            entryType: entry.entryType,
            data: entry,
          }),
        })
      } catch (error) {
        console.error("Sync error:", error)
      }
    }

    return result
  }

  async deleteOilEntry(entry: any) {
    const result = await this.activeStore.deleteOilEntry(entry)

    // If using both data sources, sync with Google Sheets
    if (this.dataSource === "both" && result) {
      try {
        // Call the sync API endpoint
        await fetch("/api/sync/oil-entry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "delete",
            entryType: entry.entryType,
            data: entry,
          }),
        })
      } catch (error) {
        console.error("Sync error:", error)
      }
    }

    return result
  }

  // Temporary entry methods
  addTempSaleEntry(entry: any) {
    return this.activeStore.addTempSaleEntry(entry)
  }

  removeTempSaleEntry(id: string) {
    this.activeStore.removeTempSaleEntry(id)
  }

  updateTempSaleEntry(id: string, entry: any) {
    this.activeStore.updateTempSaleEntry(id, entry)
  }

  addTempPurchaseEntry(entry: any) {
    return this.activeStore.addTempPurchaseEntry(entry)
  }

  removeTempPurchaseEntry(id: string) {
    this.activeStore.removeTempPurchaseEntry(id)
  }

  updateTempPurchaseEntry(id: string, entry: any) {
    this.activeStore.updateTempPurchaseEntry(id, entry)
  }

  async submitSaleEntriesBulk() {
    const result = await this.activeStore.submitSaleEntriesBulk()

    // If using both data sources, sync with Google Sheets
    if (this.dataSource === "both" && result) {
      try {
        // Call the sync API endpoint
        await fetch("/api/sync/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "add",
            entryType: "Sales",
            data: this.activeStore.tempSaleEntries,
          }),
        })
      } catch (error) {
        console.error("Sync error:", error)
      }
    }

    return result
  }

  async submitPurchaseEntriesBulk() {
    const result = await this.activeStore.submitPurchaseEntriesBulk()

    // If using both data sources, sync with Google Sheets
    if (this.dataSource === "both" && result) {
      try {
        // Call the sync API endpoint
        await fetch("/api/sync/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "add",
            entryType: "Purchase",
            data: this.activeStore.tempPurchaseEntries,
          }),
        })
      } catch (error) {
        console.error("Sync error:", error)
      }
    }

    return result
  }

  // User methods
  async addUser(userData: any) {
    const result = await this.activeStore.addUser(userData)

    // If using both data sources, sync with Google Sheets
    if (this.dataSource === "both" && result) {
      try {
        // Call the sync API endpoint
        await fetch("/api/sync/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "add",
            data: userData,
          }),
        })
      } catch (error) {
        console.error("Sync error:", error)
      }
    }

    return result
  }

  async updateUser(user: any) {
    const result = await this.activeStore.updateUser(user)

    // If using both data sources, sync with Google Sheets
    if (this.dataSource === "both" && result) {
      try {
        // Call the sync API endpoint
        await fetch("/api/sync/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update",
            data: user,
          }),
        })
      } catch (error) {
        console.error("Sync error:", error)
      }
    }

    return result
  }

  async deleteUser(user: any) {
    const result = await this.activeStore.deleteUser(user)

    // If using both data sources, sync with Google Sheets
    if (this.dataSource === "both" && result) {
      try {
        // Call the sync API endpoint
        await fetch("/api/sync/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "delete",
            data: user,
          }),
        })
      } catch (error) {
        console.error("Sync error:", error)
      }
    }

    return result
  }

  // Vehicle methods
  async addVehicle(vehicle: any) {
    const result = await this.activeStore.addVehicle(vehicle)

    // If using both data sources, sync with Google Sheets
    if (this.dataSource === "both" && result) {
      try {
        // Call the sync API endpoint
        await fetch("/api/sync/vehicle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "add",
            data: vehicle,
          }),
        })
      } catch (error) {
        console.error("Sync error:", error)
      }
    }

    return result
  }

  // Toast helper
  toast(props: any) {
    this.activeStore.toast(props)
  }

  initializeFromLocalStorage() {
    // Try to load user from localStorage
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        console.log("User restored from localStorage:", user)
        this.setCurrentUser(user)
      } catch (error) {
        console.error("Error parsing user from localStorage:", error)
        localStorage.removeItem("currentUser")
      }
    }

    // Load data source preference
    this.loadDataSourcePreference()
  }
}

// Create a singleton instance
const rootStore = new RootStore()
export default rootStore

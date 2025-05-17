"use client"

import { createContext, useContext, type ReactNode } from "react"
import store from "./store"

console.log("StoreProvider initialized")

// Create a context for the store
const StoreContext = createContext(store)

// Hook to use the store
export const useStore = () => useContext(StoreContext)

// Provider component
export const StoreProvider = ({ children }: { children: ReactNode }) => {
  console.log("StoreProvider rendering, store:", store)
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

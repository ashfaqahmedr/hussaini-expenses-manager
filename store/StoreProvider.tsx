"use client"

import { createContext, useContext, type ReactNode } from "react"
import store from "./unified-store"

const StoreContext = createContext(store)

export const useStore = () => useContext(StoreContext)

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
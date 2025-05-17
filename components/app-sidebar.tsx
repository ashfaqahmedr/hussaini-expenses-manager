"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Home, Users, LogOut, BarChart3, Settings, User, Sun, Moon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/theme-provider"
import { observer } from "mobx-react-lite"
import { useStore } from "@/store/StoreProvider"

const AppSidebar = observer(() => {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const store = useStore()

  const handleLogout = () => {
    store.logout()
    router.push("/")
  }

  const isActive = (path: string) => pathname === path

  const toggleTheme = () => {
    if (setTheme) {
      setTheme(theme === "dark" ? "light" : "dark")
    }
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 px-4 py-2">
            <img
              src="https://hussainienterprises.com/beta/wp-content/uploads/2022/09/cropped-11055774311664019041sst_4_LOGO-HUSSAINILOGISTIC-01-e1663767462711.png"
              alt="Logo"
              className="h-8 w-auto"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Hussaini Logistics</span>
              <span className="text-xs text-muted-foreground">Mobil Oil App</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard") || pathname === "/dashboard"}>
                    {/* <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard")}> */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        store.setActiveTab("all")
                      }}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {store.currentUser?.userType === "SuperAdmin" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/users")}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          store.setActiveTab("users")
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <span>Users</span>
                      </Button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/reports")}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        store.setActiveTab("reports")
                      }}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Reports</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/settings")}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      // onClick={() => router.push("/dashboard/settings")}
                      onClick={() => {
                        store.setActiveTab("settings")
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{store.currentUser?.fullName}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {store.currentUser?.userType}
              </Badge>
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="ml-2 h-8 w-8">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <SidebarTrigger />
      </div>
    </>
  )
})

export default AppSidebar

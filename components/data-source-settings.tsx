"use client"

import { useState, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Database, Cloud, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import rootStore from "@/store/root-store"

export const DataSourceSettings = observer(() => {
  const { toast } = useToast()
  const [dataSource, setDataSource] = useState<"mysql" | "google" | "both">(rootStore.dataSource)
  const [isLoading, setIsLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [googleApiUrl, setGoogleApiUrl] = useState("")

  // Load settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings")
        const result = await response.json()

        if (result.success && Array.isArray(result.data)) {
          // Find the dataSource setting
          const dataSourceSetting = result.data.find((setting: any) => setting.key === "dataSource")
          if (dataSourceSetting) {
            setDataSource(dataSourceSetting.value as "mysql" | "google" | "both")
          }

          // Find the googleApiUrl setting
          const googleApiUrlSetting = result.data.find((setting: any) => setting.key === "googleApiUrl")
          if (googleApiUrlSetting) {
            setGoogleApiUrl(googleApiUrlSetting.value)
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error)
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
      }
    }

    loadSettings()
  }, [toast])

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Save dataSource setting
      const dataSourceResponse = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "dataSource",
          value: dataSource,
        }),
      })

      const dataSourceResult = await dataSourceResponse.json()

      if (!dataSourceResult.success) {
        throw new Error("Failed to save data source setting")
      }

      // Save googleApiUrl setting if using Google or both
      if (dataSource === "google" || dataSource === "both") {
        if (!googleApiUrl) {
          throw new Error("Google API URL is required when using Google as a data source")
        }

        const googleApiUrlResponse = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "googleApiUrl",
            value: googleApiUrl,
          }),
        })

        const googleApiUrlResult = await googleApiUrlResponse.json()

        if (!googleApiUrlResult.success) {
          throw new Error("Failed to save Google API URL setting")
        }
      }

      // Update the root store
      rootStore.setDataSource(dataSource)

      toast({
        title: "Settings Saved",
        description: "Data source settings have been updated successfully",
        variant: "success",
      })

      // Refresh data from the new source
      await rootStore.fetchAllData()
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setTestingConnection(true)
    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataSource,
          googleApiUrl: dataSource === "google" || dataSource === "both" ? googleApiUrl : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `Successfully connected to ${
            dataSource === "mysql"
              ? "MySQL database"
              : dataSource === "google"
                ? "Google Sheets API"
                : "both MySQL and Google Sheets"
          }`,
          variant: "success",
        })
      } else {
        throw new Error(result.error || "Connection test failed")
      }
    } catch (error) {
      console.error("Connection test error:", error)
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to test connection",
        variant: "destructive",
      })
    } finally {
      setTestingConnection(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Data Source Settings</CardTitle>
        <CardDescription>Configure where your application data is stored and retrieved from.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Select Data Source</h3>
          <RadioGroup value={dataSource} onValueChange={(value) => setDataSource(value as "mysql" | "google" | "both")}>
            <div className="flex items-start space-x-2 rounded-md border p-4">
              <RadioGroupItem value="mysql" id="mysql" />
              <div className="flex-1 space-y-1">
                <Label htmlFor="mysql" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  MySQL Database
                </Label>
                <p className="text-sm text-muted-foreground">
                  Store all data in a local MySQL database. Best for reliability and performance.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 rounded-md border p-4">
              <RadioGroupItem value="google" id="google" />
              <div className="flex-1 space-y-1">
                <Label htmlFor="google" className="flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  Google Sheets
                </Label>
                <p className="text-sm text-muted-foreground">
                  Store all data in Google Sheets. Best for collaboration and accessibility.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 rounded-md border p-4">
              <RadioGroupItem value="both" id="both" />
              <div className="flex-1 space-y-1">
                <Label htmlFor="both" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Both (Synchronized)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Store data in both MySQL and Google Sheets, keeping them synchronized. Best for redundancy.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {(dataSource === "google" || dataSource === "both") && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Google Sheets API Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="googleApiUrl">Google API URL</Label>
              <input
                id="googleApiUrl"
                type="text"
                value={googleApiUrl}
                onChange={(e) => setGoogleApiUrl(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="https://script.google.com/macros/s/..."
              />
              <p className="text-sm text-muted-foreground">Enter the URL for your Google Apps Script web app.</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={testConnection} disabled={testingConnection}>
          {testingConnection ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
})

export default DataSourceSettings

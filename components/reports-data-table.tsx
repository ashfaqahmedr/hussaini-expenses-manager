"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"

interface ReportsDataTableProps {
  data: any[]
}

const ReportsDataTable = ({ data }: ReportsDataTableProps) => {
  // Function to properly format dates that might be in dd-mm-yy format
  const formatReportDate = (dateString: string) => {
    if (!dateString) return ""

    // Check if the date is in dd-mm-yy format
    const ddmmyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/
    const match = dateString.match(ddmmyyRegex)

    if (match) {
      // Convert dd-mm-yy to yyyy-mm-dd for proper Date object creation
      const day = match[1].padStart(2, "0")
      const month = match[2].padStart(2, "0")
      let year = match[3]

      // Handle 2-digit years
      if (year.length === 2) {
        year = Number.parseInt(year) > 50 ? `19${year}` : `20${year}`
      }

      return formatDate(`${year}-${month}-${day}`)
    }

    // If not in dd-mm-yy format, use the standard formatDate function
    return formatDate(dateString)
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-auto max-h-[calc(100vh-150px)]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-100">
            <TableRow>
              <TableHead>Sr No</TableHead>
              <TableHead>Vehicle No</TableHead>
              <TableHead>Last Oil Change Date</TableHead>
              <TableHead>Trips After Oil Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              data.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.srNo}</TableCell>
                  <TableCell className="font-medium">{report.vehicleNo}</TableCell>
                  <TableCell>{formatReportDate(report.lastDateOfOilChange)}</TableCell>
                  <TableCell>{report.tripAfterOilChange}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Make sure to export as default
export default ReportsDataTable

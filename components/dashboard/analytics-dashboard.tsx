"use client"

import { useState, useEffect } from "react"

interface AnalyticsDashboardProps {
  tenantId: string
}

interface AnalyticsData {
  totalUsers: number
  totalContent: number
  totalNFTs: number
  totalRevenue: number
  monthlyViews: Array<{ month: string; views: number }>
  contentTypes: Array<{ type: string; count: number; color: string }>
  recentActivity: Array<{
    id: string
    action: string
    user: string
    timestamp: string
    details: string
  }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function AnalyticsDashboard({ tenantId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [tenantId])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics", {
        headers: {
          "x-tenant-id": tenantId,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch analytics")

      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted p-4 rounded-lg">
            <div className="h-4 bg-primary"></div>
            <div className="mt-2 space-y-4">
              <div className="h-4 bg-primary"></div>
              <div className="h-4 bg-primary"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ** rest of code here **
}

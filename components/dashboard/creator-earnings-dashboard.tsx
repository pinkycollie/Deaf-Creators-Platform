"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  CreditCard,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

interface CreatorEarningsDashboardProps {
  tenantId: string
  creatorId?: string
}

interface EarningsSummary {
  total_gross: number
  total_platform_fees: number
  total_taxes: number
  total_net: number
  pending_amount: number
  paid_amount: number
  by_type: Record<string, { gross: number; net: number; count: number }>
  by_content: Array<{ content_id: string; title: string; amount: number }>
}

interface PaymentTransaction {
  id: string
  gross_amount: number
  net_amount: number
  fee_amount: number
  currency: string
  status: string
  payment_method: string
  initiated_at: string
  completed_at?: string
}

interface CreatorEarning {
  id: string
  earning_type: string
  description: string
  gross_amount: number
  net_amount: number
  platform_fee: number
  status: string
  created_at: string
  content_id?: string
}

export function CreatorEarningsDashboard({
  tenantId,
  creatorId,
}: CreatorEarningsDashboardProps) {
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([])
  const [earnings, setEarnings] = useState<CreatorEarning[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingPayout, setIsProcessingPayout] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchEarningsData()
  }, [tenantId, creatorId])

  const fetchEarningsData = async () => {
    try {
      // Fetch earnings summary
      const summaryRes = await fetch(
        `/api/payments?action=earnings${creatorId ? `&creatorId=${creatorId}` : ""}`,
        { headers: { "x-tenant-id": tenantId } }
      )
      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data.summary)
      }

      // Fetch payment history
      const historyRes = await fetch(
        `/api/payments?action=history${creatorId ? `&creatorId=${creatorId}` : ""}`,
        { headers: { "x-tenant-id": tenantId } }
      )
      if (historyRes.ok) {
        const data = await historyRes.json()
        setPaymentHistory(data.history || [])
      }
    } catch (error) {
      console.error("Error fetching earnings data:", error)
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    if (!summary || summary.pending_amount < 50) {
      toast({
        title: "Minimum not met",
        description: "You need at least $50 in pending earnings to request a payout.",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPayout(true)
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          action: "request_payout",
          earningIds: earnings
            .filter((e) => e.status === "confirmed")
            .map((e) => e.id),
        }),
      })

      if (response.ok) {
        toast({
          title: "Payout Requested",
          description: "Your payout is being processed.",
        })
        fetchEarningsData()
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error requesting payout:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to request payout",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayout(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted h-32 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6" role="main" aria-label="Creator Earnings Dashboard">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.total_net || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gross: {formatCurrency(summary?.total_gross || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(summary?.pending_amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum payout: $50
            </p>
            {(summary?.pending_amount || 0) >= 50 && (
              <Progress
                value={Math.min(100, ((summary?.pending_amount || 0) / 50) * 100)}
                className="mt-2 h-1"
                aria-label="Payout threshold progress"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.paid_amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully paid out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {formatCurrency(summary?.total_platform_fees || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              10% of gross earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Request Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" aria-hidden="true" />
            Request Payout
          </CardTitle>
          <CardDescription>
            Transfer your earnings to your connected payment method
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">
              Available: {formatCurrency(summary?.pending_amount || 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              {(summary?.pending_amount || 0) < 50
                ? `Need ${formatCurrency(50 - (summary?.pending_amount || 0))} more to reach minimum`
                : "Ready for payout"}
            </p>
          </div>
          <Button
            onClick={handleRequestPayout}
            disabled={isProcessingPayout || (summary?.pending_amount || 0) < 50}
            aria-label="Request payout to your connected account"
          >
            {isProcessingPayout ? (
              "Processing..."
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                Request Payout
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Earnings Breakdown Tabs */}
      <Tabs defaultValue="by-type" className="space-y-4">
        <TabsList aria-label="Earnings breakdown views">
          <TabsTrigger value="by-type">By Type</TabsTrigger>
          <TabsTrigger value="by-content">By Content</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="by-type">
          <Card>
            <CardHeader>
              <CardTitle>Earnings by Type</CardTitle>
              <CardDescription>
                Breakdown of your earnings by source type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.by_type &&
                  Object.entries(summary.by_type).map(([type, data]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-primary/10">
                          {type === "royalty" ? (
                            <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
                          ) : type === "task_payment" ? (
                            <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-primary" aria-hidden="true" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {type.replace("_", " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {data.count} transaction{data.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(data.net)}</p>
                        <p className="text-sm text-muted-foreground">
                          Gross: {formatCurrency(data.gross)}
                        </p>
                      </div>
                    </div>
                  ))}
                {(!summary?.by_type ||
                  Object.keys(summary.by_type).length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No earnings recorded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-content">
          <Card>
            <CardHeader>
              <CardTitle>Earnings by Content</CardTitle>
              <CardDescription>
                See how much each piece of content has earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary?.by_content && summary.by_content.length > 0 ? (
                    summary.by_content.map((content) => (
                      <TableRow key={content.content_id}>
                        <TableCell className="font-medium">
                          {content.title || "Untitled Content"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(content.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <ArrowUpRight
                            className="h-4 w-4 text-green-600 inline"
                            aria-label="Trending up"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground py-8"
                      >
                        No content earnings recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Your payout transactions
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" aria-label="Download payment history">
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Fees</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.length > 0 ? (
                    paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.initiated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.payment_method}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.net_amount, payment.currency)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(payment.fee_amount, payment.currency)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        No payment history yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

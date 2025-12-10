import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getStats, getCalls, type Stats, type Call } from "@/lib/api"
import { Phone, PhoneCall, MessageSquare, Clock, CheckCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: getStats,
  })

  const { data: recentCalls, isLoading: callsLoading } = useQuery<Call[]>({
    queryKey: ["calls", 10],
    queryFn: () => getCalls(10),
  })

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load dashboard data</p>
        <p className="text-sm text-muted-foreground mt-2">
          Make sure the backend is running on localhost:3000
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Comtel Voice Agent activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Calls"
          value={stats?.totalCalls || 0}
          description="Last 100 calls"
          icon={Phone}
        />
        <StatsCard
          title="Completed"
          value={stats?.completedCalls || 0}
          description="Successfully finished"
          icon={CheckCircle}
        />
        <StatsCard
          title="Avg Duration"
          value={formatDuration(stats?.avgDuration || 0)}
          description="Per completed call"
          icon={Clock}
        />
        <StatsCard
          title="Pending Callbacks"
          value={stats?.pendingCallbacks || 0}
          description="Awaiting action"
          icon={PhoneCall}
        />
        <StatsCard
          title="Unread Messages"
          value={stats?.unreadMessages || 0}
          description="Require attention"
          icon={MessageSquare}
        />
      </div>

      {/* Calls by Day Chart */}
      {stats?.callsByDay && (
        <Card>
          <CardHeader>
            <CardTitle>Calls This Week</CardTitle>
            <CardDescription>Daily call volume over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {Object.entries(stats.callsByDay).map(([date, count]) => {
                const maxCount = Math.max(...Object.values(stats.callsByDay), 1)
                const height = (count / maxCount) * 100
                const day = new Date(date).toLocaleDateString("it-IT", { weekday: "short" })
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary rounded-t transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{day}</span>
                    <span className="text-xs font-medium">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Calls */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
          <CardDescription>Latest calls to your voice agent</CardDescription>
        </CardHeader>
        <CardContent>
          {callsLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : recentCalls && recentCalls.length > 0 ? (
            <div className="space-y-2">
              {recentCalls.map((call) => (
                <Link
                  key={call.id}
                  to={`/calls/${call.callSid}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{call.from}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(call.startedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {call.duration && (
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(call.duration)}
                      </span>
                    )}
                    <Badge
                      variant={call.status === "completed" ? "success" : "secondary"}
                    >
                      {call.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No calls yet</p>
          )}
          <div className="mt-4">
            <Link
              to="/calls"
              className="text-sm text-primary hover:underline"
            >
              View all calls &rarr;
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

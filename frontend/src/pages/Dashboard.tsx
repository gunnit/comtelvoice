import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getStats, getCalls, type Stats, type Call } from "@/lib/api"
import { Phone, PhoneCall, MessageSquare, Clock, CheckCircle, TrendingUp, ArrowUpRight, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts"



function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "N/D"
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Adesso"
  if (diffMins < 60) return `${diffMins}m fa`
  if (diffHours < 24) return `${diffHours}h fa`
  return `${diffDays}g fa`
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
        <p className="text-destructive">Impossibile caricare i dati</p>
        <p className="text-sm text-muted-foreground mt-2">
          Assicurati che il backend sia in esecuzione
        </p>
      </div>
    )
  }

  const completionRate = stats?.totalCalls
    ? Math.round((stats.completedCalls / stats.totalCalls) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chiamate Totali
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCalls || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ultime 100 chiamate
            </p>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.completedCalls || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-600">+{completionRate}%</span> tasso completamento
            </p>
          </CardContent>
        </Card>

        {/* Pending Callbacks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Richiami in Attesa
            </CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.pendingCallbacks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Da gestire
            </p>
          </CardContent>
        </Card>

        {/* Unread Messages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Messaggi Non Letti
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.unreadMessages || 0}</div>
            <p className="text-xs text-muted-foreground">
              Richiedono attenzione
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Calls Volume Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Volume Chiamate</CardTitle>
            <CardDescription>
              Numero di chiamate negli ultimi 7 giorni
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.callsByDay && (
              <ChartContainer
                config={{
                  calls: { label: "Chiamate", color: "hsl(var(--primary))" },
                }}
                className="h-[200px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(stats.callsByDay).map(([date, count]) => ({
                      date,
                      calls: count,
                      day: new Date(date).toLocaleDateString("it-IT", { weekday: "short" }),
                      dayNum: new Date(date).getDate(),
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltipContent
                          active={active}
                          payload={payload as any}
                          label={label}
                          labelFormatter={(l) => l ? `${l.charAt(0).toUpperCase() + l.slice(1)}` : ""}
                          config={{
                            calls: { label: "Chiamate", color: "hsl(var(--primary))" },
                          }}
                        />
                      )}
                    />
                    <Bar
                      dataKey="calls"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Chiamate Recenti</CardTitle>
            <CardDescription>
              Ultime {recentCalls?.length || 0} chiamate ricevute
            </CardDescription>
          </CardHeader>
          <CardContent>
            {callsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : recentCalls && recentCalls.length > 0 ? (
              <div className="space-y-4">
                {recentCalls.slice(0, 5).map((call) => (
                  <Link
                    key={call.id}
                    to={`/calls/${call.callSid}`}
                    className="flex items-center gap-4 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {call.from}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(call.startedAt)}
                        {call.duration && call.duration > 0 && (
                          <span className="ml-2">({formatDuration(call.duration)})</span>
                        )}
                      </p>
                    </div>
                    <Badge
                      variant={call.status === "completed" ? "outline" : "secondary"}
                      className={call.status === "completed" ? "border-emerald-500 text-emerald-600" : ""}
                    >
                      {call.status === "completed" ? "OK" : call.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Nessuna chiamata</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Duration Chart Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Duration Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tempo Totale Chiamate</CardTitle>
            <CardDescription>
              Minuti di conversazione per giorno (ultimi 7 giorni)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.durationByDay && (
              <ChartContainer
                config={{
                  minutes: { label: "Minuti", color: "hsl(var(--chart-2))" },
                }}
                className="h-[200px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={Object.entries(stats.durationByDay).map(([date, minutes]) => ({
                      date,
                      minutes,
                      day: new Date(date).toLocaleDateString("it-IT", { weekday: "short" }),
                      dayNum: new Date(date).getDate(),
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltipContent
                          active={active}
                          payload={payload as any}
                          label={label}
                          labelFormatter={(l) => l ? `${l.charAt(0).toUpperCase() + l.slice(1)}` : ""}
                          valueFormatter={(v) => `${v} min`}
                          config={{
                            minutes: { label: "Minuti", color: "hsl(142 76% 36%)" },
                          }}
                        />
                      )}
                    />
                    <defs>
                      <linearGradient id="fillMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="hsl(142 76% 36%)"
                      fill="url(#fillMinutes)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Riepilogo</CardTitle>
            <CardDescription>
              Metriche principali
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tasso Completamento</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Durata Media</p>
                <p className="text-2xl font-bold">{formatDuration(stats?.avgDuration || 0)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Minuti Totali (7gg)</p>
                <p className="text-2xl font-bold">{stats?.totalMinutes || 0} min</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Da Gestire</p>
                <p className="text-2xl font-bold">
                  {(stats?.pendingCallbacks || 0) + (stats?.unreadMessages || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          to="/calls"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
        >
          Vedi tutte le chiamate
          <ArrowUpRight className="ml-1 h-3 w-3" />
        </Link>
        <Link
          to="/callbacks"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
        >
          Gestisci richiami
          <ArrowUpRight className="ml-1 h-3 w-3" />
        </Link>
        <Link
          to="/messages"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
        >
          Leggi messaggi
          <ArrowUpRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

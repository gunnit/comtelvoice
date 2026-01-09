import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getStats, getCalls, type Stats, type Call } from "@/lib/api"
import {
  Phone,
  PhoneCall,
  MessageSquare,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
  Users,
  Activity,
  Zap,
  BarChart3
} from "lucide-react"
import { Illustration } from "@/components/Illustration"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"

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

// Mini Sparkline Component
function Sparkline({
  data,
  color = "primary",
  height = 32,
  showArea = true
}: {
  data: number[]
  color?: "primary" | "success" | "warning" | "info"
  height?: number
  showArea?: boolean
}) {
  if (!data || data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 80
  const padding = 2

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((value - min) / range) * (height - 2 * padding)
    return { x, y }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`

  const colorMap = {
    primary: "hsl(var(--primary))",
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    info: "hsl(var(--info))"
  }

  const strokeColor = colorMap[color]

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea && (
        <path
          d={areaD}
          fill={`url(#sparkline-gradient-${color})`}
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={strokeColor}
      />
    </svg>
  )
}

// Metric Card Component
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  colorClass = "from-primary/20 to-primary/5",
  sparklineData,
  sparklineColor,
  href
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  trend?: string
  trendUp?: boolean
  colorClass?: string
  sparklineData?: number[]
  sparklineColor?: "primary" | "success" | "warning" | "info"
  href?: string
}) {
  const content = (
    <div className="metric-card card-interactive group">
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">{value}</span>
            {trend && (
              <span className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded",
                trendUp
                  ? "text-success bg-success/10"
                  : "text-destructive bg-destructive/10"
              )}>
                {trend}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            {sparklineData && sparklineData.length > 1 && (
              <Sparkline
                data={sparklineData}
                color={sparklineColor || "primary"}
                height={28}
              />
            )}
          </div>
        </div>
        <div className={cn(
          "p-3 rounded-xl bg-gradient-to-br transition-all duration-300",
          colorClass,
          "group-hover:scale-110 group-hover:shadow-glow"
        )}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link to={href}>{content}</Link>
  }

  return content
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="metric-card">
            <div className="space-y-3">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-8 w-16 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="skeleton h-5 w-32 rounded" />
          </CardHeader>
          <CardContent>
            <div className="skeleton h-[200px] w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <div className="skeleton h-5 w-28 rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
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
    return <DashboardSkeleton />
  }

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="p-4 rounded-2xl bg-destructive/10">
          <Activity className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Impossibile caricare i dati</p>
          <p className="text-sm text-muted-foreground mt-1">
            Assicurati che il backend sia in esecuzione
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Riprova
        </Button>
      </div>
    )
  }

  const completionRate = stats?.totalCalls
    ? Math.round((stats.completedCalls / stats.totalCalls) * 100)
    : 0

  // Extract daily data for sparklines
  const callsByDayData = stats?.callsByDay
    ? Object.values(stats.callsByDay)
    : []
  const durationByDayData = stats?.durationByDay
    ? Object.values(stats.durationByDay)
    : []

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Chiamate Totali"
          value={stats?.totalCalls || 0}
          subtitle="Ultime 100 chiamate"
          icon={Phone}
          colorClass="from-primary/20 to-primary/5"
          sparklineData={callsByDayData}
          sparklineColor="primary"
          href="/calls"
        />
        <MetricCard
          title="Completate"
          value={stats?.completedCalls || 0}
          subtitle="Tasso completamento"
          icon={CheckCircle}
          trend={`${completionRate}%`}
          trendUp={completionRate > 70}
          colorClass="from-success/20 to-success/5"
          sparklineData={durationByDayData}
          sparklineColor="success"
          href="/calls"
        />
        <MetricCard
          title="Richiami in Attesa"
          value={stats?.pendingCallbacks || 0}
          subtitle="Da gestire"
          icon={PhoneCall}
          colorClass="from-warning/20 to-warning/5"
          href="/callbacks"
        />
        <MetricCard
          title="Messaggi Non Letti"
          value={stats?.unreadMessages || 0}
          subtitle="Richiedono attenzione"
          icon={MessageSquare}
          colorClass="from-info/20 to-info/5"
          href="/messages"
        />
      </div>

      {/* Charts and Recent Activity Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Calls Volume Chart */}
        <Card className="col-span-4 card-interactive">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Volume Chiamate
                </CardTitle>
                <CardDescription className="mt-1">
                  Numero di chiamate negli ultimi 7 giorni
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{stats?.totalCalls || 0}</p>
                <p className="text-xs text-muted-foreground">questa settimana</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.callsByDay && (
              <ChartContainer
                config={{
                  calls: { label: "Chiamate", color: "hsl(var(--primary))" },
                }}
                className="h-[220px] w-full chart-container"
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
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
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
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <Bar
                      dataKey="calls"
                      fill="url(#barGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card className="col-span-3 card-interactive">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Chiamate Recenti
                </CardTitle>
                <CardDescription className="mt-1">
                  Ultime {recentCalls?.length || 0} chiamate
                </CardDescription>
              </div>
              <Link to="/calls">
                <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary">
                  Vedi tutte
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {callsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner h-6 w-6" />
              </div>
            ) : recentCalls && recentCalls.length > 0 ? (
              <div className="space-y-2">
                {recentCalls.slice(0, 5).map((call, index) => (
                  <Link
                    key={call.id}
                    to={`/calls/${call.callSid}`}
                    className={cn(
                      "flex items-center gap-4 p-3 -mx-1 rounded-xl transition-all duration-200 group",
                      "hover:bg-muted/50 hover:shadow-sm",
                      "animate-fade-in-up",
                    )}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center transition-all duration-200 group-hover:from-primary/20 group-hover:to-primary/10">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      {call.status === "in-progress" && (
                        <span className="absolute -top-0.5 -right-0.5 status-dot status-dot-success" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {call.from}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(call.startedAt)}
                        {call.duration && call.duration > 0 && (
                          <span className="text-muted-foreground/60">
                            ({formatDuration(call.duration)})
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-medium",
                        call.status === "completed" ? "badge-success" :
                        call.status === "transferred" ? "badge-info" :
                        "badge-warning"
                      )}
                    >
                      {call.status === "completed" ? "OK" :
                       call.status === "transferred" ? "Trasf." :
                       call.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 animate-fade-in">
                <Illustration
                  name="empty-dashboard"
                  alt="Nessuna chiamata recente"
                  width={160}
                  className="mx-auto mb-4 opacity-80"
                />
                <p className="text-sm font-medium text-muted-foreground">Nessuna chiamata recente</p>
                <p className="text-xs text-muted-foreground/70 mt-1">In attesa delle prime chiamate...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Duration Chart Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Duration Chart */}
        <Card className="col-span-4 card-interactive">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-success" />
                  Tempo Totale Chiamate
                </CardTitle>
                <CardDescription className="mt-1">
                  Minuti di conversazione per giorno
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{stats?.totalMinutes || 0}</p>
                <p className="text-xs text-muted-foreground">minuti totali</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.durationByDay && (
              <ChartContainer
                config={{
                  minutes: { label: "Minuti", color: "hsl(var(--success))" },
                }}
                className="h-[220px] w-full chart-container"
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
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
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
                            minutes: { label: "Minuti", color: "hsl(var(--success))" },
                          }}
                        />
                      )}
                    />
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="hsl(var(--success))"
                      fill="url(#areaGradient)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="col-span-3 card-interactive">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Riepilogo
            </CardTitle>
            <CardDescription>
              Metriche principali
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Completion Rate */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-success/5 border border-success/10">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tasso Completamento</p>
                <p className="text-2xl font-bold text-success">{completionRate}%</p>
              </div>
            </div>

            {/* Avg Duration */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-info/5 border border-info/10">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-info/20 to-info/5 flex items-center justify-center">
                <Clock className="h-6 w-6 text-info" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Durata Media</p>
                <p className="text-2xl font-bold">{formatDuration(stats?.avgDuration || 0)}</p>
              </div>
            </div>

            {/* Items to Handle */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-warning/5 border border-warning/10">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Da Gestire</p>
                <p className="text-2xl font-bold">
                  {(stats?.pendingCallbacks || 0) + (stats?.unreadMessages || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link to="/calls">
          <Button variant="outline" size="sm" className="gap-1.5 group">
            <Phone className="h-3.5 w-3.5" />
            Vedi tutte le chiamate
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Button>
        </Link>
        <Link to="/callbacks">
          <Button variant="outline" size="sm" className="gap-1.5 group">
            <PhoneCall className="h-3.5 w-3.5" />
            Gestisci richiami
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Button>
        </Link>
        <Link to="/messages">
          <Button variant="outline" size="sm" className="gap-1.5 group">
            <MessageSquare className="h-3.5 w-3.5" />
            Leggi messaggi
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

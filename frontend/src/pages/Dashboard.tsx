import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getStats, getCalls, type Stats, type Call } from "@/lib/api"
import { Phone, PhoneCall, MessageSquare, Clock, CheckCircle, TrendingUp, ArrowUpRight, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"



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
        {/* Overview Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Panoramica</CardTitle>
            <CardDescription>
              Volume chiamate ultimi 7 giorni
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {stats?.callsByDay && (
              <div className="flex items-end gap-2 h-[200px] px-4">
                {Object.entries(stats.callsByDay).map(([date, count]) => {
                  const maxCount = Math.max(...Object.values(stats.callsByDay), 1)
                  const height = (count / maxCount) * 100
                  const day = new Date(date).toLocaleDateString("it-IT", { weekday: "short" })
                  const dayNum = new Date(date).getDate()
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-[160px]">
                        <span className="text-xs font-medium mb-1">{count}</span>
                        <div
                          className="w-full max-w-[40px] bg-primary rounded-md transition-all"
                          style={{ height: `${Math.max(height, 8)}%` }}
                        />
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground capitalize block">{day}</span>
                        <span className="text-xs text-muted-foreground">{dayNum}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
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

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasso Completamento</CardDescription>
            <CardTitle className="text-4xl">{completionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-600">Buono</span> rispetto alla media
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Durata Media</CardDescription>
            <CardTitle className="text-4xl">{formatDuration(stats?.avgDuration || 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Per chiamata completata
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Da Gestire</CardDescription>
            <CardTitle className="text-4xl">
              {(stats?.pendingCallbacks || 0) + (stats?.unreadMessages || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Richiami + messaggi in sospeso
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

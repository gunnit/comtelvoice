import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCallbacks, markCallbackComplete, cancelCallback, type Callback } from "@/lib/api"
import { PhoneCall, Clock, User, AlertCircle, AlertTriangle, Check, X, Filter, Activity, ChevronLeft, ChevronRight } from "lucide-react"
import { Illustration } from "@/components/Illustration"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 10

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatPhone(phone: string): string {
  if (!phone) return "N/D"
  const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "")

  if (cleaned.startsWith("+39") && cleaned.length === 13) {
    return `+39 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
  }
  if (cleaned.startsWith("+39") && cleaned.length >= 12) {
    return `+39 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`
  }
  if (cleaned.startsWith("+")) {
    return cleaned
  }
  if (cleaned.startsWith("3") && cleaned.length === 10) {
    return `+39 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  if (/^\d+$/.test(cleaned) && cleaned.length >= 6) {
    return cleaned.replace(/(\d{3})(\d{3})(\d+)/, "$1 $2 $3")
  }
  return phone
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    "pending": "In attesa",
    "scheduled": "Programmato",
    "completed": "Completato",
    "cancelled": "Annullato",
  }
  return translations[status] || status
}

function translatePriority(priority: string): string {
  const translations: Record<string, string> = {
    "urgent": "Urgente",
    "high": "Alta",
    "normal": "Normale",
    "low": "Bassa",
  }
  return translations[priority] || priority
}

function isOverdue(callback: Callback): boolean {
  if (callback.status !== "pending") return false

  const createdDate = new Date(callback.createdAt)
  const now = new Date()
  const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceCreation > 3) return true

  if (callback.scheduledFor) {
    const scheduledDate = new Date(callback.scheduledFor)
    return scheduledDate < now
  }

  const preferredTime = callback.preferredTime?.toLowerCase() || ""

  const dateMatch = preferredTime.match(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})/)
  if (dateMatch) {
    const months: Record<string, number> = {
      gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5,
      luglio: 6, agosto: 7, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11
    }
    const day = parseInt(dateMatch[1])
    const month = months[dateMatch[2]]
    const year = parseInt(dateMatch[3])
    const preferredDate = new Date(year, month, day)
    return preferredDate < now
  }

  return false
}

const statusFilters = [
  { value: "", label: "Tutti", icon: PhoneCall },
  { value: "pending", label: "In Attesa", color: "warning" },
  { value: "scheduled", label: "Programmati", color: "info" },
  { value: "completed", label: "Completati", color: "success" },
  { value: "cancelled", label: "Annullati", color: "destructive" },
]

function getStatusBadgeClass(status: string, overdue?: boolean): string {
  if (overdue) return "badge-destructive"
  switch (status) {
    case "completed":
      return "badge-success"
    case "pending":
      return "badge-warning"
    case "scheduled":
      return "badge-info"
    case "cancelled":
      return "badge-destructive"
    default:
      return ""
  }
}

function getPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case "urgent":
      return "badge-destructive"
    case "high":
      return "badge-warning"
    default:
      return ""
  }
}

// Loading skeleton
function CallbacksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-8 w-24 rounded-lg" />
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="skeleton h-6 w-48 rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 border border-border/30 rounded-xl">
              <div className="skeleton h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
                <div className="skeleton h-16 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function Callbacks() {
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: callbacks, isLoading, error } = useQuery<Callback[]>({
    queryKey: ["callbacks", statusFilter],
    queryFn: () => getCallbacks(statusFilter || undefined, 100),
  })

  const markCompletedMutation = useMutation({
    mutationFn: (referenceNumber: string) => markCallbackComplete(referenceNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callbacks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (referenceNumber: string) => cancelCallback(referenceNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callbacks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })

  if (isLoading) {
    return <CallbacksSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="p-4 rounded-2xl bg-destructive/10">
          <Activity className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Impossibile caricare i richiami</p>
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

  const overdueCount = callbacks?.filter(isOverdue).length || 0
  const totalPages = Math.ceil((callbacks?.length || 0) / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const paginatedCallbacks = callbacks?.slice(startIndex, startIndex + ITEMS_PER_PAGE) || []

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Overdue Warning */}
      {overdueCount > 0 && (
        <Card className="border-destructive/50 bg-gradient-to-r from-destructive/10 to-destructive/5 animate-fade-in">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-xl bg-destructive/20">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive">
                {overdueCount} richiamo/i in ritardo
              </p>
              <p className="text-sm text-destructive/80">
                Questi richiami sono in attesa da più del tempo previsto
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Filter className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(filter.value)}
                className={cn(
                  "transition-all duration-200",
                  statusFilter === filter.value && "shadow-glow"
                )}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <PhoneCall className="h-4 w-4" />
          <span className="font-medium">{callbacks?.length || 0}</span> richiami
        </div>
      </div>

      {/* Callbacks List */}
      <Card className="card-interactive">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <PhoneCall className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Richieste di Richiamo</CardTitle>
              <CardDescription>
                Gestisci le richieste di richiamo dai chiamanti
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedCallbacks.length > 0 ? (
            <>
              <div className="divide-y divide-border/30">
                {paginatedCallbacks.map((callback, index) => {
                  const overdue = isOverdue(callback)
                  return (
                    <div
                      key={callback.id}
                      className={cn(
                        "p-5 transition-all duration-200 hover:bg-muted/30 animate-fade-in-up",
                        overdue && "bg-destructive/5",
                        callback.priority === "urgent" && !overdue && "bg-warning/5"
                      )}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className={cn(
                            "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                            overdue
                              ? "bg-gradient-to-br from-destructive/20 to-destructive/10"
                              : callback.priority === "urgent"
                                ? "bg-gradient-to-br from-warning/20 to-warning/10"
                                : "bg-gradient-to-br from-primary/10 to-primary/5"
                          )}>
                            {overdue ? (
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                            ) : (
                              <PhoneCall className={cn(
                                "h-5 w-5",
                                callback.priority === "urgent" ? "text-warning" : "text-primary"
                              )} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{callback.callerName || "Nome non disponibile"}</span>
                              {callback.priority === "urgent" && (
                                <AlertCircle className="h-4 w-4 text-warning" />
                              )}
                              {overdue && (
                                <Badge className="badge-destructive text-xs">In ritardo</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {formatPhone(callback.callerPhone)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          {callback.priority !== "normal" && (
                            <Badge className={getPriorityBadgeClass(callback.priority)}>
                              {translatePriority(callback.priority)}
                            </Badge>
                          )}
                          <Badge className={getStatusBadgeClass(callback.status, overdue)}>
                            {translateStatus(callback.status)}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 ml-15 space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">Orario preferito:</span>
                          <span className={cn(
                            "font-medium",
                            overdue && "text-destructive"
                          )}>
                            {callback.preferredTime}
                          </span>
                        </div>

                        {callback.reason && (
                          <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
                            <p className="text-sm">{callback.reason}</p>
                          </div>
                        )}

                        {callback.assignedTo && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Assegnato a:</span>
                            <span className="font-medium">{callback.assignedTo}</span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/30">
                          <div className="text-xs text-muted-foreground space-x-4">
                            <span className="font-mono bg-muted/50 px-2 py-0.5 rounded">
                              {callback.referenceNumber}
                            </span>
                            <span>{formatDate(callback.createdAt)}</span>
                          </div>

                          {callback.status === "pending" && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markCompletedMutation.mutate(callback.referenceNumber)}
                                disabled={markCompletedMutation.isPending}
                                className="text-success border-success/30 hover:bg-success/10 gap-1"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Completato
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelMutation.mutate(callback.referenceNumber)}
                                disabled={cancelMutation.isPending}
                                className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                              >
                                <X className="h-3.5 w-3.5" />
                                Annulla
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-border/30">
                  <p className="text-sm text-muted-foreground">
                    Pagina <span className="font-semibold text-foreground">{page}</span> di{" "}
                    <span className="font-semibold text-foreground">{totalPages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Precedente</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="gap-1"
                    >
                      <span className="hidden sm:inline">Successiva</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <Illustration
                name="empty-callbacks"
                alt="Nessuna richiesta di richiamo"
                width={200}
                className="mx-auto mb-6 opacity-80"
              />
              <p className="text-lg font-medium text-muted-foreground">
                {statusFilter
                  ? `Nessun richiamo con stato "${statusFilters.find(f => f.value === statusFilter)?.label}"`
                  : "Nessuna richiesta di richiamo"
                }
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                I richiami appariranno qui quando i chiamanti richiederanno di essere ricontattati
              </p>
              {statusFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleFilterChange("")}
                >
                  Mostra tutti i richiami
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

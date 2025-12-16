import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCallbacks, markCallbackComplete, cancelCallback, type Callback } from "@/lib/api"
import { PhoneCall, Clock, User, AlertCircle, AlertTriangle, Check, X, Filter } from "lucide-react"

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
  { value: "", label: "Tutti" },
  { value: "pending", label: "In Attesa" },
  { value: "scheduled", label: "Programmati" },
  { value: "completed", label: "Completati" },
  { value: "cancelled", label: "Annullati" },
]

export function Callbacks() {
  const [statusFilter, setStatusFilter] = useState("")
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Impossibile caricare i richiami</p>
        <p className="text-sm text-muted-foreground mt-2">
          Assicurati che il backend sia in esecuzione
        </p>
      </div>
    )
  }

  const overdueCount = callbacks?.filter(isOverdue).length || 0

  return (
    <div className="space-y-6">
      {/* Overdue Warning */}
      {overdueCount > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">
                {overdueCount} richiamo/i in ritardo
              </p>
              <p className="text-sm text-destructive/80">
                Questi richiami sono in attesa da più del tempo previsto
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtra:</span>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {callbacks?.length || 0} richiami
        </p>
      </div>

      {/* Callbacks List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Richieste di Richiamo</CardTitle>
          <CardDescription>
            Gestisci le richieste di richiamo dai chiamanti
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {callbacks && callbacks.length > 0 ? (
            <div className="divide-y">
              {callbacks.map((callback) => {
                const overdue = isOverdue(callback)
                return (
                  <div
                    key={callback.id}
                    className={`p-4 ${
                      overdue ? "bg-destructive/5" : callback.priority === "urgent" ? "bg-amber-50 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          overdue ? "bg-destructive/10" : callback.priority === "urgent" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"
                        }`}>
                          {overdue ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          ) : (
                            <PhoneCall className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{callback.callerName || "Nome non disponibile"}</span>
                            {callback.priority === "urgent" && (
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            )}
                            {overdue && (
                              <Badge variant="destructive" className="text-xs">In ritardo</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatPhone(callback.callerPhone)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {callback.priority !== "normal" && (
                          <Badge
                            variant={
                              callback.priority === "urgent"
                                ? "destructive"
                                : callback.priority === "high"
                                ? "outline"
                                : "secondary"
                            }
                            className={callback.priority === "high" ? "border-amber-500 text-amber-600" : ""}
                          >
                            {translatePriority(callback.priority)}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            callback.status === "completed"
                              ? "outline"
                              : callback.status === "pending"
                              ? overdue ? "destructive" : "secondary"
                              : callback.status === "cancelled"
                              ? "secondary"
                              : "outline"
                          }
                          className={callback.status === "completed" ? "border-emerald-500 text-emerald-600" : ""}
                        >
                          {translateStatus(callback.status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 ml-13 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Orario preferito:</span>
                        <span className={overdue ? "text-destructive font-medium" : ""}>
                          {callback.preferredTime}
                        </span>
                      </div>

                      {callback.reason && (
                        <p className="text-sm p-3 bg-muted rounded-lg">
                          {callback.reason}
                        </p>
                      )}

                      {callback.assignedTo && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Assegnato a:</span>
                          <span>{callback.assignedTo}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t">
                        <div className="text-xs text-muted-foreground">
                          <span className="mr-4">Rif: {callback.referenceNumber}</span>
                          <span>Creato: {formatDate(callback.createdAt)}</span>
                        </div>

                        {callback.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markCompletedMutation.mutate(callback.referenceNumber)}
                              disabled={markCompletedMutation.isPending}
                              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Completato
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelMutation.mutate(callback.referenceNumber)}
                              disabled={cancelMutation.isPending}
                              className="text-destructive border-destructive/30 hover:bg-destructive/5"
                            >
                              <X className="h-3 w-3 mr-1" />
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
          ) : (
            <div className="text-center py-12">
              <PhoneCall className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">
                {statusFilter
                  ? `Nessun richiamo con stato "${statusFilters.find(f => f.value === statusFilter)?.label}"`
                  : "Nessun richiamo registrato"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

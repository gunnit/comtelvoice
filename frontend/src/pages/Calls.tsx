import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCalls, type Call } from "@/lib/api"
import { Phone, Clock, ChevronLeft, ChevronRight, ArrowUpRight, Filter } from "lucide-react"

const ITEMS_PER_PAGE = 15

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "-"
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatPhone(phone: string): string {
  if (!phone) return ""
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
  return phone
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    "completed": "Completata",
    "in-progress": "In corso",
    "transferred": "Trasferita",
    "failed": "Fallita",
    "busy": "Occupato",
    "no-answer": "Nessuna risposta",
  }
  return translations[status] || status
}

const statusFilters = [
  { value: "", label: "Tutte" },
  { value: "completed", label: "Completate" },
  { value: "transferred", label: "Trasferite" },
  { value: "in-progress", label: "In Corso" },
  { value: "failed", label: "Fallite" },
]

export function Calls() {
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)

  const { data: calls, isLoading, error } = useQuery<Call[]>({
    queryKey: ["calls", 100],
    queryFn: () => getCalls(100),
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
        <p className="text-destructive">Impossibile caricare le chiamate</p>
        <p className="text-sm text-muted-foreground mt-2">
          Assicurati che il backend sia in esecuzione
        </p>
      </div>
    )
  }

  const filteredCalls = calls?.filter(call => {
    if (!statusFilter) return true
    return call.status === statusFilter
  }) || []

  const totalPages = Math.ceil(filteredCalls.length / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const paginatedCalls = filteredCalls.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter)
    setPage(1)
  }

  return (
    <div className="space-y-6">
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
                onClick={() => handleFilterChange(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredCalls.length} chiamate
        </p>
      </div>

      {/* Calls Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Storico Chiamate</CardTitle>
          <CardDescription>
            Tutte le chiamate al voice agent
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedCalls.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th>Numero</th>
                      <th>Data/Ora</th>
                      <th>Durata</th>
                      <th>Stato</th>
                      <th className="text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCalls.map((call) => (
                      <tr key={call.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="font-medium">{formatPhone(call.from)}</span>
                          </div>
                        </td>
                        <td className="text-muted-foreground">
                          {formatDate(call.startedAt)}
                        </td>
                        <td>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDuration(call.duration || 0)}
                          </div>
                        </td>
                        <td>
                          <Badge
                            variant={
                              call.status === "completed" || call.status === "transferred"
                                ? "outline"
                                : call.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className={
                              call.status === "completed"
                                ? "border-emerald-500 text-emerald-600"
                                : call.status === "transferred"
                                  ? "border-blue-500 text-blue-600"
                                  : ""
                            }
                          >
                            {translateStatus(call.status)}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <Link
                            to={`/calls/${call.callSid}`}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                          >
                            Dettagli
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden divide-y">
                {paginatedCalls.map((call) => (
                  <Link
                    key={call.id}
                    to={`/calls/${call.callSid}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{formatPhone(call.from)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(call.startedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          call.status === "completed" || call.status === "transferred"
                            ? "outline"
                            : call.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                        className={
                          call.status === "completed"
                            ? "border-emerald-500 text-emerald-600"
                            : call.status === "transferred"
                              ? "border-blue-500 text-blue-600"
                              : ""
                        }
                      >
                        {translateStatus(call.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Pagina {page} di {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Precedente
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Successiva
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">
                {statusFilter
                  ? `Nessuna chiamata con stato "${statusFilters.find(f => f.value === statusFilter)?.label}"`
                  : "Nessuna chiamata registrata"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

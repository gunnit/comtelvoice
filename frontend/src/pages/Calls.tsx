import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCalls, type Call } from "@/lib/api"
import { Phone, Clock, ChevronLeft, ChevronRight, ArrowUpRight, Filter, Activity, PhoneIncoming, ArrowUpDown, ArrowUp, ArrowDown, Eye, ExternalLink } from "lucide-react"
import { Illustration } from "@/components/Illustration"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 15

// Sort configuration type
type SortField = "from" | "startedAt" | "duration" | "status"
type SortDirection = "asc" | "desc"

interface SortConfig {
  field: SortField
  direction: SortDirection
}

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
  { value: "", label: "Tutte", icon: Phone },
  { value: "completed", label: "Completate", color: "success" },
  { value: "transferred", label: "Trasferite", color: "info" },
  { value: "in-progress", label: "In Corso", color: "warning" },
  { value: "failed", label: "Fallite", color: "destructive" },
]

// Loading skeleton
function CallsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-8 w-24 rounded-lg" />
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="skeleton h-6 w-40 rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
              <div className="skeleton h-6 w-20 rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// Sortable column header component
function SortableHeader({
  label,
  field,
  sortConfig,
  onSort
}: {
  label: string
  field: SortField
  sortConfig: SortConfig | null
  onSort: (field: SortField) => void
}) {
  const isActive = sortConfig?.field === field
  const direction = sortConfig?.direction

  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider transition-colors group",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
      aria-label={`Ordina per ${label}`}
    >
      {label}
      <span className="flex flex-col">
        {isActive ? (
          direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </span>
    </button>
  )
}

export function Calls() {
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    field: "startedAt",
    direction: "desc"
  })

  const { data: calls, isLoading, error } = useQuery<Call[]>({
    queryKey: ["calls", 100],
    queryFn: () => getCalls(100),
  })

  // Handle sort
  const handleSort = (field: SortField) => {
    setSortConfig(prev => {
      if (prev?.field === field) {
        return { field, direction: prev.direction === "asc" ? "desc" : "asc" }
      }
      return { field, direction: "desc" }
    })
    setPage(1)
  }

  // Sort and filter calls
  const processedCalls = useMemo(() => {
    let result = calls?.filter(call => {
      if (!statusFilter) return true
      return call.status === statusFilter
    }) || []

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        let comparison = 0

        switch (sortConfig.field) {
          case "from":
            comparison = a.from.localeCompare(b.from)
            break
          case "startedAt":
            comparison = new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
            break
          case "duration":
            comparison = (a.duration || 0) - (b.duration || 0)
            break
          case "status":
            comparison = a.status.localeCompare(b.status)
            break
        }

        return sortConfig.direction === "asc" ? comparison : -comparison
      })
    }

    return result
  }, [calls, statusFilter, sortConfig])

  if (isLoading) {
    return <CallsSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="p-4 rounded-2xl bg-destructive/10">
          <Activity className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Impossibile caricare le chiamate</p>
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

  const totalPages = Math.ceil(processedCalls.length / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const paginatedCalls = processedCalls.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter)
    setPage(1)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "badge-success"
      case "transferred":
        return "badge-info"
      case "in-progress":
        return "badge-warning"
      case "failed":
        return "badge-destructive"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
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
          <PhoneIncoming className="h-4 w-4" />
          <span className="font-medium">{processedCalls.length}</span> chiamate
          {sortConfig && (
            <span className="hidden sm:inline text-xs">
              (ordinate per {sortConfig.field === 'startedAt' ? 'data' : sortConfig.field === 'from' ? 'numero' : sortConfig.field === 'duration' ? 'durata' : 'stato'})
            </span>
          )}
        </div>
      </div>

      {/* Calls Table */}
      <Card className="card-interactive">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Storico Chiamate</CardTitle>
              <CardDescription>
                Tutte le chiamate al voice agent
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedCalls.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>
                        <SortableHeader
                          label="Numero"
                          field="from"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </th>
                      <th>
                        <SortableHeader
                          label="Data/Ora"
                          field="startedAt"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </th>
                      <th>
                        <SortableHeader
                          label="Durata"
                          field="duration"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </th>
                      <th>
                        <SortableHeader
                          label="Stato"
                          field="status"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCalls.map((call, index) => (
                      <tr
                        key={call.id}
                        className="animate-fade-in-up group/row"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover/row:from-primary/20 group-hover/row:to-primary/10 transition-colors">
                              <Phone className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-semibold group-hover/row:text-primary transition-colors">{formatPhone(call.from)}</span>
                          </div>
                        </td>
                        <td className="text-muted-foreground">
                          {formatDate(call.startedAt)}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-medium">{formatDuration(call.duration || 0)}</span>
                          </div>
                        </td>
                        <td>
                          <Badge className={getStatusBadgeClass(call.status)}>
                            {translateStatus(call.status)}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            {/* Quick View Button */}
                            <Link to={`/calls/${call.callSid}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                aria-label="Visualizza dettagli"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {/* Open in New Tab */}
                            <Link to={`/calls/${call.callSid}`} target="_blank">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                aria-label="Apri in nuova scheda"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                            {/* Main CTA */}
                            <Link to={`/calls/${call.callSid}`}>
                              <Button variant="ghost" size="sm" className="gap-1 group">
                                Dettagli
                                <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden divide-y divide-border/30">
                {paginatedCalls.map((call, index) => (
                  <Link
                    key={call.id}
                    to={`/calls/${call.callSid}`}
                    className={cn(
                      "flex items-center justify-between p-4 transition-all duration-200 group",
                      "hover:bg-muted/50",
                      "animate-fade-in-up"
                    )}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:from-primary/20 group-hover:to-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate group-hover:text-primary transition-colors">
                          {formatPhone(call.from)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDate(call.startedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={getStatusBadgeClass(call.status)}>
                        {translateStatus(call.status)}
                      </Badge>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
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
                name="empty-calls"
                alt="Nessuna chiamata"
                width={200}
                className="mx-auto mb-6 opacity-80"
              />
              <p className="text-lg font-medium text-muted-foreground">
                {statusFilter
                  ? `Nessuna chiamata ${statusFilters.find(f => f.value === statusFilter)?.label.toLowerCase()}`
                  : "Nessuna chiamata registrata"
                }
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Le chiamate appariranno qui quando verranno ricevute
              </p>
              {statusFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleFilterChange("")}
                >
                  Mostra tutte le chiamate
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

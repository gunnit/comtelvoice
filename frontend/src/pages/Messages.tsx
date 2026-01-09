import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getMessages, markMessageRead, type Message } from "@/lib/api"
import { MessageSquare, AlertTriangle, User, Check, Mail, MailOpen, Filter, Activity, ChevronLeft, ChevronRight } from "lucide-react"
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
  if (/^\d+$/.test(cleaned) && cleaned.length >= 6) {
    return cleaned.replace(/(\d{2})(\d{4})(\d+)/, "$1 $2 $3")
  }
  return phone
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    "unread": "Non letto",
    "read": "Letto",
    "forwarded": "Inoltrato",
  }
  return translations[status] || status
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "read":
      return "badge-success"
    case "unread":
      return "badge-warning"
    case "forwarded":
      return "badge-info"
    default:
      return ""
  }
}

const statusFilters = [
  { value: "", label: "Tutti", icon: MessageSquare },
  { value: "unread", label: "Non Letti", color: "warning" },
  { value: "urgent", label: "Urgenti", color: "destructive" },
]

// Loading skeleton
function MessagesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-8 w-24 rounded-lg" />
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="skeleton h-6 w-40 rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 border border-border/30 rounded-xl">
              <div className="skeleton h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
                <div className="skeleton h-20 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function Messages() {
  const [statusFilter, setStatusFilter] = useState("unread")
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: messages, isLoading, error } = useQuery<Message[]>({
    queryKey: ["messages", statusFilter],
    queryFn: () => getMessages(statusFilter || undefined, undefined, 100),
  })

  const markAsReadMutation = useMutation({
    mutationFn: (referenceNumber: string) => markMessageRead(referenceNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })

  if (isLoading) {
    return <MessagesSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="p-4 rounded-2xl bg-destructive/10">
          <Activity className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Impossibile caricare i messaggi</p>
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

  const totalPages = Math.ceil((messages?.length || 0) / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const paginatedMessages = messages?.slice(startIndex, startIndex + ITEMS_PER_PAGE) || []

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter)
    setPage(1)
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
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium">{messages?.length || 0}</span> messaggi
        </div>
      </div>

      {/* Messages List */}
      <Card className="card-interactive">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Messaggi</CardTitle>
              <CardDescription>
                Messaggi lasciati per i dipendenti
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedMessages.length > 0 ? (
            <>
              <div className="divide-y divide-border/30">
                {paginatedMessages.map((message, index) => (
                  <div
                    key={message.id}
                    className={cn(
                      "p-5 transition-all duration-200 hover:bg-muted/30 animate-fade-in-up",
                      message.urgent && "bg-destructive/5",
                      message.status === "unread" && !message.urgent && "bg-primary/5"
                    )}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className={cn(
                          "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                          message.urgent
                            ? "bg-gradient-to-br from-destructive/20 to-destructive/10"
                            : message.status === "unread"
                              ? "bg-gradient-to-br from-primary/20 to-primary/10"
                              : "bg-gradient-to-br from-muted to-muted/50"
                        )}>
                          {message.urgent ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          ) : message.status === "unread" ? (
                            <Mail className="h-5 w-5 text-primary" />
                          ) : (
                            <MailOpen className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-semibold">Per: {message.recipientName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap mt-0.5">
                            <span>Da: {message.callerName}</span>
                            <span className="hidden sm:inline">({formatPhone(message.callerPhone)})</span>
                          </div>
                          <span className="sm:hidden text-sm text-muted-foreground">{formatPhone(message.callerPhone)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {message.urgent && (
                          <Badge className="badge-destructive">Urgente</Badge>
                        )}
                        <Badge className={getStatusBadgeClass(message.status)}>
                          {translateStatus(message.status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 ml-15">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>

                      {message.forwardedTo && (
                        <p className="text-sm text-muted-foreground mt-3">
                          Inoltrato a: <span className="font-medium">{message.forwardedTo}</span>
                        </p>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-border/30">
                        <div className="text-xs text-muted-foreground space-x-4">
                          <span className="font-mono bg-muted/50 px-2 py-0.5 rounded">
                            {message.referenceNumber}
                          </span>
                          <span>{formatDate(message.createdAt)}</span>
                        </div>

                        {message.status === "unread" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(message.referenceNumber)}
                            disabled={markAsReadMutation.isPending}
                            className="text-success border-success/30 hover:bg-success/10 gap-1"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Segna come letto
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
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
                name="empty-messages"
                alt="Nessun messaggio"
                width={200}
                className="mx-auto mb-6 opacity-80"
              />
              <p className="text-lg font-medium text-muted-foreground">
                {statusFilter === "unread"
                  ? "Nessun messaggio non letto"
                  : statusFilter === "urgent"
                    ? "Nessun messaggio urgente"
                    : "Nessun messaggio trovato"
                }
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                I messaggi per i dipendenti appariranno qui
              </p>
              {statusFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleFilterChange("")}
                >
                  Mostra tutti i messaggi
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

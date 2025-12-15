import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getMessages, type Message } from "@/lib/api"
import { MessageSquare, AlertTriangle, User, Check, Mail, MailOpen, Filter } from "lucide-react"

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

const statusFilters = [
  { value: "", label: "Tutti" },
  { value: "unread", label: "Non Letti" },
  { value: "urgent", label: "Urgenti" },
]

export function Messages() {
  const [statusFilter, setStatusFilter] = useState("unread")
  const queryClient = useQueryClient()

  const { data: messages, isLoading, error } = useQuery<Message[]>({
    queryKey: ["messages", statusFilter],
    queryFn: () => getMessages(statusFilter || undefined, undefined, 100),
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      console.log(`Marking message ${messageId} as read`)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] })
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
        <p className="text-destructive">Impossibile caricare i messaggi</p>
        <p className="text-sm text-muted-foreground mt-2">
          Assicurati che il backend sia in esecuzione
        </p>
      </div>
    )
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
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {messages?.length || 0} messaggi
        </p>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Messaggi</CardTitle>
          <CardDescription>
            Messaggi lasciati per i dipendenti
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {messages && messages.length > 0 ? (
            <div className="divide-y">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 ${
                    message.urgent ? "bg-destructive/5" : message.status === "unread" ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          message.urgent ? "bg-destructive/10" : message.status === "unread" ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
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
                          <User className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium">Per: {message.recipientName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          <span>Da: {message.callerName}</span>
                          <span className="hidden sm:inline">({formatPhone(message.callerPhone)})</span>
                        </div>
                        <span className="sm:hidden text-sm text-muted-foreground">{formatPhone(message.callerPhone)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {message.urgent && (
                        <Badge variant="destructive">Urgente</Badge>
                      )}
                      <Badge
                        variant={
                          message.status === "unread"
                            ? "secondary"
                            : message.status === "read"
                            ? "outline"
                            : message.status === "forwarded"
                            ? "secondary"
                            : "outline"
                        }
                        className={message.status === "read" ? "border-emerald-500 text-emerald-600" : ""}
                      >
                        {translateStatus(message.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 ml-13">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                      <p className="text-sm">{message.content}</p>
                    </div>

                    {message.forwardedTo && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Inoltrato a: {message.forwardedTo}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 mt-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        <span className="mr-4">Rif: {message.referenceNumber}</span>
                        <span>Creato: {formatDate(message.createdAt)}</span>
                      </div>

                      {message.status === "unread" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsReadMutation.mutate(message.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Segna come letto
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">
                {statusFilter === "unread"
                  ? "Nessun messaggio non letto"
                  : statusFilter === "urgent"
                  ? "Nessun messaggio urgente"
                  : "Nessun messaggio trovato"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

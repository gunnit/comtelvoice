import { useQuery } from "@tanstack/react-query"
import { useParams, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCall, type CallDetail as CallDetailType } from "@/lib/api"
import { ArrowLeft, Phone, Clock, User, Bot, MessageSquare, PhoneCall, Calendar, PhoneIncoming } from "lucide-react"

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "N/D"
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
    second: "2-digit",
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
  return phone
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    "completed": "Completata",
    "in-progress": "In Corso",
    "failed": "Fallita",
    "busy": "Occupato",
    "no-answer": "Nessuna Risposta",
    "pending": "In Attesa",
    "unread": "Non Letto",
    "read": "Letto",
  }
  return translations[status] || status
}

function shortenCallSid(callSid: string): string {
  if (callSid.length <= 12) return callSid
  return `${callSid.slice(0, 6)}...${callSid.slice(-6)}`
}

export function CallDetail() {
  const { callSid } = useParams<{ callSid: string }>()

  const { data: call, isLoading, error } = useQuery<CallDetailType>({
    queryKey: ["call", callSid],
    queryFn: () => getCall(callSid!),
    enabled: !!callSid,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !call) {
    return (
      <div className="space-y-4">
        <Link to="/calls">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle Chiamate
          </Button>
        </Link>
        <div className="text-center py-8">
          <p className="text-destructive">Impossibile caricare i dettagli della chiamata</p>
        </div>
      </div>
    )
  }

  // Calculate duration from timestamps if not provided
  const calculatedDuration = call.duration || (
    call.endedAt
      ? Math.floor((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
      : null
  )

  // Parse the formatted transcript into lines
  const transcriptLines = call.formattedTranscript
    ? call.formattedTranscript.split("\n").filter((line) => line.trim())
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link to="/calls">
          <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-3">
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Indietro</span>
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dettagli Chiamata</h1>
          <p className="text-muted-foreground text-xs sm:text-sm truncate" title={call.callSid}>
            ID: {shortenCallSid(call.callSid)}
          </p>
        </div>
      </div>

      {/* Call Info */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <PhoneIncoming className="h-3 w-3 sm:h-4 sm:w-4" />
              Da
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <span className="font-medium text-sm sm:text-base break-all">{formatPhone(call.from)}</span>
          </CardContent>
        </Card>

        {call.to && (
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                A
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <span className="font-medium text-sm sm:text-base break-all">{formatPhone(call.to)}</span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Stato</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <Badge
              variant={
                call.status === "completed"
                  ? "outline"
                  : call.status === "failed"
                  ? "destructive"
                  : "secondary"
              }
              className={call.status === "completed" ? "border-emerald-500 text-emerald-600" : ""}
            >
              {translateStatus(call.status)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              Durata
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <span className="font-medium text-sm sm:text-base">
              {formatDuration(calculatedDuration || 0)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              Inizio
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <span className="text-xs sm:text-sm">{formatDate(call.startedAt)}</span>
          </CardContent>
        </Card>

        {call.endedAt && (
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                Fine
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <span className="text-xs sm:text-sm">{formatDate(call.endedAt)}</span>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transcript Stats */}
      {call.transcriptStats && (call.transcriptStats.totalMessages > 0) && (
        <Card>
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Statistiche Conversazione</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-3">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-muted-foreground">Totali</p>
                <p className="text-xl sm:text-2xl font-bold">{call.transcriptStats.totalMessages}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-muted-foreground">Utente</p>
                <p className="text-xl sm:text-2xl font-bold">{call.transcriptStats.userMessages}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-muted-foreground">Agente</p>
                <p className="text-xl sm:text-2xl font-bold">{call.transcriptStats.agentMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>Trascrizione</CardTitle>
          <CardDescription>Trascrizione completa della conversazione</CardDescription>
        </CardHeader>
        <CardContent>
          {transcriptLines.length > 0 ? (
            <div className="space-y-2 sm:space-y-3 max-h-[500px] sm:max-h-[600px] overflow-y-auto scrollbar-hide -mx-2 px-2">
              {transcriptLines.map((line, index) => {
                const isUser = line.includes("[USER]")
                const cleanLine = line
                  .replace(/\[\d{2}:\d{2}:\d{2}\]\s*/, "")
                  .replace(/\[USER\]\s*/, "")
                  .replace(/\[AGENT[^\]]*\]\s*/, "")

                return (
                  <div
                    key={index}
                    className={`flex gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`p-1.5 sm:p-2 rounded-full shrink-0 ${
                        isUser ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      {isUser ? (
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </div>
                    <div
                      className={`p-2 sm:p-3 rounded-lg max-w-[80%] sm:max-w-[85%] ${
                        isUser
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted mr-auto"
                      }`}
                    >
                      <p className="text-xs sm:text-sm break-words">{cleanLine}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nessuna trascrizione disponibile per questa chiamata
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                La trascrizione potrebbe non essere stata registrata o la chiamata era troppo breve
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Callbacks */}
      {call.callbacks && call.callbacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              Richieste di Richiamo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {call.callbacks.map((callback) => (
                <div
                  key={callback.id}
                  className="p-3 rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{callback.callerName}</span>
                    <Badge
                      variant={
                        callback.status === "completed"
                          ? "outline"
                          : callback.status === "pending"
                          ? "secondary"
                          : "secondary"
                      }
                      className={callback.status === "completed" ? "border-emerald-500 text-emerald-600" : ""}
                    >
                      {translateStatus(callback.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatPhone(callback.callerPhone)} - {callback.preferredTime}
                  </p>
                  {callback.reason && (
                    <p className="text-sm mt-1">{callback.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Rif: {callback.referenceNumber}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      {call.messages && call.messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messaggi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {call.messages.map((message) => (
                <div
                  key={message.id}
                  className="p-3 rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Per: {message.recipientName}</span>
                    <div className="flex items-center gap-2">
                      {message.urgent && (
                        <Badge variant="destructive">Urgente</Badge>
                      )}
                      <Badge
                        variant={
                          message.status === "unread"
                            ? "secondary"
                            : message.status === "read"
                            ? "outline"
                            : "secondary"
                        }
                        className={message.status === "read" ? "border-emerald-500 text-emerald-600" : ""}
                      >
                        {translateStatus(message.status)}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm">Da: {message.callerName} ({formatPhone(message.callerPhone)})</p>
                  <p className="text-sm mt-2 p-2 bg-muted rounded">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Rif: {message.referenceNumber}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

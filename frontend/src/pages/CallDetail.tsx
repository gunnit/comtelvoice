import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCall, analyzeCall, type CallDetail as CallDetailType, type CallAnalysis } from "@/lib/api"
import {
  ArrowLeft, Phone, Clock, User, Bot, MessageSquare, PhoneCall, Calendar, PhoneIncoming,
  Brain, RefreshCw, Tag, CheckCircle, FileText, TrendingUp, Search, AlertTriangle, Smile, Meh, Frown, AlertCircle, Activity
} from "lucide-react"
import { cn } from "@/lib/utils"

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
    "transferred": "Trasferita",
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

function getStatusBadgeClass(status: string): string {
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

// Analysis helper functions
function translateSentiment(sentiment: string): string {
  const translations: Record<string, string> = {
    positive: "Positivo",
    neutral: "Neutro",
    negative: "Negativo",
    frustrated: "Frustrato",
  }
  return translations[sentiment] || sentiment
}

function translateIntent(intent: string): string {
  const translations: Record<string, string> = {
    sales_inquiry: "Richiesta Commerciale",
    support: "Supporto Tecnico",
    complaint: "Reclamo",
    info_request: "Richiesta Informazioni",
    callback_request: "Richiesta Richiamata",
    other: "Altro",
  }
  return translations[intent] || intent
}

function translateUrgency(urgency: string): string {
  const translations: Record<string, string> = {
    low: "Bassa",
    medium: "Media",
    high: "Alta",
    critical: "Critica",
  }
  return translations[urgency] || urgency
}

function translateResolution(resolution: string): string {
  const translations: Record<string, string> = {
    resolved: "Risolto",
    needs_followup: "Richiede Follow-up",
    escalated: "Escalato",
    unknown: "Non Determinato",
  }
  return translations[resolution] || resolution
}

function translateLeadScore(score: string): string {
  const translations: Record<string, string> = {
    hot: "Caldo",
    warm: "Tiepido",
    cold: "Freddo",
  }
  return translations[score] || score
}

function getSentimentIcon(sentiment: string) {
  switch (sentiment) {
    case "positive":
      return <Smile className="h-4 w-4 text-success" />
    case "neutral":
      return <Meh className="h-4 w-4 text-warning" />
    case "negative":
      return <Frown className="h-4 w-4 text-warning" />
    case "frustrated":
      return <AlertCircle className="h-4 w-4 text-destructive" />
    default:
      return <Meh className="h-4 w-4 text-muted-foreground" />
  }
}

function getUrgencyBadgeClass(urgency: string): string {
  switch (urgency) {
    case "critical":
    case "high":
      return "badge-destructive"
    case "medium":
      return "badge-warning"
    default:
      return ""
  }
}

function getResolutionBadgeClass(resolution: string): string {
  switch (resolution) {
    case "resolved":
      return "badge-success"
    case "needs_followup":
      return "badge-warning"
    case "escalated":
      return "badge-destructive"
    default:
      return ""
  }
}

function getLeadScoreBadgeClass(score: string): string {
  switch (score) {
    case "hot":
      return "badge-destructive"
    case "warm":
      return "badge-warning"
    default:
      return ""
  }
}

function hasEntities(entities?: CallAnalysis["entities"]): boolean {
  if (!entities) return false
  return (
    entities.names.length > 0 ||
    entities.products.length > 0 ||
    entities.dates.length > 0 ||
    entities.phones.length > 0 ||
    entities.emails.length > 0
  )
}

// Loading skeleton
function CallDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="skeleton h-9 w-24 rounded-lg" />
        <div className="space-y-2">
          <div className="skeleton h-7 w-48 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="skeleton h-4 w-16 rounded" />
            </CardHeader>
            <CardContent>
              <div className="skeleton h-6 w-24 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="skeleton h-6 w-32 rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="skeleton h-8 w-8 rounded-full" />
                <div className="skeleton h-16 flex-1 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Analysis Results Component
function AnalysisResults({ analysis }: { analysis: CallAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-muted/80 to-muted/50 border border-border/30">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Riepilogo
        </h4>
        <p className="text-sm leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Sentiment */}
        <div className="p-4 rounded-xl border border-border/30 bg-card/50">
          <p className="text-xs text-muted-foreground mb-2">Sentiment</p>
          <div className="flex items-center gap-2">
            {getSentimentIcon(analysis.sentimentOverall)}
            <span className="font-semibold text-sm">
              {translateSentiment(analysis.sentimentOverall)}
            </span>
          </div>
          {analysis.sentimentTrend && (
            <p className="text-xs text-muted-foreground mt-1">
              Trend: {analysis.sentimentTrend === "improving" ? "In miglioramento" : analysis.sentimentTrend === "declining" ? "In peggioramento" : "Stabile"}
            </p>
          )}
        </div>

        {/* Intent */}
        <div className="p-4 rounded-xl border border-border/30 bg-card/50">
          <p className="text-xs text-muted-foreground mb-2">Intento</p>
          <p className="font-semibold text-sm">{translateIntent(analysis.primaryIntent)}</p>
        </div>

        {/* Urgency */}
        <div className="p-4 rounded-xl border border-border/30 bg-card/50">
          <p className="text-xs text-muted-foreground mb-2">Urgenza</p>
          <div className="mt-1">
            <Badge className={getUrgencyBadgeClass(analysis.urgencyScore)}>
              {translateUrgency(analysis.urgencyScore)}
            </Badge>
          </div>
          {analysis.urgencyReason && (
            <p className="text-xs text-muted-foreground mt-1 truncate" title={analysis.urgencyReason}>
              {analysis.urgencyReason}
            </p>
          )}
        </div>

        {/* Resolution */}
        <div className="p-4 rounded-xl border border-border/30 bg-card/50">
          <p className="text-xs text-muted-foreground mb-2">Stato</p>
          <div className="mt-1">
            <Badge className={getResolutionBadgeClass(analysis.resolutionStatus)}>
              {translateResolution(analysis.resolutionStatus)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Topic Tags */}
      {analysis.topicTags && analysis.topicTags.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Argomenti
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.topicTags.map((tag) => (
              <Badge key={tag} className="bg-primary/10 text-primary border-primary/20">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Entities */}
      {hasEntities(analysis.entities) && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Entita Estratte
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {analysis.entities?.names && analysis.entities.names.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-xl border border-border/30">
                <span className="text-muted-foreground">Nomi: </span>
                <span className="font-medium">{analysis.entities.names.join(", ")}</span>
              </div>
            )}
            {analysis.entities?.products && analysis.entities.products.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-xl border border-border/30">
                <span className="text-muted-foreground">Prodotti: </span>
                <span className="font-medium">{analysis.entities.products.join(", ")}</span>
              </div>
            )}
            {analysis.entities?.dates && analysis.entities.dates.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-xl border border-border/30">
                <span className="text-muted-foreground">Date: </span>
                <span className="font-medium">{analysis.entities.dates.join(", ")}</span>
              </div>
            )}
            {analysis.entities?.phones && analysis.entities.phones.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-xl border border-border/30">
                <span className="text-muted-foreground">Telefoni: </span>
                <span className="font-medium">{analysis.entities.phones.join(", ")}</span>
              </div>
            )}
            {analysis.entities?.emails && analysis.entities.emails.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-xl border border-border/30">
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium">{analysis.entities.emails.join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Items */}
      {analysis.actionItems && analysis.actionItems.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Azioni da Fare
          </h4>
          <ul className="space-y-2">
            {analysis.actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm p-3 bg-muted/50 rounded-xl border border-border/30">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">{i + 1}</span>
                </div>
                <span className="flex-1">{item.description}</span>
                {item.priority === "high" && (
                  <Badge className="badge-destructive shrink-0">Alta</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lead Score (if present) */}
      {analysis.leadScore && (
        <div className="p-4 rounded-xl border border-border/30 bg-card/50">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Punteggio Lead
          </h4>
          <div className="flex items-center gap-3">
            <Badge className={getLeadScoreBadgeClass(analysis.leadScore)}>
              {translateLeadScore(analysis.leadScore)}
            </Badge>
            {analysis.leadScoreReason && (
              <p className="text-sm text-muted-foreground">{analysis.leadScoreReason}</p>
            )}
          </div>
        </div>
      )}

      {/* FAQ Indicator */}
      {analysis.isFaq && (
        <div className="p-4 rounded-xl border border-warning/30 bg-warning/10">
          <h4 className="font-semibold mb-1 flex items-center gap-2 text-warning">
            <AlertTriangle className="h-4 w-4" />
            Domanda Frequente Rilevata
          </h4>
          {analysis.faqTopic && (
            <p className="text-sm text-warning/80">
              Argomento: {analysis.faqTopic}
            </p>
          )}
          <p className="text-xs text-warning/70 mt-1">
            Questa domanda potrebbe essere automatizzata
          </p>
        </div>
      )}

      {/* Metadata Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/30">
        <span className="font-mono bg-muted/50 px-2 py-0.5 rounded">Modello: {analysis.modelUsed}</span>
        {analysis.processingTimeMs && (
          <span>{analysis.processingTimeMs}ms</span>
        )}
        <span>{formatDate(analysis.createdAt)}</span>
      </div>
    </div>
  )
}

export function CallDetail() {
  const { callSid } = useParams<{ callSid: string }>()
  const queryClient = useQueryClient()

  const { data: call, isLoading, error } = useQuery<CallDetailType>({
    queryKey: ["call", callSid],
    queryFn: () => getCall(callSid!),
    enabled: !!callSid,
  })

  // Mutation for analyzing the call
  const analyzeCallMutation = useMutation({
    mutationFn: () => analyzeCall(callSid!, { model: "gpt-5.1" }),
    onSuccess: (result) => {
      // Update the call data with the new analysis
      queryClient.setQueryData(["call", callSid], (oldData: CallDetailType | undefined) => {
        if (!oldData) return oldData
        return { ...oldData, analysis: result.analysis }
      })
    },
  })

  if (isLoading) {
    return <CallDetailSkeleton />
  }

  if (error || !call) {
    return (
      <div className="space-y-6">
        <Link to="/calls">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Torna alle Chiamate
          </Button>
        </Link>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="p-4 rounded-2xl bg-destructive/10">
            <Activity className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-destructive">Impossibile caricare i dettagli</p>
            <p className="text-sm text-muted-foreground mt-1">
              La chiamata potrebbe non esistere
            </p>
          </div>
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/calls">
          <Button variant="ghost" size="sm" className="h-10 px-3 gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Indietro</span>
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dettagli Chiamata</h1>
          <p className="text-muted-foreground text-sm font-mono truncate" title={call.callSid}>
            {shortenCallSid(call.callSid)}
          </p>
        </div>
      </div>

      {/* Call Info Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <PhoneIncoming className="h-4 w-4" />
              Da
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-semibold text-lg break-all">{formatPhone(call.from)}</span>
          </CardContent>
        </Card>

        {call.to && (
          <Card className="card-interactive">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                A
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-semibold text-lg break-all">{formatPhone(call.to)}</span>
            </CardContent>
          </Card>
        )}

        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stato</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusBadgeClass(call.status)}>
              {translateStatus(call.status)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Durata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-semibold text-lg">
              {formatDuration(calculatedDuration || 0)}
            </span>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Inizio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm">{formatDate(call.startedAt)}</span>
          </CardContent>
        </Card>

        {call.endedAt && (
          <Card className="card-interactive">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Fine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm">{formatDate(call.endedAt)}</span>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transcript Stats */}
      {call.transcriptStats && (call.transcriptStats.totalMessages > 0) && (
        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Statistiche Conversazione</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-3">
              <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Totali</p>
                <p className="text-2xl font-bold">{call.transcriptStats.totalMessages}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Utente</p>
                <p className="text-2xl font-bold text-primary">{call.transcriptStats.userMessages}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Agente</p>
                <p className="text-2xl font-bold">{call.transcriptStats.agentMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      <Card className="card-interactive">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Trascrizione</CardTitle>
              <CardDescription>Trascrizione completa della conversazione</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transcriptLines.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-hide pr-2">
              {transcriptLines.map((line, index) => {
                const isUser = line.includes("[USER]")
                const cleanLine = line
                  .replace(/\[\d{2}:\d{2}:\d{2}\]\s*/, "")
                  .replace(/\[USER\]\s*/, "")
                  .replace(/\[AGENT[^\]]*\]\s*/, "")

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3 animate-fade-in-up",
                      isUser && "flex-row-reverse"
                    )}
                    style={{ animationDelay: `${index * 0.02}s` }}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                      isUser
                        ? "bg-gradient-to-br from-primary to-primary/80"
                        : "bg-gradient-to-br from-muted to-muted/50"
                    )}>
                      {isUser ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className={cn(
                      "p-3 rounded-xl max-w-[80%]",
                      isUser
                        ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ml-auto"
                        : "bg-muted/50 border border-border/30 mr-auto"
                    )}>
                      <p className="text-sm break-words leading-relaxed">{cleanLine}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                Nessuna trascrizione disponibile per questa chiamata
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                La trascrizione potrebbe non essere stata registrata o la chiamata era troppo breve
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Section */}
      <Card className="card-interactive">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Analisi AI</CardTitle>
              <CardDescription>
                Analisi intelligente della conversazione
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {call.analysis && (
              <Badge className="badge-success">Analizzato</Badge>
            )}
            {!call.analysis && transcriptLines.length >= 4 && (
              <Button
                onClick={() => analyzeCallMutation.mutate()}
                disabled={analyzeCallMutation.isPending}
                size="sm"
                className="gap-2"
              >
                {analyzeCallMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analizzando...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Analizza
                  </>
                )}
              </Button>
            )}
            {call.analysis && (
              <Button
                onClick={() => analyzeCallMutation.mutate()}
                disabled={analyzeCallMutation.isPending}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                {analyzeCallMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Ri-analizzando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Ri-analizza
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Error state */}
          {analyzeCallMutation.isError && (
            <div className="text-center py-6 px-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <p className="text-destructive font-medium">Errore durante l'analisi</p>
              <p className="text-sm text-destructive/80 mt-1">
                {analyzeCallMutation.error?.message || "Riprova più tardi"}
              </p>
            </div>
          )}

          {/* No transcript or too short */}
          {!call.analysis && transcriptLines.length < 4 && !analyzeCallMutation.isPending && (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                {transcriptLines.length === 0
                  ? "Nessuna trascrizione disponibile per l'analisi"
                  : "Trascrizione troppo breve per l'analisi (minimo 4 messaggi)"}
              </p>
            </div>
          )}

          {/* Analysis loading state */}
          {analyzeCallMutation.isPending && !call.analysis && (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              </div>
              <p className="text-muted-foreground font-medium">
                Analisi in corso...
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                L'analisi potrebbe richiedere alcuni secondi
              </p>
            </div>
          )}

          {/* Show analysis results */}
          {call.analysis && !analyzeCallMutation.isPending && (
            <AnalysisResults analysis={call.analysis} />
          )}

          {/* Ready to analyze state */}
          {!call.analysis && transcriptLines.length >= 4 && !analyzeCallMutation.isPending && !analyzeCallMutation.isError && (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground font-medium">
                Clicca "Analizza" per estrarre informazioni dalla conversazione
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Sentiment, intento, urgenza, azioni da fare e altro
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Callbacks */}
      {call.callbacks && call.callbacks.length > 0 && (
        <Card className="card-interactive">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <PhoneCall className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Richieste di Richiamo</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {call.callbacks.map((callback) => (
                <div
                  key={callback.id}
                  className="p-4 rounded-xl border border-border/30 bg-muted/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{callback.callerName}</span>
                    <Badge className={callback.status === "completed" ? "badge-success" : "badge-warning"}>
                      {translateStatus(callback.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatPhone(callback.callerPhone)} - {callback.preferredTime}
                  </p>
                  {callback.reason && (
                    <p className="text-sm mt-2 p-3 bg-muted/50 rounded-lg">{callback.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    {callback.referenceNumber}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      {call.messages && call.messages.length > 0 && (
        <Card className="card-interactive">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Messaggi</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {call.messages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 rounded-xl border border-border/30 bg-muted/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Per: {message.recipientName}</span>
                    <div className="flex items-center gap-2">
                      {message.urgent && (
                        <Badge className="badge-destructive">Urgente</Badge>
                      )}
                      <Badge className={message.status === "read" ? "badge-success" : "badge-warning"}>
                        {translateStatus(message.status)}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm">Da: {message.callerName} ({formatPhone(message.callerPhone)})</p>
                  <p className="text-sm mt-2 p-3 bg-muted/50 rounded-lg">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    {message.referenceNumber}
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

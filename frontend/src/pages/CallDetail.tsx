import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCall, analyzeCall, type CallDetail as CallDetailType, type CallAnalysis } from "@/lib/api"
import {
  ArrowLeft, Phone, Clock, User, Bot, MessageSquare, PhoneCall, Calendar, PhoneIncoming,
  Brain, RefreshCw, Tag, CheckCircle, FileText, TrendingUp, Search, AlertTriangle, Smile, Meh, Frown, AlertCircle
} from "lucide-react"

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
      return <Smile className="h-4 w-4 text-emerald-500" />
    case "neutral":
      return <Meh className="h-4 w-4 text-yellow-500" />
    case "negative":
      return <Frown className="h-4 w-4 text-orange-500" />
    case "frustrated":
      return <AlertCircle className="h-4 w-4 text-red-500" />
    default:
      return <Meh className="h-4 w-4 text-muted-foreground" />
  }
}

function getUrgencyVariant(urgency: string): "default" | "secondary" | "destructive" | "outline" {
  switch (urgency) {
    case "critical":
      return "destructive"
    case "high":
      return "destructive"
    case "medium":
      return "secondary"
    default:
      return "outline"
  }
}

function getResolutionVariant(resolution: string): "default" | "secondary" | "destructive" | "outline" {
  switch (resolution) {
    case "resolved":
      return "outline"
    case "needs_followup":
      return "secondary"
    case "escalated":
      return "destructive"
    default:
      return "secondary"
  }
}

function getLeadScoreVariant(score: string): "default" | "secondary" | "destructive" | "outline" {
  switch (score) {
    case "hot":
      return "destructive"
    case "warm":
      return "secondary"
    default:
      return "outline"
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

// Analysis Results Component
function AnalysisResults({ analysis }: { analysis: CallAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Riepilogo
        </h4>
        <p className="text-sm">{analysis.summary}</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Sentiment */}
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Sentiment</p>
          <div className="flex items-center gap-2 mt-1">
            {getSentimentIcon(analysis.sentimentOverall)}
            <span className="font-medium text-sm">
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
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Intento</p>
          <p className="font-medium text-sm mt-1">{translateIntent(analysis.primaryIntent)}</p>
        </div>

        {/* Urgency */}
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Urgenza</p>
          <div className="mt-1">
            <Badge variant={getUrgencyVariant(analysis.urgencyScore)}>
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
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Stato</p>
          <div className="mt-1">
            <Badge
              variant={getResolutionVariant(analysis.resolutionStatus)}
              className={analysis.resolutionStatus === "resolved" ? "border-emerald-500 text-emerald-600" : ""}
            >
              {translateResolution(analysis.resolutionStatus)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Topic Tags */}
      {analysis.topicTags && analysis.topicTags.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Argomenti
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.topicTags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Entities */}
      {hasEntities(analysis.entities) && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Entita Estratte
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {analysis.entities?.names && analysis.entities.names.length > 0 && (
              <div className="p-2 bg-muted rounded">
                <span className="text-muted-foreground">Nomi: </span>
                {analysis.entities.names.join(", ")}
              </div>
            )}
            {analysis.entities?.products && analysis.entities.products.length > 0 && (
              <div className="p-2 bg-muted rounded">
                <span className="text-muted-foreground">Prodotti: </span>
                {analysis.entities.products.join(", ")}
              </div>
            )}
            {analysis.entities?.dates && analysis.entities.dates.length > 0 && (
              <div className="p-2 bg-muted rounded">
                <span className="text-muted-foreground">Date: </span>
                {analysis.entities.dates.join(", ")}
              </div>
            )}
            {analysis.entities?.phones && analysis.entities.phones.length > 0 && (
              <div className="p-2 bg-muted rounded">
                <span className="text-muted-foreground">Telefoni: </span>
                {analysis.entities.phones.join(", ")}
              </div>
            )}
            {analysis.entities?.emails && analysis.entities.emails.length > 0 && (
              <div className="p-2 bg-muted rounded">
                <span className="text-muted-foreground">Email: </span>
                {analysis.entities.emails.join(", ")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Items */}
      {analysis.actionItems && analysis.actionItems.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Azioni da Fare
          </h4>
          <ul className="space-y-2">
            {analysis.actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm p-2 bg-muted rounded">
                <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="flex-1">{item.description}</span>
                {item.priority === "high" && (
                  <Badge variant="destructive" className="shrink-0">Alta</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lead Score (if present) */}
      {analysis.leadScore && (
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Punteggio Lead
          </h4>
          <div className="flex items-center gap-3">
            <Badge variant={getLeadScoreVariant(analysis.leadScore)}>
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
        <div className="p-4 border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-semibold mb-1 flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            Domanda Frequente Rilevata
          </h4>
          {analysis.faqTopic && (
            <p className="text-sm text-yellow-600 dark:text-yellow-500">
              Argomento: {analysis.faqTopic}
            </p>
          )}
          <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
            Questa domanda potrebbe essere automatizzata
          </p>
        </div>
      )}

      {/* Metadata Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
        <span>Modello: {analysis.modelUsed}</span>
        {analysis.processingTimeMs && (
          <span>{analysis.processingTimeMs}ms</span>
        )}
        <span>Analizzato: {formatDate(analysis.createdAt)}</span>
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

      {/* AI Analysis Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Analisi AI
            </CardTitle>
            <CardDescription>
              Analisi intelligente della conversazione
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {call.analysis && (
              <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                Analizzato
              </Badge>
            )}
            {!call.analysis && transcriptLines.length >= 4 && (
              <Button
                onClick={() => analyzeCallMutation.mutate()}
                disabled={analyzeCallMutation.isPending}
                size="sm"
              >
                {analyzeCallMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analizzando...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
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
              >
                {analyzeCallMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Ri-analizzando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
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
            <div className="text-center py-4 text-destructive">
              <p>Errore durante l'analisi: {analyzeCallMutation.error?.message || "Riprova più tardi"}</p>
            </div>
          )}

          {/* No transcript or too short */}
          {!call.analysis && transcriptLines.length < 4 && !analyzeCallMutation.isPending && (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {transcriptLines.length === 0
                  ? "Nessuna trascrizione disponibile per l'analisi"
                  : "Trascrizione troppo breve per l'analisi (minimo 4 messaggi)"}
              </p>
            </div>
          )}

          {/* Analysis loading state */}
          {analyzeCallMutation.isPending && !call.analysis && (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
              <p className="text-muted-foreground">
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
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Clicca "Analizza" per estrarre informazioni dalla conversazione
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Sentiment, intento, urgenza, azioni da fare e altro
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

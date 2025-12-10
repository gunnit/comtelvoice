import { useQuery } from "@tanstack/react-query"
import { useParams, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCall, type CallDetail as CallDetailType } from "@/lib/api"
import { ArrowLeft, Phone, Clock, User, Bot, MessageSquare, PhoneCall } from "lucide-react"

function formatDuration(seconds: number): string {
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
            Back to Calls
          </Button>
        </Link>
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load call details</p>
        </div>
      </div>
    )
  }

  // Parse the formatted transcript into lines
  const transcriptLines = call.formattedTranscript
    ? call.formattedTranscript.split("\n").filter((line) => line.trim())
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/calls">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Call Details</h1>
          <p className="text-muted-foreground">{call.callSid}</p>
        </div>
      </div>

      {/* Call Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">From</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{call.from}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                call.status === "completed"
                  ? "success"
                  : call.status === "failed"
                  ? "destructive"
                  : "secondary"
              }
            >
              {call.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {call.duration ? formatDuration(call.duration) : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Started</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm">{formatDate(call.startedAt)}</span>
          </CardContent>
        </Card>
      </div>

      {/* Transcript Stats */}
      {call.transcriptStats && (
        <Card>
          <CardHeader>
            <CardTitle>Conversation Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{call.transcriptStats.totalMessages}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User Messages</p>
                <p className="text-2xl font-bold">{call.transcriptStats.userMessages}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agent Messages</p>
                <p className="text-2xl font-bold">{call.transcriptStats.agentMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
          <CardDescription>Full conversation transcript</CardDescription>
        </CardHeader>
        <CardContent>
          {transcriptLines.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {transcriptLines.map((line, index) => {
                const isUser = line.includes("[USER]")
                const cleanLine = line
                  .replace(/\[\d{2}:\d{2}:\d{2}\]\s*/, "")
                  .replace(/\[USER\]\s*/, "")
                  .replace(/\[AGENT[^\]]*\]\s*/, "")

                return (
                  <div
                    key={index}
                    className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        isUser ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      {isUser ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`flex-1 p-3 rounded-lg ${
                        isUser
                          ? "bg-primary text-primary-foreground ml-12"
                          : "bg-muted mr-12"
                      }`}
                    >
                      <p className="text-sm">{cleanLine}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No transcript available for this call
            </p>
          )}
        </CardContent>
      </Card>

      {/* Callbacks */}
      {call.callbacks && call.callbacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              Callback Requests
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
                          ? "success"
                          : callback.status === "pending"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {callback.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {callback.callerPhone} - {callback.preferredTime}
                  </p>
                  {callback.reason && (
                    <p className="text-sm mt-1">{callback.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Ref: {callback.referenceNumber}
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
              Messages
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
                    <span className="font-medium">To: {message.recipientName}</span>
                    <div className="flex items-center gap-2">
                      {message.urgent && (
                        <Badge variant="destructive">Urgent</Badge>
                      )}
                      <Badge
                        variant={
                          message.status === "unread"
                            ? "warning"
                            : message.status === "read"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {message.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm">From: {message.callerName} ({message.callerPhone})</p>
                  <p className="text-sm mt-2 p-2 bg-muted rounded">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ref: {message.referenceNumber}
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

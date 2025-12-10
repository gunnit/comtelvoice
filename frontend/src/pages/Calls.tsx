import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCalls, type Call } from "@/lib/api"
import { Phone, Clock, ArrowRight } from "lucide-react"

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
  })
}

export function Calls() {
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
        <p className="text-destructive">Failed to load calls</p>
        <p className="text-sm text-muted-foreground mt-2">
          Make sure the backend is running on localhost:3000
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calls</h1>
        <p className="text-muted-foreground">
          View all calls to your voice agent
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
          <CardDescription>
            {calls?.length || 0} calls found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calls && calls.length > 0 ? (
            <div className="space-y-2">
              {calls.map((call) => (
                <Link
                  key={call.id}
                  to={`/calls/${call.callSid}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-muted">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{call.from}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(call.startedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {call.callbacks && call.callbacks.length > 0 && (
                      <Badge variant="outline">
                        {call.callbacks.length} callback{call.callbacks.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {call.messages && call.messages.length > 0 && (
                      <Badge variant="outline">
                        {call.messages.length} message{call.messages.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {call.duration && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(call.duration)}
                      </div>
                    )}
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
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No calls recorded yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

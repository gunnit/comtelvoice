import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getMessages, type Message } from "@/lib/api"
import { MessageSquare, AlertTriangle, User } from "lucide-react"

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

const statusFilters = [
  { value: "", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "urgent", label: "Urgent" },
]

export function Messages() {
  const [statusFilter, setStatusFilter] = useState("unread")

  const { data: messages, isLoading, error } = useQuery<Message[]>({
    queryKey: ["messages", statusFilter],
    queryFn: () => getMessages(statusFilter || undefined, undefined, 100),
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
        <p className="text-destructive">Failed to load messages</p>
        <p className="text-sm text-muted-foreground mt-2">
          Make sure the backend is running on localhost:3000
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Messages left for employees
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
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

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            {messages?.length || 0} messages found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages && messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border ${
                    message.urgent ? "border-destructive/50 bg-destructive/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          message.urgent ? "bg-destructive/10" : "bg-muted"
                        }`}
                      >
                        {message.urgent ? (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">To: {message.recipientName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>From: {message.callerName}</span>
                          <span>({message.callerPhone})</span>
                        </div>
                      </div>
                    </div>
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
                            : message.status === "forwarded"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {message.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 ml-11">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{message.content}</p>
                    </div>

                    {message.forwardedTo && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Forwarded to: {message.forwardedTo}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 mt-2 border-t">
                      <span>Ref: {message.referenceNumber}</span>
                      <span>Created: {formatDate(message.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No messages found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

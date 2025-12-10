import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCallbacks, type Callback } from "@/lib/api"
import { PhoneCall, Clock, User, AlertCircle } from "lucide-react"

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
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

export function Callbacks() {
  const [statusFilter, setStatusFilter] = useState("")

  const { data: callbacks, isLoading, error } = useQuery<Callback[]>({
    queryKey: ["callbacks", statusFilter],
    queryFn: () => getCallbacks(statusFilter || undefined, 100),
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
        <p className="text-destructive">Failed to load callbacks</p>
        <p className="text-sm text-muted-foreground mt-2">
          Make sure the backend is running on localhost:3000
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Callbacks</h1>
        <p className="text-muted-foreground">
          Callback requests from callers
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
          <CardTitle>Callback Requests</CardTitle>
          <CardDescription>
            {callbacks?.length || 0} callbacks found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {callbacks && callbacks.length > 0 ? (
            <div className="space-y-3">
              {callbacks.map((callback) => (
                <div
                  key={callback.id}
                  className="p-4 rounded-lg border"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <PhoneCall className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{callback.callerName}</span>
                          {callback.priority === "urgent" && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                          {callback.priority === "high" && (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {callback.callerPhone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          callback.priority === "urgent"
                            ? "destructive"
                            : callback.priority === "high"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {callback.priority}
                      </Badge>
                      <Badge
                        variant={
                          callback.status === "completed"
                            ? "success"
                            : callback.status === "pending"
                            ? "warning"
                            : callback.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {callback.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 ml-11 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Preferred time:</span>
                      <span>{callback.preferredTime}</span>
                    </div>

                    {callback.reason && (
                      <p className="text-sm p-2 bg-muted rounded">
                        {callback.reason}
                      </p>
                    )}

                    {callback.assignedTo && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Assigned to:</span>
                        <span>{callback.assignedTo}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>Ref: {callback.referenceNumber}</span>
                      <span>Created: {formatDate(callback.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No callbacks found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

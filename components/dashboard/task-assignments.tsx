"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Upload,
  Calendar,
  DollarSign,
  User,
  FileVideo,
  Edit,
  Send,
  XCircle,
} from "lucide-react"

interface TaskAssignmentsProps {
  tenantId: string
  userRole?: "creator" | "admin" | "manager"
}

interface Task {
  id: string
  title: string
  description: string
  task_type: string
  status: string
  priority: number
  budget: number
  currency: string
  deadline: string
  created_at: string
  assigned_by: string
  deliverables: Array<{ type: string; description: string }>
}

export function TaskAssignments({ tenantId, userRole = "creator" }: TaskAssignmentsProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    taskType: "video_creation",
    assignedTo: "",
    budget: "",
    deadline: "",
    priority: "5",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchTasks()
  }, [tenantId, activeTab])

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        `/api/payments/tasks?status=${activeTab !== "all" ? activeTab : ""}`,
        { headers: { "x-tenant-id": tenantId } }
      )
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.assignedTo) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/payments/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          action: "create",
          ...newTask,
          budget: parseFloat(newTask.budget) || 0,
          priority: parseInt(newTask.priority),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Task created successfully",
        })
        setIsCreateDialogOpen(false)
        setNewTask({
          title: "",
          description: "",
          taskType: "video_creation",
          assignedTo: "",
          budget: "",
          deadline: "",
          priority: "5",
        })
        fetchTasks()
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTaskStatus = async (
    taskId: string,
    status: string,
    rejectionReason?: string
  ) => {
    try {
      const response = await fetch("/api/payments/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          action: "update_status",
          taskId,
          status,
          rejectionReason,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Task ${status === "in_progress" ? "started" : status}`,
        })
        fetchTasks()
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" aria-hidden="true" />
      case "in_progress":
        return <PlayCircle className="h-4 w-4 text-blue-600" aria-hidden="true" />
      case "submitted":
        return <Upload className="h-4 w-4 text-purple-600" aria-hidden="true" />
      case "approved":
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" aria-hidden="true" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      submitted: "bg-purple-100 text-purple-800",
      approved: "bg-green-100 text-green-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }
    return (
      <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>
        <span className="flex items-center gap-1">
          {getStatusIcon(status)}
          <span className="capitalize">{status.replace("_", " ")}</span>
        </span>
      </Badge>
    )
  }

  const getPriorityBadge = (priority: number) => {
    if (priority >= 8) {
      return <Badge variant="destructive">High Priority</Badge>
    }
    if (priority >= 5) {
      return <Badge variant="secondary">Normal</Badge>
    }
    return <Badge variant="outline">Low</Badge>
  }

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "video_creation":
        return <FileVideo className="h-5 w-5" aria-hidden="true" />
      case "editing":
        return <Edit className="h-5 w-5" aria-hidden="true" />
      default:
        return <ClipboardList className="h-5 w-5" aria-hidden="true" />
    }
  }

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount)
  }

  const getDaysRemaining = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted h-32 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6" role="main" aria-label="Task Assignments">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Assignments</h2>
          <p className="text-muted-foreground">
            Manage your video creation and editing tasks
          </p>
        </div>
        {(userRole === "admin" || userRole === "manager") && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button aria-label="Create new task">
                <ClipboardList className="mr-2 h-4 w-4" aria-hidden="true" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Assign a new task to a creator
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-title">Title *</Label>
                  <Input
                    id="task-title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    placeholder="Enter task title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    placeholder="Describe the task requirements"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="task-type">Task Type</Label>
                    <Select
                      value={newTask.taskType}
                      onValueChange={(value) =>
                        setNewTask({ ...newTask, taskType: value })
                      }
                    >
                      <SelectTrigger id="task-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video_creation">Video Creation</SelectItem>
                        <SelectItem value="editing">Editing</SelectItem>
                        <SelectItem value="translation">Translation</SelectItem>
                        <SelectItem value="asl_interpretation">ASL Interpretation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value) =>
                        setNewTask({ ...newTask, priority: value })
                      }
                    >
                      <SelectTrigger id="task-priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">Low</SelectItem>
                        <SelectItem value="5">Normal</SelectItem>
                        <SelectItem value="8">High</SelectItem>
                        <SelectItem value="10">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="task-budget">Budget (USD)</Label>
                    <Input
                      id="task-budget"
                      type="number"
                      value={newTask.budget}
                      onChange={(e) =>
                        setNewTask({ ...newTask, budget: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-deadline">Deadline</Label>
                    <Input
                      id="task-deadline"
                      type="date"
                      value={newTask.deadline}
                      onChange={(e) =>
                        setNewTask({ ...newTask, deadline: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assigned-to">Assign To (Creator ID) *</Label>
                  <Input
                    id="assigned-to"
                    value={newTask.assignedTo}
                    onChange={(e) =>
                      setNewTask({ ...newTask, assignedTo: e.target.value })
                    }
                    placeholder="Enter creator ID or email"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTask}>Create Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Task Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" aria-hidden="true" />
              <div>
                <p className="text-2xl font-bold">
                  {tasks.filter((t) => t.status === "pending").length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <div>
                <p className="text-2xl font-bold">
                  {tasks.filter((t) => t.status === "in_progress").length}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-600" aria-hidden="true" />
              <div>
                <p className="text-2xl font-bold">
                  {tasks.filter((t) => t.status === "submitted").length}
                </p>
                <p className="text-sm text-muted-foreground">Awaiting Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
              <div>
                <p className="text-2xl font-bold">
                  {tasks.filter((t) => t.status === "completed").length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList aria-label="Task status filter">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="space-y-4">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getTaskTypeIcon(task.task_type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <CardDescription className="capitalize">
                            {task.task_type.replace("_", " ")}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(task.priority)}
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {task.description && (
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span className="font-medium">
                          {formatCurrency(task.budget, task.currency)}
                        </span>
                      </div>
                      {task.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span>
                            {new Date(task.deadline).toLocaleDateString()}
                            {getDaysRemaining(task.deadline) > 0 ? (
                              <span className="text-muted-foreground">
                                {" "}
                                ({getDaysRemaining(task.deadline)} days left)
                              </span>
                            ) : (
                              <span className="text-red-600"> (Overdue)</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Deadline Progress Bar */}
                    {task.deadline && task.status !== "completed" && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Time remaining</span>
                          <span>
                            {Math.max(0, getDaysRemaining(task.deadline))} days
                          </span>
                        </div>
                        <Progress
                          value={Math.max(0, Math.min(100, (getDaysRemaining(task.deadline) / 14) * 100))}
                          className="h-1"
                          aria-label="Time remaining progress"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {task.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}
                          aria-label={`Start task: ${task.title}`}
                        >
                          <PlayCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                          Start Task
                        </Button>
                      )}
                      {task.status === "in_progress" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task)
                            setIsSubmitDialogOpen(true)
                          }}
                          aria-label={`Submit task: ${task.title}`}
                        >
                          <Send className="mr-1 h-4 w-4" aria-hidden="true" />
                          Submit Work
                        </Button>
                      )}
                      {task.status === "submitted" &&
                        (userRole === "admin" || userRole === "manager") && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() =>
                                handleUpdateTaskStatus(task.id, "approved")
                              }
                              aria-label={`Approve task: ${task.title}`}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleUpdateTaskStatus(
                                  task.id,
                                  "rejected",
                                  "Needs revision"
                                )
                              }
                              aria-label={`Reject task: ${task.title}`}
                            >
                              <XCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                              Reject
                            </Button>
                          </>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
                  <h3 className="font-semibold mb-2">No tasks found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === "all"
                      ? "You don't have any tasks yet"
                      : `No ${activeTab.replace("_", " ")} tasks`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit Work Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Work</DialogTitle>
            <DialogDescription>
              {selectedTask?.title && `Submitting: ${selectedTask.title}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="submission-notes">Notes (optional)</Label>
              <Textarea
                id="submission-notes"
                placeholder="Add any notes about your submission"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deliverable-url">Deliverable URL</Label>
              <Input
                id="deliverable-url"
                placeholder="https://..."
                type="url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSubmitDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedTask) {
                  handleUpdateTaskStatus(selectedTask.id, "submitted")
                  setIsSubmitDialogOpen(false)
                  setSelectedTask(null)
                }
              }}
            >
              Submit for Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

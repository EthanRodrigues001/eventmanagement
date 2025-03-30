"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, Circle, Plus, Trash2, Sparkles } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { generateEventTasks } from "@/lib/ai";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Task {
  id: string;
  eventId: string;
  title: string;
  description: string;
  category: string;
  assignedTo: string | null;
  assigneeName?: string;
  assigneePhoto?: string | null;
  status: "pending" | "completed";
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  userId: string;
  displayName: string;
  photoURL: string | null;
  role: string;
}

interface TaskManagementProps {
  eventId: string;
}

const TASK_CATEGORIES = [
  "PR",
  "marketing",
  "logistics",
  "technical",
  "sponsorship",
  "documentation",
  "general",
];
type Category = "PR" | "marketing" | "logistics" | "technical";

export function TaskManagement({ eventId }: TaskManagementProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "general",
    assignedTo: "",
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const tasksQuery = query(
        collection(db, "tasks"),
        where("eventId", "==", eventId)
      );

      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData: Task[] = [];

      for (const taskDoc of tasksSnapshot.docs) {
        const data = taskDoc.data();
        const task: Task = {
          id: taskDoc.id,
          eventId: data.eventId,
          title: data.title,
          description: data.description,
          category: data.category,
          assignedTo: data.assignedTo,
          status: data.status,
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt.toDate().toISOString(),
        };

        // Get assignee details if assigned
        if (data.assignedTo) {
          try {
            const userDoc = await getDoc(doc(db, "users", data.assignedTo));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              task.assigneeName =
                (userData as { displayName?: string }).displayName || "Unknown";
              task.assigneePhoto = (
                userData as { photoURL: string | null }
              ).photoURL;
            }
          } catch (error) {
            console.error("Error fetching assignee details:", error);
          }
        }

        tasksData.push(task);
      }

      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const teamQuery = query(
        collection(db, "organizingTeam"),
        where("eventId", "==", eventId)
      );

      const teamSnapshot = await getDocs(teamQuery);
      const teamData: TeamMember[] = [];

      for (const userDoc of teamSnapshot.docs) {
        const data = userDoc.data();

        try {
          const userDoc = await getDoc(doc(db, "users", data.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            teamData.push({
              id: userDoc.id,
              userId: data.userId,
              displayName:
                (userData as { displayName?: string }).displayName || "Unknown",
              photoURL: (userData as { photoURL: string | null }).photoURL,
              role: data.role,
            });
          }
        } catch (error) {
          console.error("Error fetching team member details:", error);
        }
      }

      setTeamMembers(teamData);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
  }, [eventId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.title || !newTask.category) {
      toast.error("Please provide a title and category for the task.");
      return;
    }

    try {
      setAdding(true);

      await addDoc(collection(db, "tasks"), {
        eventId,
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        assignedTo: newTask.assignedTo || null,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Task added successfully");

      // Reset form
      setNewTask({
        title: "",
        description: "",
        category: "general",
        assignedTo: "",
      });

      setDialogOpen(false);

      // Refresh tasks list
      fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add task"
      );
    } finally {
      setAdding(false);
    }
  };

  const handleToggleTaskStatus = async (
    taskId: string,
    currentStatus: "pending" | "completed"
  ) => {
    try {
      const newStatus = currentStatus === "pending" ? "completed" : "pending";

      await updateDoc(doc(db, "tasks", taskId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setTasks(
        tasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));

      // Update local state
      setTasks(tasks.filter((task) => task.id !== taskId));

      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleGenerateTasks = async () => {
    try {
      setGenerating(true);

      // Get event details
      const eventDoc = await getDoc(doc(db, "events", eventId));

      if (!eventDoc.exists()) {
        toast.error("Event not found");
        return;
      }

      const eventData = eventDoc.data();

      // Generate tasks for each category
      for (const category of ["PR", "marketing", "logistics", "technical"]) {
        const generatedTasks: {
          title: string;
          description: string;
          assignedTo?: string | null;
        }[] = await generateEventTasks(
          {
            title: eventData.title,
            description: eventData.description,
            startDate: eventData.startDate.toDate(),
            endDate: eventData.endDate.toDate(),
            location: eventData.location,
            organizingTeam: teamMembers.map((member) => ({
              name: member.displayName,
              role: member.role,
            })),
          },
          category as Category
        );
        console.log(generatedTasks);

        // Add tasks to database
        if (Array.isArray(generatedTasks) && generatedTasks.length > 0) {
          await Promise.all(
            generatedTasks.map((task) =>
              addDoc(collection(db, "tasks"), {
                eventId,
                title: task.title,
                description: task.description,
                category: (category || "").toLowerCase(),
                assignedTo: task.assignedTo,
                status: "pending",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              })
            )
          );
        }
      }

      toast.success("Tasks generated successfully");

      // Refresh tasks list
      fetchTasks();
    } catch (error) {
      console.error("Error generating tasks:", error);
      toast.error("Failed to generate tasks");
    } finally {
      setGenerating(false);
    }
  };

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter((task) => {
    if (filterCategory !== "all" && task.category !== filterCategory)
      return false;
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterAssignee !== "all") {
      if (filterAssignee === "unassigned" && task.assignedTo) return false;
      if (filterAssignee !== "unassigned" && task.assignedTo !== filterAssignee)
        return false;
    }
    return true;
  });

  // Group tasks by category
  const tasksByCategory: Record<string, Task[]> = {};

  filteredTasks.forEach((task) => {
    if (!tasksByCategory[task.category]) {
      tasksByCategory[task.category] = [];
    }
    tasksByCategory[task.category].push(task);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Task Management</h2>
          <p className="text-muted-foreground">
            Manage and track tasks for your event
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogDescription>
                  Create a new task for your event team.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTask}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={newTask.title}
                      onChange={handleInputChange}
                      placeholder="Enter task title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={newTask.description}
                      onChange={handleInputChange}
                      placeholder="Enter task description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newTask.category}
                        onValueChange={(value) =>
                          handleSelectChange("category", value)
                        }
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() +
                                category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assignedTo">Assign To</Label>
                      <Select
                        value={newTask.assignedTo}
                        onValueChange={(value) =>
                          handleSelectChange("assignedTo", value)
                        }
                      >
                        <SelectTrigger id="assignedTo">
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem
                              key={member.userId}
                              value={member.userId}
                            >
                              {member.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={adding}>
                    {adding ? "Adding..." : "Add Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="gap-2"
            onClick={handleGenerateTasks}
            disabled={generating}
          >
            <Sparkles className="h-4 w-4" />
            {generating ? "Generating..." : "Generate Tasks with AI"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="filterCategory">Filter by Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="filterCategory" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {TASK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="filterStatus">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filterStatus" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="filterAssignee">Filter by Assignee</Label>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger id="filterAssignee" className="w-full">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="byCategory">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-9 rounded-md" />
                        <Skeleton className="h-9 w-9 rounded-md" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No tasks found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {tasks.length > 0
                    ? "Try adjusting your filters or add a new task"
                    : "Add a new task or generate tasks with AI"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className={task.status === "completed" ? "opacity-70" : ""}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3
                            className={`font-medium ${
                              task.status === "completed" ? "line-through" : ""
                            }`}
                          >
                            {task.title}
                          </h3>
                          <Badge variant="outline" className="capitalize">
                            {task.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {task.description}
                        </p>
                        {task.assignedTo && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assigneePhoto || ""} />
                              <AvatarFallback>
                                {task.assigneeName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">
                              Assigned to {task.assigneeName}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleToggleTaskStatus(task.id, task.status)
                          }
                          title={
                            task.status === "pending"
                              ? "Mark as completed"
                              : "Mark as pending"
                          }
                        >
                          {task.status === "pending" ? (
                            <Circle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete task"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="byCategory">
          {loading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i}>
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="space-y-4">
                    {[1, 2].map((j) => (
                      <Card key={j}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Skeleton className="h-5 w-3/4 mb-2" />
                              <Skeleton className="h-4 w-1/2 mb-4" />
                              <Skeleton className="h-4 w-full" />
                            </div>
                            <div className="flex gap-2">
                              <Skeleton className="h-9 w-9 rounded-md" />
                              <Skeleton className="h-9 w-9 rounded-md" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(tasksByCategory).length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No tasks found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {tasks.length > 0
                    ? "Try adjusting your filters or add a new task"
                    : "Add a new task or generate tasks with AI"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(tasksByCategory).map(
                ([category, categoryTasks]) => (
                  <div key={category}>
                    <h3 className="text-lg font-medium mb-4 capitalize">
                      {category}
                    </h3>
                    <div className="space-y-4">
                      {categoryTasks.map((task) => (
                        <Card
                          key={task.id}
                          className={
                            task.status === "completed" ? "opacity-70" : ""
                          }
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3
                                  className={`font-medium ${
                                    task.status === "completed"
                                      ? "line-through"
                                      : ""
                                  }`}
                                >
                                  {task.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                  {task.description}
                                </p>
                                {task.assignedTo && (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage
                                        src={task.assigneePhoto || ""}
                                      />
                                      <AvatarFallback>
                                        {task.assigneeName?.charAt(0) || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">
                                      Assigned to {task.assigneeName}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    handleToggleTaskStatus(task.id, task.status)
                                  }
                                  title={
                                    task.status === "pending"
                                      ? "Mark as completed"
                                      : "Mark as pending"
                                  }
                                >
                                  {task.status === "pending" ? (
                                    <Circle className="h-4 w-4" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDeleteTask(task.id)}
                                  title="Delete task"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

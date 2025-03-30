"use client";

import { useParams } from "next/navigation";
import { TaskManagement } from "@/components/events/task-management";

export default function TasksPage() {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="space-y-6">
      <TaskManagement eventId={eventId || ""} />
    </div>
  );
}

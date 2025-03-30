"use client";

import { useParams } from "next/navigation";
import { FilesManagement } from "@/components/events/files-management";

export default function FilesPage() {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="space-y-6">
      <FilesManagement eventId={eventId || ""} />
    </div>
  );
}

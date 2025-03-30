"use client";

import { useParams } from "next/navigation";
import { ParticipantsManagement } from "@/components/events/participants-management";

export default function ParticipantsPage() {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="space-y-6">
      <ParticipantsManagement eventId={eventId || ""} />
    </div>
  );
}

"use client";

import { useParams } from "next/navigation";
import { SpeakersManagement } from "@/components/events/speakers-management";

export default function SpeakersPage() {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="space-y-6">
      <SpeakersManagement eventId={eventId || ""} />
    </div>
  );
}

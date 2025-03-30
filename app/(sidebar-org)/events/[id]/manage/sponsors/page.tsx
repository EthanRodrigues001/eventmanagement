"use client";

import { useParams } from "next/navigation";
import { SponsorsManagement } from "@/components/events/sponsors-management";

export default function SponsorsPage() {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="space-y-6">
      <SponsorsManagement eventId={eventId || ""} />
    </div>
  );
}

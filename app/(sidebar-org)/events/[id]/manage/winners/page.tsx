"use client";

import { useParams } from "next/navigation";
import { WinnersManagement } from "@/components/events/winners-management";

export default function WinnersPage() {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="space-y-6">
      <WinnersManagement eventId={eventId || ""} />
    </div>
  );
}

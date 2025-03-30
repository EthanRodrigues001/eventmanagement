"use client";

import { useParams } from "next/navigation";
import { OrganizingTeamManagement } from "@/components/events/organizing-team-management";

export default function TeamPage() {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  return (
    <div className="space-y-6">
      <OrganizingTeamManagement eventId={eventId || ""} />
    </div>
  );
}

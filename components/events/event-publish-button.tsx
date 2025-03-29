"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Globe } from "lucide-react";

interface EventPublishButtonProps {
  eventId: string;
  isPublished: boolean;
  onPublish?: () => void;
}

export function EventPublishButton({
  eventId,
  isPublished,
  onPublish,
}: EventPublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (isPublished) return;

    try {
      setIsPublishing(true);

      const response = await fetch("/api/events/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish event");
      }

      toast.success("Event Published", {
        description: "Your event is now visible to all users.",
      });

      if (onPublish) {
        onPublish();
      }
    } catch (error) {
      console.error("Error publishing event:", error);
      toast.error("Failed to publish event", {
        description:
          error instanceof Error ? error.message : "Failed to publish event",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (isPublished) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Globe className="h-4 w-4" />
        Published
      </Button>
    );
  }

  return (
    <Button onClick={handlePublish} disabled={isPublishing} className="gap-2">
      <Globe className="h-4 w-4" />
      {isPublishing ? "Publishing..." : "Publish Event"}
    </Button>
  );
}

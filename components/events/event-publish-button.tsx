"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Globe, EyeOff } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";

interface PublishButtonProps {
  eventId: string;
  isPublished: boolean;
  onPublishChange?: (isPublished: boolean) => void;
}

export function PublishButton({
  eventId,
  isPublished,
  onPublishChange,
}: PublishButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleTogglePublish = async () => {
    try {
      setIsUpdating(true);

      // Update event in Firestore
      await updateDoc(doc(db, "events", eventId), {
        isPublished: !isPublished,
        updatedAt: new Date(),
      });

      toast.success(!isPublished ? "Event Published" : "Event Unpublished", {
        description: !isPublished
          ? "Your event is now visible to all users"
          : "Your event is now hidden from public view",
      });

      if (onPublishChange) {
        onPublishChange(!isPublished);
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update publish status", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      variant={isPublished ? "outline" : "default"}
      onClick={handleTogglePublish}
      disabled={isUpdating}
      className="gap-2"
    >
      {isPublished ? (
        <>
          <EyeOff className="h-4 w-4" />
          {isUpdating ? "Updating..." : "Unpublish"}
        </>
      ) : (
        <>
          <Globe className="h-4 w-4" />
          {isUpdating ? "Publishing..." : "Publish"}
        </>
      )}
    </Button>
  );
}

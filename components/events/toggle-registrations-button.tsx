"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus, UserX } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";

interface ToggleRegistrationsButtonProps {
  eventId: string;
  registrationsOpen: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export function ToggleRegistrationsButton({
  eventId,
  registrationsOpen,
  onToggle,
}: ToggleRegistrationsButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    try {
      setIsUpdating(true);

      // Update event in Firestore
      await updateDoc(doc(db, "events", eventId), {
        registrations: !registrationsOpen,
        updatedAt: new Date(),
      });

      toast.success(
        !registrationsOpen ? "Registrations Opened" : "Registrations Closed",
        {
          description: !registrationsOpen
            ? "Users can now register for this event"
            : "Users can no longer register for this event",
        }
      );

      if (onToggle) {
        onToggle(!registrationsOpen);
      }
    } catch (error) {
      console.error("Error toggling registrations:", error);
      toast.error("Failed to update registration status", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      variant={registrationsOpen ? "outline" : "default"}
      onClick={handleToggle}
      disabled={isUpdating}
      className="gap-2"
    >
      {registrationsOpen ? (
        <>
          <UserX className="h-4 w-4" />
          {isUpdating ? "Updating..." : "Close Registrations"}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {isUpdating ? "Updating..." : "Open Registrations"}
        </>
      )}
    </Button>
  );
}

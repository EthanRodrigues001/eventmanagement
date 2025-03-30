"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Search, Trash2, Mail, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Participant {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  organization?: string;
  photoURL: string | null;
  registeredAt: string;
}

interface ParticipantsManagementProps {
  eventId: string;
}

export function ParticipantsManagement({
  eventId,
}: ParticipantsManagementProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [participantToDelete, setParticipantToDelete] =
    useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchParticipants = async () => {
    try {
      setLoading(true);

      const participantsQuery = query(
        collection(db, "eventParticipants"),
        where("eventId", "==", eventId),
        orderBy("registeredAt", "desc")
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const participantsData: Participant[] = [];

      for (const participantDoc of participantsSnapshot.docs) {
        const data = participantDoc.data();

        try {
          const userDoc = await getDoc(doc(db, "users", data.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            participantsData.push({
              id: participantDoc.id,
              userId: data.userId,
              displayName:
                (userData as { displayName?: string }).displayName || "Unknown",
              email: (userData as { email?: string }).email || "",
              phoneNumber:
                (userData as { phoneNumber?: string }).phoneNumber || "",
              organization:
                (userData as { organization?: string }).organization || "",
              photoURL: (userData as { photoURL?: string }).photoURL || null,
              registeredAt: data.registeredAt.toDate().toISOString(),
            });
          }
        } catch (error) {
          console.error("Error fetching participant details:", error);
        }
      }

      setParticipants(participantsData);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [eventId]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteParticipant = async () => {
    if (!participantToDelete) return;

    try {
      setIsDeleting(true);

      await deleteDoc(doc(db, "eventParticipants", participantToDelete.id));

      toast.success(
        `${participantToDelete.displayName} has been removed from the event.`
      );

      // Update local state
      setParticipants(
        participants.filter((p) => p.id !== participantToDelete.id)
      );

      // Reset state
      setParticipantToDelete(null);
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error("Failed to remove participant. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const exportParticipantsToCSV = () => {
    // Create CSV content
    const headers = ["Name", "Email", "Phone", "Organization", "Registered At"];
    const rows = participants.map((p) => [
      p.displayName,
      p.email,
      p.phoneNumber || "",
      p.organization || "",
      new Date(p.registeredAt).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `event-participants-${eventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter participants based on search query
  const filteredParticipants = participants.filter((participant) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      participant.displayName.toLowerCase().includes(searchLower) ||
      participant.email.toLowerCase().includes(searchLower) ||
      (participant.organization &&
        participant.organization.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Event Participants
            </CardTitle>
            <CardDescription>
              {participants.length}{" "}
              {participants.length === 1 ? "person" : "people"} registered for
              this event
            </CardDescription>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={exportParticipantsToCSV}
            disabled={participants.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search participants..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* Participants list */}
        <div className="rounded-md border">
          <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
            <div className="col-span-5">Participant</div>
            <div className="col-span-3 hidden md:block">Organization</div>
            <div className="col-span-3 hidden md:block">Registered</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {loading ? (
            Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-4 p-4 items-center border-b"
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="col-span-3 hidden md:block">
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="col-span-3 hidden md:block">
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="col-span-1">
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </div>
                </div>
              ))
          ) : filteredParticipants.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery
                ? "No participants match your search"
                : "No participants registered yet"}
            </div>
          ) : (
            filteredParticipants.map((participant) => (
              <div
                key={participant.id}
                className="grid grid-cols-12 gap-4 p-4 items-center border-b"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={participant.photoURL || ""} />
                    <AvatarFallback>
                      {participant.displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{participant.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {participant.email}
                    </p>
                  </div>
                </div>
                <div className="col-span-3 hidden md:block">
                  {participant.organization ? (
                    <Badge variant="outline">{participant.organization}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Not specified
                    </span>
                  )}
                </div>
                <div className="col-span-3 hidden md:block text-sm text-muted-foreground">
                  {new Date(participant.registeredAt).toLocaleDateString()}
                </div>
                <div className="col-span-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-more-vertical"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(`mailto:${participant.email}`, "_blank")
                        }
                        className="cursor-pointer"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email Participant
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setParticipantToDelete(participant)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Registration
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!participantToDelete}
        onOpenChange={(open) => !open && setParticipantToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {participantToDelete?.displayName}{" "}
              from this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteParticipant}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trophy, Plus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import type { Winner } from "@/lib/types";
import { WINNER_POSITIONS } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WinnersManagementProps {
  eventId: string;
}

export function WinnersManagement({ eventId }: WinnersManagementProps) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [participants, setParticipants] = useState<
    {
      id: string;
      userId: string;
      displayName: string;
      photoURL: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");

  const fetchWinners = async () => {
    try {
      setLoading(true);

      // Get winners
      const winnersQuery = query(
        collection(db, "winners"),
        where("eventId", "==", eventId)
      );

      const winnersSnapshot = await getDocs(winnersQuery);
      const winnersData: Winner[] = [];
      const userPromises: Promise<void>[] = [];

      winnersSnapshot.forEach((winnerDoc) => {
        // Renamed `doc` to `winnerDoc`
        const data = winnerDoc.data();

        userPromises.push(
          getDoc(doc(db, "users", data.userId)).then((userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              winnersData.push({
                id: winnerDoc.id, // Use `winnerDoc.id` for the document ID
                eventId: data.eventId,
                userId: data.userId,
                position: data.position,
                displayName:
                  (userData as { displayName?: string }).displayName ||
                  "Unknown",
                photoURL: (userData as { photoURL: string | null }).photoURL,
                addedAt: data.addedAt.toDate().toISOString(),
              });
            }
          })
        );
      });

      await Promise.all(userPromises);
      setWinners(winnersData);
    } catch (error) {
      console.error("Error fetching winners:", error);
      toast.error("Failed to load winners. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      // Get participants
      const participantsQuery = query(
        collection(db, "eventParticipants"),
        where("eventId", "==", eventId)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const participantsData: {
        id: string;
        userId: string;
        displayName: string;
        photoURL: string | null;
      }[] = [];
      const userPromises: Promise<void>[] = [];

      participantsSnapshot.forEach((participantDoc) => {
        const data = participantDoc.data();

        userPromises.push(
          getDoc(doc(db, "users", data.userId)).then((userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              participantsData.push({
                id: participantDoc.id,
                userId: data.userId,
                displayName:
                  (userData as { displayName?: string }).displayName ||
                  "Unknown",
                photoURL: (userData as { photoURL: string | null }).photoURL,
              });
            }
          })
        );
      });

      await Promise.all(userPromises);

      // Filter out participants who are already winners in the same position
      const winnerUserIds = winners.map(
        (winner) => `${winner.userId}-${winner.position}`
      );
      const filteredParticipants = participantsData.filter(
        (participant) =>
          !winnerUserIds.includes(`${participant.userId}-${selectedPosition}`)
      );

      setParticipants(filteredParticipants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants. Please try again.");
    }
  };

  useEffect(() => {
    fetchWinners();
  }, [eventId]);

  useEffect(() => {
    if (selectedPosition) {
      fetchParticipants();
    }
  }, [selectedPosition, winners]);

  const handleAddWinner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedParticipant || !selectedPosition) {
      toast.error("Please select both a participant and a position.");
      return;
    }

    try {
      setAdding(true);

      await addDoc(collection(db, "winners"), {
        eventId,
        userId: selectedParticipant,
        position: selectedPosition,
        addedAt: serverTimestamp(),
      });

      const participant = participants.find(
        (p) => p.userId === selectedParticipant
      );
      toast.success(
        `${
          participant?.displayName || "Participant"
        } has been added as ${selectedPosition}.`
      );

      // Reset form
      setSelectedParticipant("");
      setSelectedPosition("");

      // Refresh winners list
      fetchWinners();
    } catch (error) {
      console.error("Error adding winner:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add winner"
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveWinner = async (winnerId: string, winnerName: string) => {
    try {
      await deleteDoc(doc(db, "winners", winnerId));

      toast.success(`${winnerName} has been removed from the winners list.`);

      // Refresh winners list
      fetchWinners();
    } catch (error) {
      console.error("Error removing winner:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove winner"
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Event Winners
        </CardTitle>
        <CardDescription>Add and manage winners for your event</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new winner form */}
        <form onSubmit={handleAddWinner} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={selectedPosition}
                onValueChange={setSelectedPosition}
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {WINNER_POSITIONS.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant">Participant</Label>
              <Select
                value={selectedParticipant}
                onValueChange={setSelectedParticipant}
                disabled={!selectedPosition}
              >
                <SelectTrigger id="participant">
                  <SelectValue
                    placeholder={
                      selectedPosition
                        ? "Select participant"
                        : "Select position first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {participants.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available participants
                    </SelectItem>
                  ) : (
                    participants.map((participant) => (
                      <SelectItem
                        key={participant.userId}
                        value={participant.userId}
                      >
                        {participant.displayName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={adding || !selectedParticipant || !selectedPosition}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {adding ? "Adding..." : "Add Winner"}
          </Button>
        </form>

        {/* Winners list */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Current Winners</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading winners...</p>
          ) : winners.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No winners added yet
            </p>
          ) : (
            <div className="space-y-3">
              {winners.map((winner) => (
                <div
                  key={winner.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {winner.photoURL ? (
                        <AvatarImage
                          src={winner.photoURL}
                          alt={winner.displayName}
                        />
                      ) : null}
                      <AvatarFallback>
                        {winner.displayName ||
                          "Unknown"
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{winner.displayName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 rounded-full">
                          {winner.position}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleRemoveWinner(
                        winner.id,
                        winner.displayName || "Winner"
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

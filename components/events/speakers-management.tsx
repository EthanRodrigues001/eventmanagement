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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mic2, Plus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import type { Speaker } from "@/lib/types";

interface SpeakersManagementProps {
  eventId: string;
}

export function SpeakersManagement({ eventId }: SpeakersManagementProps) {
  //   const { user } = useAuth();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newSpeaker, setNewSpeaker] = useState({
    name: "",
    profession: "",
  });

  const fetchSpeakers = async () => {
    try {
      setLoading(true);

      const speakersQuery = query(
        collection(db, "speakers"),
        where("eventId", "==", eventId)
      );

      const speakersSnapshot = await getDocs(speakersQuery);
      const speakersData: Speaker[] = [];

      speakersSnapshot.forEach((doc) => {
        const data = doc.data();
        speakersData.push({
          id: doc.id,
          eventId: data.eventId,
          name: data.name,
          profession: data.profession,
        });
      });

      setSpeakers(speakersData);
    } catch (error) {
      console.error("Error fetching speakers:", error);
      toast.error("Failed to load speakers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeakers();
  }, [eventId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSpeaker((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSpeaker = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSpeaker.name || !newSpeaker.profession) {
      toast.error("Please provide both name and profession for the speaker.");
      return;
    }

    try {
      setAdding(true);

      await addDoc(collection(db, "speakers"), {
        eventId,
        name: newSpeaker.name,
        profession: newSpeaker.profession,
        createdAt: serverTimestamp(),
      });

      toast.success(`${newSpeaker.name} has been added as a speaker.`);

      // Reset form
      setNewSpeaker({
        name: "",
        profession: "",
      });

      // Refresh speakers list
      fetchSpeakers();
    } catch (error) {
      console.error("Error adding speaker:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add speaker"
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveSpeaker = async (
    speakerId: string,
    speakerName: string
  ) => {
    try {
      await deleteDoc(doc(db, "speakers", speakerId));

      toast.success(`${speakerName} has been removed from the speakers list.`);

      // Refresh speakers list
      fetchSpeakers();
    } catch (error) {
      console.error("Error removing speaker:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove speaker"
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic2 className="h-5 w-5" />
          Event Speakers
        </CardTitle>
        <CardDescription>
          Add and manage speakers for your event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new speaker form */}
        <form onSubmit={handleAddSpeaker} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Speaker Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter speaker name"
                value={newSpeaker.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profession">Profession/Title</Label>
              <Input
                id="profession"
                name="profession"
                placeholder="Enter profession or title"
                value={newSpeaker.profession}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <Button type="submit" disabled={adding} className="gap-2">
            <Plus className="h-4 w-4" />
            {adding ? "Adding..." : "Add Speaker"}
          </Button>
        </form>

        {/* Speakers list */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Current Speakers</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading speakers...</p>
          ) : speakers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No speakers added yet
            </p>
          ) : (
            <div className="space-y-3">
              {speakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {speaker.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{speaker.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {speaker.profession}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleRemoveSpeaker(speaker.id, speaker.name)
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

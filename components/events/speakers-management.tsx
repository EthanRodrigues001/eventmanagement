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
import { Mic2, Plus, Trash2, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
import type { Speaker } from "@/lib/types";
import speakersData from "@/lib/db/speakers.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SpeakersManagementProps {
  eventId: string;
}

export function SpeakersManagement({ eventId }: SpeakersManagementProps) {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [eventCategory, setEventCategory] = useState("");
  const [suggestedSpeaker, setSuggestedSpeaker] = useState<any | null>(null);
  const [showSuggestedDialog, setShowSuggestedDialog] = useState(false);

  const [newSpeaker, setNewSpeaker] = useState({
    name: "",
    profession: "",
    phoneNo: "",
  });

  const fetchSpeakers = async () => {
    try {
      setLoading(true);

      // Get event data to get category
      const eventDoc = await getDoc(doc(db, "events", eventId));
      let eventData: any;
      if (eventDoc.exists()) {
        eventData = eventDoc.data();
        setEventCategory(eventData.category || "");
      }

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

      // Get suggested speaker based on event category
      if (eventData) {
        getSuggestedSpeaker(eventData.category);
      }
    } catch (error) {
      console.error("Error fetching speakers:", error);
      toast.error("Failed to load speakers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedSpeaker = (category: string) => {
    // Filter speakers by category
    const matchingSpeakers = speakersData.filter(
      (speaker) => speaker.category.toLowerCase() === category.toLowerCase()
    );

    if (matchingSpeakers.length > 0) {
      // Get a random speaker from matching ones
      const randomIndex = Math.floor(Math.random() * matchingSpeakers.length);
      setSuggestedSpeaker(matchingSpeakers[randomIndex]);
    } else {
      // If no matching speakers, get a random one
      const randomIndex = Math.floor(Math.random() * speakersData.length);
      setSuggestedSpeaker(speakersData[randomIndex]);
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
        phoneNo: newSpeaker.phoneNo || "",
        createdAt: serverTimestamp(),
      });

      toast.success(`${newSpeaker.name} has been added as a speaker.`);

      // Reset form
      setNewSpeaker({
        name: "",
        profession: "",
        phoneNo: "",
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

  const handleAddSuggestedSpeaker = async () => {
    if (!suggestedSpeaker) return;

    try {
      setAdding(true);

      await addDoc(collection(db, "speakers"), {
        eventId,
        name: suggestedSpeaker.name,
        profession: suggestedSpeaker.profession,
        phoneNo: suggestedSpeaker.phoneNo || "",
        createdAt: serverTimestamp(),
      });

      toast.success(`${suggestedSpeaker.name} has been added as a speaker.`);
      setShowSuggestedDialog(false);

      // Refresh speakers list
      fetchSpeakers();
    } catch (error) {
      console.error("Error adding suggested speaker:", error);
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
        {/* Suggested Speaker */}
        {suggestedSpeaker && (
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Suggested Speaker</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuggestedDialog(true)}
              >
                View Details
              </Button>
            </div>
          </div>
        )}

        {/* Suggested Speaker Dialog */}
        <Dialog
          open={showSuggestedDialog}
          onOpenChange={setShowSuggestedDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suggested Speaker</DialogTitle>
              <DialogDescription>
                Contact this speaker before adding them to your event.
              </DialogDescription>
            </DialogHeader>

            {suggestedSpeaker && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>
                      {suggestedSpeaker.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">
                      {suggestedSpeaker.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {suggestedSpeaker.profession}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Contact:</span>
                    <span>{suggestedSpeaker.phoneNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Category:</span>
                    <span>{suggestedSpeaker.category}</span>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md text-sm">
                  <p className="text-amber-800 dark:text-amber-300">
                    Please contact the speaker before adding them to confirm
                    their availability and interest in participating in your
                    event.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSuggestedDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddSuggestedSpeaker} disabled={adding}>
                {adding ? "Adding..." : "Add to Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

          <div className="space-y-2">
            <Label htmlFor="phoneNo">Phone Number</Label>
            <Input
              id="phoneNo"
              name="phoneNo"
              placeholder="Enter phone number"
              value={newSpeaker.phoneNo}
              onChange={handleInputChange}
            />
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-sm text-muted-foreground">
                          {speaker.profession}
                        </span>
                      </div>
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

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
import { DollarSign, Plus, Trash2, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { useAuth } from "@/context/AuthContext";
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
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import type { Sponsor } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import sponsorsData from "@/lib/db/sponsors.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SponsorsManagementProps {
  eventId: string;
}

export function SponsorsManagement({ eventId }: SponsorsManagementProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [sponsorshipGoal, setSponsorshipGoal] = useState(0);
  const [currentSponsorship, setCurrentSponsorship] = useState(0);

  const [suggestedSponsor, setSuggestedSponsor] = useState<any | null>(null);
  const [showSuggestedDialog, setShowSuggestedDialog] = useState(false);

  const [newSponsor, setNewSponsor] = useState({
    name: "",
    phoneNo: "",
    amount: 0,
    logoURL: "",
  });

  const fetchSponsors = async () => {
    try {
      setLoading(true);

      // Get event data to get sponsorship goal
      const eventDoc = await getDoc(doc(db, "events", eventId));
      let eventData;
      if (eventDoc.exists()) {
        eventData = eventDoc.data();
        setSponsorshipGoal(eventData.sponsorshipGoal || 0);
      } else {
        eventData = {};
      }

      // Get sponsors
      const sponsorsQuery = query(
        collection(db, "sponsors"),
        where("eventId", "==", eventId)
      );

      const sponsorsSnapshot = await getDocs(sponsorsQuery);
      const sponsorsData: Sponsor[] = [];
      let totalSponsorship = 0;

      sponsorsSnapshot.forEach((doc) => {
        const data = doc.data();
        const sponsor: Sponsor = {
          id: doc.id,
          eventId: data.eventId,
          name: data.name,
          phoneNo: data.phoneNo,
          logoURL: data.logoURL,
          amount: data.amount,
          addedAt: data.addedAt.toDate().toISOString(),
        };
        sponsorsData.push(sponsor);
        totalSponsorship += data.amount;
      });

      setSponsors(sponsorsData);
      setCurrentSponsorship(totalSponsorship);

      // Update event with current sponsorship amount
      await updateDoc(doc(db, "events", eventId), {
        currentSponsorship: totalSponsorship,
        updatedAt: new Date(),
      });

      // Get suggested sponsor based on event category
      getSuggestedSponsor(eventData.category);
    } catch (error) {
      console.error("Error fetching sponsors:", error);
      toast.error("Failed to load sponsors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedSponsor = (category: string) => {
    // Filter sponsors by category
    const matchingSponsors = sponsorsData.filter(
      (sponsor) => sponsor.category.toLowerCase() === category.toLowerCase()
    );

    if (matchingSponsors.length > 0) {
      // Get a random sponsor from matching ones
      const randomIndex = Math.floor(Math.random() * matchingSponsors.length);
      setSuggestedSponsor(matchingSponsors[randomIndex]);
    } else {
      // If no matching sponsors, get a random one
      const randomIndex = Math.floor(Math.random() * sponsorsData.length);
      setSuggestedSponsor(sponsorsData[randomIndex]);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, [eventId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSponsor((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number.parseFloat(value) || 0 : value,
    }));
  };

  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSponsor.name || !newSponsor.phoneNo || newSponsor.amount <= 0) {
      toast.error("Please provide all required sponsor information.");
      return;
    }

    try {
      setAdding(true);

      await addDoc(collection(db, "sponsors"), {
        eventId,
        name: newSponsor.name,
        phoneNo: newSponsor.phoneNo,
        logoURL: newSponsor.logoURL || null,
        amount: newSponsor.amount,
        addedAt: serverTimestamp(),
      });

      toast.success(`${newSponsor.name} has been added as a sponsor.`);

      // Reset form
      setNewSponsor({
        name: "",
        phoneNo: "",
        amount: 0,
        logoURL: "",
      });

      // Refresh sponsors list
      fetchSponsors();
    } catch (error) {
      console.error("Error adding sponsor:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add sponsor"
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveSponsor = async (
    sponsorId: string,
    sponsorName: string
  ) => {
    try {
      await deleteDoc(doc(db, "sponsors", sponsorId));

      toast.success(`${sponsorName} has been removed from the sponsors list.`);

      // Refresh sponsors list
      fetchSponsors();
    } catch (error) {
      console.error("Error removing sponsor:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove sponsor"
      );
    }
  };

  const handleAddSuggestedSponsor = async () => {
    if (!suggestedSponsor) return;

    try {
      setAdding(true);

      await addDoc(collection(db, "sponsors"), {
        eventId,
        name: suggestedSponsor.name,
        phoneNo: suggestedSponsor.phoneNo,
        logoURL: suggestedSponsor.logoURL || null,
        amount: suggestedSponsor.amount,
        addedAt: serverTimestamp(),
      });

      toast.success(`${suggestedSponsor.name} has been added as a sponsor.`);
      setShowSuggestedDialog(false);

      // Refresh sponsors list
      fetchSponsors();
    } catch (error) {
      console.error("Error adding suggested sponsor:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add sponsor"
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Event Sponsors
        </CardTitle>
        <CardDescription>
          Add and manage sponsors for your event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sponsorship Progress */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">
              Sponsorship Goal: ₹{sponsorshipGoal.toLocaleString()}
            </span>
            <span className="text-sm font-medium">
              Current: ₹{currentSponsorship.toLocaleString()}
            </span>
          </div>
          <Progress
            value={
              sponsorshipGoal > 0
                ? Math.min(100, (currentSponsorship / sponsorshipGoal) * 100)
                : 0
            }
            className="h-2"
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {(sponsorshipGoal > 0
                ? Math.min(100, (currentSponsorship / sponsorshipGoal) * 100)
                : 0
              ).toFixed(0)}
              % Complete
            </span>
            <span className="text-muted-foreground">
              Remaining: ₹
              {Math.max(
                0,
                sponsorshipGoal - currentSponsorship
              ).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Suggested Sponsor */}
        {suggestedSponsor && (
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Suggested Sponsor</h3>
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

        {/* Suggested Sponsor Dialog */}
        <Dialog
          open={showSuggestedDialog}
          onOpenChange={setShowSuggestedDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suggested Sponsor</DialogTitle>
              <DialogDescription>
                Contact this sponsor before adding them to your event.
              </DialogDescription>
            </DialogHeader>

            {suggestedSponsor && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={suggestedSponsor.logoURL}
                      alt={suggestedSponsor.name}
                    />
                    <AvatarFallback>
                      {suggestedSponsor.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">
                      {suggestedSponsor.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Category: {suggestedSponsor.category}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Contact:</span>
                    <span>{suggestedSponsor.phoneNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Estimated Amount:</span>
                    <span className="text-green-600 font-medium">
                      ₹{suggestedSponsor.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md text-sm">
                  <p className="text-amber-800 dark:text-amber-300">
                    Please contact the sponsor before adding them to confirm
                    their participation and sponsorship amount.
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
              <Button onClick={handleAddSuggestedSponsor} disabled={adding}>
                {adding ? "Adding..." : "Add to Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add new sponsor form */}
        <form onSubmit={handleAddSponsor} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Sponsor Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter sponsor name"
                value={newSponsor.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNo">Phone Number</Label>
              <Input
                id="phoneNo"
                name="phoneNo"
                placeholder="Enter phone number"
                value={newSponsor.phoneNo}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Sponsorship Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={newSponsor.amount || ""}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoURL">Sponsor Logo URL</Label>
              <Input
                id="logoURL"
                name="logoURL"
                placeholder="Enter logo image URL"
                value={newSponsor.logoURL}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <Button type="submit" disabled={adding} className="gap-2">
            <Plus className="h-4 w-4" />
            {adding ? "Adding..." : "Add Sponsor"}
          </Button>
        </form>

        {/* Sponsors list */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Current Sponsors</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading sponsors...</p>
          ) : sponsors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sponsors added yet
            </p>
          ) : (
            <div className="space-y-3">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {sponsor.logoURL ? (
                        <AvatarImage src={sponsor.logoURL} alt={sponsor.name} />
                      ) : null}
                      <AvatarFallback>
                        {sponsor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{sponsor.name}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-xs text-muted-foreground">
                          {sponsor.phoneNo}
                        </span>
                        <span className="hidden sm:inline text-xs text-muted-foreground">
                          •
                        </span>
                        <span className="text-xs font-medium text-green-600">
                          ₹{sponsor.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleRemoveSponsor(sponsor.id, sponsor.name)
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

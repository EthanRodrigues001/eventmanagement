"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ToggleRegistrationsButton } from "@/components/events/toggle-registrations-button";
import { SpeakersManagement } from "@/components/events/speakers-management";
import { OrganizingTeamManagement } from "@/components/events/organizing-team-management";
import { Users, Mic2, Settings, DollarSign } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import type { Event } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_CATEGORIES } from "@/lib/types";
import { PublishButton } from "@/components/events/event-publish-button";
import { SponsorsManagement } from "@/components/events/sponsors-management";
import { WinnersManagement } from "@/components/events/winners-management";
import { Trophy, Image } from "lucide-react";

export default function EventManagePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: 0,
    eligibility: "",
    location: "",
    sponsorshipGoal: 0,
    logoURL: "",
    bannerURL: "",
  });

  // Get the tab from URL or default to "details"
  const defaultTab = searchParams.get("tab") || "details";

  const fetchEvent = async () => {
    try {
      setLoading(true);

      if (!eventId) {
        toast.error("Event ID is missing");
        return;
      }

      const eventDoc = await getDoc(doc(db, "events", eventId));

      if (!eventDoc.exists()) {
        toast.error("Event not found");
        return;
      }

      const eventData = eventDoc.data();

      // Format dates for display
      const formattedEvent: Event = {
        id: eventDoc.id,
        title: eventData.title,
        description: eventData.description,
        logoURL: eventData.logoURL,
        bannerURL: eventData.bannerURL,
        category: eventData.category,
        price: eventData.price,
        registrations: eventData.registrations,
        eligibility: eventData.eligibility || "",
        location: eventData.location,
        startDate: eventData.startDate.toDate().toISOString(),
        endDate: eventData.endDate.toDate().toISOString(),
        sponsorshipGoal: eventData.sponsorshipGoal,
        currentSponsorship: eventData.currentSponsorship,
        isPublished: eventData.isPublished,
        createdBy: eventData.createdBy,
        createdAt: eventData.createdAt.toDate().toISOString(),
        updatedAt: eventData.updatedAt.toDate().toISOString(),
      };

      setEvent(formattedEvent);

      // Initialize form data
      setFormData({
        title: formattedEvent.title,
        description: formattedEvent.description,
        category: formattedEvent.category,
        price: formattedEvent.price,
        eligibility: formattedEvent.eligibility || "",
        location: formattedEvent.location,
        sponsorshipGoal: formattedEvent.sponsorshipGoal,
        logoURL: formattedEvent.logoURL || "",
        bannerURL: formattedEvent.bannerURL || "",
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error("Failed to load event details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleToggleRegistrations = (isOpen: boolean) => {
    if (event) {
      setEvent({ ...event, registrations: isOpen });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "sponsorshipGoal"
          ? Number.parseFloat(value) || 0
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveDetails = async () => {
    try {
      setSaving(true);

      if (!eventId) {
        toast.error("Event ID is missing");
        return;
      }

      await updateDoc(doc(db, "events", eventId), {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: formData.price,
        eligibility: formData.eligibility,
        location: formData.location,
        sponsorshipGoal: formData.sponsorshipGoal,
        logoURL: formData.logoURL || null,
        bannerURL: formData.bannerURL || null,
        updatedAt: new Date(),
      });

      toast.success("Event details updated successfully");

      // Update local event state
      if (event) {
        setEvent({
          ...event,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          eligibility: formData.eligibility,
          location: formData.location,
          sponsorshipGoal: formData.sponsorshipGoal,
          logoURL: formData.logoURL || null,
          bannerURL: formData.bannerURL || null,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    try {
      setSaving(true);

      if (!eventId) {
        toast.error("Event ID is missing");
        return;
      }

      const newPublishState = !event?.isPublished;

      await updateDoc(doc(db, "events", eventId), {
        isPublished: newPublishState,
        updatedAt: new Date(),
      });

      toast.success(
        newPublishState
          ? "Event published successfully"
          : "Event unpublished successfully"
      );

      // Update local event state
      if (event) {
        setEvent({
          ...event,
          isPublished: newPublishState,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error toggling publish state:", error);
      toast.error("Failed to update publish state. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <p className="text-muted-foreground">
          The event you are looking for does not exist or you do not have
          permission to manage it.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 my-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground">
            Manage your event details, team, and speakers
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToggleRegistrationsButton
            eventId={eventId || ""}
            registrationsOpen={event.registrations}
            onToggle={handleToggleRegistrations}
          />
          <PublishButton
            eventId={eventId || ""}
            isPublished={event?.isPublished || false}
            onPublishChange={handlePublishToggle}
          />
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Media</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="speakers" className="flex items-center gap-2">
            <Mic2 className="h-4 w-4" />
            <span className="hidden sm:inline">Speakers</span>
          </TabsTrigger>
          <TabsTrigger value="sponsors" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Sponsors</span>
          </TabsTrigger>
          <TabsTrigger value="winners" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Winners</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Update your event information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleSelectChange("category", value)
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="capitalize"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={6}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveDetails} disabled={saving}>
                    {saving ? "Saving..." : "Save Details"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Media</CardTitle>
              <CardDescription>
                Update your event logo and banner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logoURL">Logo URL</Label>
                  <Input
                    id="logoURL"
                    name="logoURL"
                    value={formData.logoURL}
                    onChange={handleInputChange}
                    placeholder="Enter logo image URL"
                  />
                  {formData.logoURL && (
                    <div className="mt-2 p-2 border rounded-md">
                      <p className="text-sm mb-2">Preview:</p>
                      <div className="h-20 w-20 rounded-full overflow-hidden border">
                        <img
                          src={formData.logoURL || "/placeholder.svg"}
                          alt="Logo preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder.svg?height=80&width=80";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bannerURL">Banner URL</Label>
                  <Input
                    id="bannerURL"
                    name="bannerURL"
                    value={formData.bannerURL}
                    onChange={handleInputChange}
                    placeholder="Enter banner image URL"
                  />
                  {formData.bannerURL && (
                    <div className="mt-2 p-2 border rounded-md">
                      <p className="text-sm mb-2">Preview:</p>
                      <div className="h-40 w-full rounded overflow-hidden border">
                        <img
                          src={formData.bannerURL || "/placeholder.svg"}
                          alt="Banner preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder.svg?height=160&width=600";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveDetails} disabled={saving}>
                    {saving ? "Saving..." : "Save Media"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <OrganizingTeamManagement eventId={eventId || ""} />
        </TabsContent>

        <TabsContent value="speakers" className="mt-6">
          <SpeakersManagement eventId={eventId || ""} />
        </TabsContent>

        <TabsContent value="sponsors" className="mt-6">
          <SponsorsManagement eventId={eventId || ""} />
        </TabsContent>

        <TabsContent value="winners" className="mt-6">
          <WinnersManagement eventId={eventId || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

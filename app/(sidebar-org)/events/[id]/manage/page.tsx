"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_CATEGORIES } from "@/lib/types";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import type { Event } from "@/lib/types";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

export default function EventDetailsPage() {
  const params = useParams();
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
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const eventId = Array.isArray(params.id)
          ? params.id[0]
          : params.id || "";

        if (!eventId) {
          toast.error("Invalid event ID");
          return;
        }
        const eventDoc = await getDoc(doc(db, "events", eventId));

        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
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
          });
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        toast.error("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

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
      const eventId = Array.isArray(params.id) ? params.id[0] : params.id || "";

      if (!eventId) {
        toast.error("Invalid event ID");
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

  if (loading || !event) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="h-6 w-1/3 animate-pulse rounded-md bg-muted"></div>
              <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-10 animate-pulse rounded-md bg-muted"></div>
                <div className="h-32 animate-pulse rounded-md bg-muted"></div>
                <div className="h-10 animate-pulse rounded-md bg-muted"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Event Overview</CardTitle>
              <CardDescription>
                Key information about your event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                  <Calendar className="mb-2 h-8 w-8 text-primary" />
                  <h3 className="text-lg font-medium">Event Date</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(event.startDate)}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                  <Clock className="mb-2 h-8 w-8 text-primary" />
                  <h3 className="text-lg font-medium">Duration</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(event.startDate)} - {formatTime(event.endDate)}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                  <MapPin className="mb-2 h-8 w-8 text-primary" />
                  <h3 className="text-lg font-medium">Location</h3>
                  <p className="text-sm text-muted-foreground">
                    {event.location}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                  <Users className="mb-2 h-8 w-8 text-primary" />
                  <h3 className="text-lg font-medium">Status</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        event.isPublished ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    ></span>
                    <p className="text-sm text-muted-foreground">
                      {event.isPublished ? "Published" : "Draft"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
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

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Prize Amount (₹)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sponsorshipGoal">
                      Sponsorship Goal (₹)
                    </Label>
                    <Input
                      id="sponsorshipGoal"
                      name="sponsorshipGoal"
                      type="number"
                      min="0"
                      value={formData.sponsorshipGoal}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eligibility">Eligibility</Label>
                    <Input
                      id="eligibility"
                      name="eligibility"
                      placeholder="e.g., Engineering Students • MBA Students"
                      value={formData.eligibility}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveDetails} disabled={saving}>
                    {saving ? "Saving..." : "Save Details"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

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
import { Button } from "@/components/ui/button";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import type { Event } from "@/lib/types";
import { Image } from "lucide-react";

export default function MediaPage() {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    logoURL: "",
    bannerURL: "",
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        if (!eventId) {
          throw new Error("Event ID is undefined");
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
            logoURL: formattedEvent.logoURL || "",
            bannerURL: formattedEvent.bannerURL || "",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveMedia = async () => {
    try {
      setSaving(true);

      if (!eventId) {
        throw new Error("Event ID is undefined");
      }
      await updateDoc(doc(db, "events", eventId), {
        logoURL: formData.logoURL || null,
        bannerURL: formData.bannerURL || null,
        updatedAt: new Date(),
      });

      toast.success("Event media updated successfully");

      // Update local event state
      if (event) {
        setEvent({
          ...event,
          logoURL: formData.logoURL || null,
          bannerURL: formData.bannerURL || null,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error updating event media:", error);
      toast.error("Failed to update event media. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="h-6 w-1/3 animate-pulse rounded-md bg-muted"></div>
            <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 animate-pulse rounded-md bg-muted"></div>
              <div className="h-40 animate-pulse rounded-md bg-muted"></div>
              <div className="h-10 animate-pulse rounded-md bg-muted"></div>
              <div className="h-40 animate-pulse rounded-md bg-muted"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Media</CardTitle>
          <CardDescription>Update your event logo and banner</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="space-y-4">
              <Label htmlFor="logoURL">Logo URL</Label>
              <Input
                id="logoURL"
                name="logoURL"
                value={formData.logoURL}
                onChange={handleInputChange}
                placeholder="Enter logo image URL"
              />
              {formData.logoURL && (
                <div className="mt-2 rounded-md border p-4">
                  <p className="mb-2 text-sm font-medium">Preview:</p>
                  <div className="flex items-center justify-center">
                    <div className="h-32 w-32 overflow-hidden rounded-full border">
                      <img
                        src={formData.logoURL || "/placeholder.svg"}
                        alt="Logo preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder.svg?height=128&width=128";
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="bannerURL">Banner URL</Label>
              <Input
                id="bannerURL"
                name="bannerURL"
                value={formData.bannerURL}
                onChange={handleInputChange}
                placeholder="Enter banner image URL"
              />
              {formData.bannerURL && (
                <div className="mt-2 rounded-md border p-4">
                  <p className="mb-2 text-sm font-medium">Preview:</p>
                  <div className="aspect-video w-full overflow-hidden rounded-md border">
                    <img
                      src={formData.bannerURL || "/placeholder.svg"}
                      alt="Banner preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/placeholder.svg?height=300&width=800";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveMedia} disabled={saving}>
                {saving ? "Saving..." : "Save Media"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media Guidelines</CardTitle>
          <CardDescription>Recommendations for optimal display</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-start space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Image className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Logo</h3>
                <p className="text-sm text-muted-foreground">
                  Recommended size: 200x200 pixels, square format
                </p>
                <p className="text-sm text-muted-foreground">
                  Use a clear, high-contrast image that represents your event
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Image className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Banner</h3>
                <p className="text-sm text-muted-foreground">
                  Recommended size: 1200x400 pixels, 3:1 ratio
                </p>
                <p className="text-sm text-muted-foreground">
                  Use a high-quality image that captures the essence of your
                  event
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatDate } from "@/lib/utils";
import type { Event } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { EventDetail } from "@/components/event-detail";

export default function MyEventsPage() {
  const { user } = useAuth();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSelectEvent = (eventId: string) => {
    const event = myEvents.find((e) => e.id === eventId);
    setSelectedEvent(event || null);
  };

  const fetchMyEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get events where user is a participant
      const participantsQuery = query(
        collection(db, "eventParticipants"),
        where("userId", "==", user.uid)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const eventIds = participantsSnapshot.docs.map(
        (doc) => doc.data().eventId
      );

      if (eventIds.length === 0) {
        setMyEvents([]);
        setLoading(false);
        return;
      }

      // Get event details
      const eventsData: Event[] = [];

      // Process in batches of 10 due to Firestore limitations
      for (let i = 0; i < eventIds.length; i += 10) {
        const batch = eventIds.slice(i, i + 10);
        const eventsQuery = query(
          collection(db, "events"),
          where("__name__", "in", batch)
        );

        const eventsSnapshot = await getDocs(eventsQuery);

        eventsSnapshot.forEach((doc) => {
          const data = doc.data();
          eventsData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            logoURL: data.logoURL,
            bannerURL: data.bannerURL,
            category: data.category,
            price: data.price,
            registrations: data.registrations,
            eligibility: data.eligibility || "",
            location: data.location,
            startDate: data.startDate.toDate().toISOString(),
            endDate: data.endDate.toDate().toISOString(),
            sponsorshipGoal: data.sponsorshipGoal,
            currentSponsorship: data.currentSponsorship,
            isPublished: data.isPublished,
            createdBy: data.createdBy,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
          });
        });
      }

      setMyEvents(eventsData);

      // If there are events, set the first one as selected
      if (eventsData.length > 0) {
        setSelectedEvent(eventsData[0]);
      }

      // Get user's most participated categories
      const categoryCounts: Record<string, number> = {};
      eventsData.forEach((event) => {
        if (event.category) {
          categoryCounts[event.category] =
            (categoryCounts[event.category] || 0) + 1;
        }
      });

      // Sort categories by count
      const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map((entry) => entry[0]);

      // Get suggested events based on user's preferred categories
      if (sortedCategories.length > 0) {
        const suggestedQuery = query(
          collection(db, "events"),
          where("isPublished", "==", true),
          where("category", "==", sortedCategories[0]),
          orderBy("startDate", "desc")
        );

        const suggestedSnapshot = await getDocs(suggestedQuery);
        const suggestedData: Event[] = [];

        suggestedSnapshot.forEach((doc) => {
          // Skip events the user is already participating in
          if (eventIds.includes(doc.id)) return;

          const data = doc.data();
          suggestedData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            logoURL: data.logoURL,
            bannerURL: data.bannerURL,
            category: data.category,
            price: data.price,
            registrations: data.registrations,
            eligibility: data.eligibility || "",
            location: data.location,
            startDate: data.startDate.toDate().toISOString(),
            endDate: data.endDate.toDate().toISOString(),
            sponsorshipGoal: data.sponsorshipGoal,
            currentSponsorship: data.currentSponsorship,
            isPublished: data.isPublished,
            createdBy: data.createdBy,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
          });
        });

        setSuggestedEvents(suggestedData.slice(0, 5)); // Limit to 5 suggestions
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, [user]);

  const handleRegister = async (eventId: string) => {
    if (!user) return;

    try {
      // Check if already registered
      const participantsQuery = query(
        collection(db, "eventParticipants"),
        where("eventId", "==", eventId),
        where("userId", "==", user.uid)
      );

      const participantsSnapshot = await getDocs(participantsQuery);

      if (!participantsSnapshot.empty) {
        toast.error("You are already registered for this event");
        return;
      }

      // Register for the event
      await addDoc(collection(db, "eventParticipants"), {
        eventId,
        userId: user.uid,
        registeredAt: new Date(),
      });

      toast.success("Successfully registered for the event");

      // Refresh events
      fetchMyEvents();
    } catch (error) {
      console.error("Error registering for event:", error);
      toast.error("Failed to register for the event. Please try again.");
    }
  };

  return (
    <div>
      <Header searchPlaceholder="Search events..." />

      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="rounded-lg border p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))
                ) : myEvents.length > 0 ? (
                  myEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border p-4">
                      <h3 className="text-lg font-medium">{event.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      <Button
                        variant="link"
                        className="mt-2 px-0"
                        onClick={() => handleSelectEvent(event.id)}
                      >
                        Know more
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-muted-foreground">
                      You haven&apos;t joined any events yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="rounded-lg border p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))
                ) : suggestedEvents.length > 0 ? (
                  suggestedEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border p-4">
                      <h3 className="text-lg font-medium">{event.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(event.startDate)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegister(event.id)}
                          disabled={!event.registrations}
                        >
                          {event.registrations ? "Register" : "Closed"}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-muted-foreground">
                      No event suggestions available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Details of the Selected Event</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <EventDetail event={selectedEvent} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

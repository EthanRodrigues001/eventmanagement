"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyEventsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationCounts, setRegistrationCounts] = useState<
    Record<string, number>
  >({});
  const [isRegistered, setIsRegistered] = useState<Record<string, boolean>>({});

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

      // Get registration counts for each event
      const counts: Record<string, number> = {};
      const registeredStatus: Record<string, boolean> = {};

      for (const eventId of eventIds) {
        const participantsQuery = query(
          collection(db, "eventParticipants"),
          where("eventId", "==", eventId)
        );
        const participantsSnapshot = await getDocs(participantsQuery);
        counts[eventId] = participantsSnapshot.size;
        registeredStatus[eventId] = true;
      }

      setRegistrationCounts(counts);
      setIsRegistered(registeredStatus);

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

        setSuggestedEvents(suggestedData.slice(0, 6)); // Limit to 6 suggestions
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
    if (!user) {
      router.push("/login");
      return;
    }

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
        registeredAt: serverTimestamp(),
      });

      toast.success("Successfully registered for the event");

      // Update local state
      setIsRegistered({ ...isRegistered, [eventId]: true });
      setRegistrationCounts({
        ...registrationCounts,
        [eventId]: (registrationCounts[eventId] || 0) + 1,
      });

      // Refresh events
      fetchMyEvents();
    } catch (error) {
      console.error("Error registering for event:", error);
      toast.error("Failed to register for the event. Please try again.");
    }
  };

  // Function to determine event status
  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (now >= startDate && now <= endDate) {
      return "Live";
    } else if (now < startDate) {
      return "Upcoming";
    } else {
      return "Completed";
    }
  };

  return (
    <div className="container p-4 md:p-6">
      <div className="flex flex-col space-y-1.5 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Events</h1>
        <p className="text-muted-foreground">View and manage your events</p>
      </div>

      {selectedEvent ? (
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-0 z-10"
            onClick={() => setSelectedEvent(null)}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={
                      selectedEvent.bannerURL ||
                      "/placeholder.svg?height=400&width=600"
                    }
                    alt={selectedEvent.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
                      <Image
                        src={
                          selectedEvent.logoURL ||
                          "/placeholder.svg?height=64&width=64"
                        }
                        alt="Event logo"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedEvent.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedEvent.startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 flex flex-wrap gap-2">
                    <Badge>{getEventStatus(selectedEvent)}</Badge>
                    <Badge variant="outline">
                      {selectedEvent.registrations
                        ? "Registration Open"
                        : "Registration Closed"}
                    </Badge>
                    <Badge variant="outline">
                      {selectedEvent.isPublished ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {selectedEvent.category}
                    </Badge>
                  </div>

                  <div className="mb-6">
                    <h3 className="mb-2 text-lg font-medium">About</h3>
                    <p className="text-muted-foreground">
                      {selectedEvent.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <span>{selectedEvent.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span>
                        Event Date: {formatDate(selectedEvent.startDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span>
                        Duration:{" "}
                        {Math.ceil(
                          (new Date(selectedEvent.endDate).getTime() -
                            new Date(selectedEvent.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Registration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Status</span>
                      <Badge variant="outline">
                        {selectedEvent.registrations ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Price</span>
                      <span className="font-medium">
                        {selectedEvent.price > 0
                          ? `₹${selectedEvent.price}`
                          : "Free"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Registrations</span>
                      <span className="font-medium">
                        {registrationCounts[selectedEvent.id] || 0}
                      </span>
                    </div>
                    {isRegistered[selectedEvent.id] ? (
                      <Button className="w-full" disabled>
                        Already Registered
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleRegister(selectedEvent.id)}
                        disabled={!selectedEvent.registrations}
                      >
                        {selectedEvent.registrations
                          ? "Register Now"
                          : "Registration Closed"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg" alt="Organizer" />
                      <AvatarFallback>OP</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Event Organizer</p>
                      <p className="text-sm text-muted-foreground">
                        Created on {formatDate(selectedEvent.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => router.push(`/events/${selectedEvent.id}`)}
                  >
                    View Event Details
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="my-events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="my-events">My Events</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="my-events" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-40 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <div className="relative h-40 w-full">
                      <Image
                        src={
                          event.bannerURL ||
                          "/placeholder.svg?height=200&width=300"
                        }
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">
                          {getEventStatus(event)}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-medium">{event.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant="outline" className="capitalize">
                          {event.category}
                        </Badge>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-primary"
                          onClick={() => setSelectedEvent(event)}
                        >
                          Know more
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground">
                  You haven&apos;t joined any events yet
                </p>
                <Button className="mt-4" onClick={() => router.push("/events")}>
                  Browse Events
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-40 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : suggestedEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {suggestedEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <div className="relative h-40 w-full">
                      <Image
                        src={
                          event.bannerURL ||
                          "/placeholder.svg?height=200&width=300"
                        }
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-medium">{event.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant="outline" className="capitalize">
                          {event.category}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRegister(event.id)}
                          disabled={
                            !event.registrations || isRegistered[event.id]
                          }
                        >
                          {isRegistered[event.id]
                            ? "Registered"
                            : event.registrations
                            ? "Register"
                            : "Closed"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground">
                  No event suggestions available
                </p>
                <Button className="mt-4" onClick={() => router.push("/events")}>
                  Browse All Events
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

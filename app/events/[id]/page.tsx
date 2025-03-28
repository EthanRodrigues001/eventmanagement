"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, Clock, MapPin, Users, Trophy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDate, formatPrice, formatTime } from "@/lib/utils";
import type { Event } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [registrationsCount, setRegistrationsCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const fetchEventData = async () => {
    try {
      setLoading(true);

      // Fetch event details
      const eventResponse = await fetch(`/api/events/${id}`);

      if (!eventResponse.ok) {
        throw new Error("Failed to fetch event");
      }

      const eventData = await eventResponse.json();
      setEvent(eventData.event);
      setRegistrationsCount(eventData.registrationsCount);

      // Check if event is live
      const now = new Date();
      const startDate = new Date(eventData.event.startDate);
      const endDate = new Date(eventData.event.endDate);
      setIsLive(now >= startDate && now <= endDate);

      // Fetch speakers
      const speakersResponse = await fetch(
        `/api/events/speakers?eventId=${id}`
      );

      if (speakersResponse.ok) {
        const speakersData = await speakersResponse.json();
        setSpeakers(speakersData.speakers);
      }

      // Check if user is registered
      if (user) {
        const registrationResponse = await fetch(
          `/api/events/check-registration?eventId=${id}&userId=${user?.uid}`
        );

        if (registrationResponse.ok) {
          const registrationData = await registrationResponse.json();
          setIsRegistered(registrationData.isRegistered);
        }

        // Check if user is organizer
        if (eventData.event.createdBy === user.uid) {
          setIsOrganizer(true);
        } else {
          const organizerResponse = await fetch(
            `/api/events/organizing-team?eventId=${id}`
          );

          if (organizerResponse.ok) {
            const organizerData = await organizerResponse.json();
            setIsOrganizer(
              organizerData.teamMembers.some(
                (member: any) => member.userId === user.uid
              )
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
      toast.error("Error", {
        description: "Failed to load event details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id, user]);

  const handleRegister = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!event?.registrations) {
      toast.error("Registration Closed", {
        description: "Registration for this event is currently closed.",
      });
      return;
    }

    try {
      const response = await fetch("/api/events/participants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId: id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to register for event");
      }

      setIsRegistered(true);
      setRegistrationsCount((prev) => prev + 1);

      toast.success("Registration Successful", {
        description: "You have successfully registered for the event.",
      });
    } catch (error) {
      console.error("Error registering for event:", error);
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to register for event",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative w-full h-64 bg-black">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Skeleton className="h-12 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-6 w-1/3 mb-6" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center">
        <p className="text-xl">Event not found</p>
      </div>
    );
  }

  // Calculate registration deadline (2 days before event)
  const registrationDeadline = new Date(
    new Date(event.startDate).getTime() - 2 * 24 * 60 * 60 * 1000
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner */}
      <div className="relative w-full h-64 bg-black">
        <Image
          src={event.bannerURL || "/placeholder.svg?height=400&width=1200"}
          alt={event.title}
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent">
          <div className="container mx-auto px-4 py-6 text-white">
            <div className="flex justify-between items-start">
              <div className="mt-4">
                <p className="text-sm uppercase tracking-wider">
                  {event.createdBy ? event.createdBy.split(",")[0] : "EVENT"}{" "}
                  PRESENTS
                </p>
                <h1 className="text-4xl md:text-6xl font-bold mt-4">
                  {event.title}
                </h1>
                <div className="flex items-center mt-2 text-sm">
                  <p className="uppercase">{formatDate(event.startDate)}</p>
                  <div className="mx-4 text-white/70">•</div>
                  <p className="uppercase">
                    {event.category ? event.category.toUpperCase() : "EVENT"}
                  </p>
                  <div className="mx-4 text-white/70">•</div>
                  <p className="uppercase">
                    {event.price > 0
                      ? `PRIZE WORTH ₹${event.price}`
                      : "FREE EVENT"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Event Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
                <Image
                  src={event.logoURL || "/placeholder.svg?height=64&width=64"}
                  alt={`${event.title} logo`}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{event.title}</h2>
                <p className="text-muted-foreground">
                  {event.createdBy || "Organized by College"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {event.location}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Updated On: {formatDate(event.updatedAt)}
              </span>
            </div>

            {event.price > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">
                  Prizes worth ₹{event.price.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {event.category && (
                <Badge variant="outline" className="capitalize">
                  {event.category}
                </Badge>
              )}
              {isLive && (
                <Badge variant="outline" className="bg-red-500 text-white">
                  Live
                </Badge>
              )}
              {event.registrations ? (
                <Badge variant="outline" className="bg-green-500 text-white">
                  Registration Open
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-500 text-white">
                  Registration Closed
                </Badge>
              )}
            </div>

            <Tabs defaultValue="details" className="mb-8">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="dates">Dates & Deadlines</TabsTrigger>
                <TabsTrigger value="prizes">Prizes</TabsTrigger>
                <TabsTrigger value="speakers">Speakers</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{event.description}</p>
                </div>
              </TabsContent>

              <TabsContent value="dates" className="mt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Registration Opens</h3>
                      <p className="text-sm text-muted-foreground">
                        Start accepting participant registrations
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatDate(
                          new Date(
                            new Date(event.startDate).getTime() -
                              30 * 24 * 60 * 60 * 1000
                          ).toISOString()
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">09:00 AM</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Registration Closes</h3>
                      <p className="text-sm text-muted-foreground">
                        Last date to register for the event
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatDate(registrationDeadline.toISOString())}
                      </p>
                      <p className="text-sm text-muted-foreground">11:59 PM</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Event Starts</h3>
                      <p className="text-sm text-muted-foreground">
                        Official commencement of the event
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatDate(event.startDate)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(event.startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Event Ends</h3>
                      <p className="text-sm text-muted-foreground">
                        Conclusion of all event activities
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatDate(event.endDate)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(event.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="prizes" className="mt-4">
                {event.price > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 text-center">
                      <div className="flex justify-center mb-2">
                        <Trophy className="h-10 w-10 text-yellow-500" />
                      </div>
                      <h3 className="font-bold text-lg">1st Prize</h3>
                      <p className="text-xl font-medium mt-2">
                        ₹{Math.floor(event.price * 0.5).toLocaleString()}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <div className="flex justify-center mb-2">
                        <Trophy className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="font-bold text-lg">2nd Prize</h3>
                      <p className="text-xl font-medium mt-2">
                        ₹{Math.floor(event.price * 0.3).toLocaleString()}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <div className="flex justify-center mb-2">
                        <Trophy className="h-10 w-10 text-amber-700" />
                      </div>
                      <h3 className="font-bold text-lg">3rd Prize</h3>
                      <p className="text-xl font-medium mt-2">
                        ₹{Math.floor(event.price * 0.2).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-muted-foreground">
                      This is a free event without cash prizes.
                    </p>
                    <p className="mt-2">
                      Participants will receive certificates of participation.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="speakers" className="mt-4">
                {speakers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {speakers.map((speaker) => (
                      <div
                        key={speaker.id}
                        className="flex items-center gap-3 p-4 border rounded-md"
                      >
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted">
                          <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                            {speaker.name.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{speaker.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {speaker.profession}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-muted-foreground">
                      No speakers have been announced yet.
                    </p>
                    {isOrganizer && (
                      <Button
                        className="mt-4"
                        onClick={() =>
                          router.push(`/events/${id}/manage?tab=speakers`)
                        }
                      >
                        Add Speakers
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Registration */}
          <div className="md:col-span-1">
            <div className="sticky top-4 border rounded-lg overflow-hidden">
              <div className="bg-muted p-4">
                {isLive ? (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <p className="text-sm font-medium">Live</p>
                  </div>
                ) : event.registrations ? (
                  <p className="text-sm text-green-500 font-medium mb-2">
                    Registration open
                  </p>
                ) : (
                  <p className="text-sm text-yellow-500 font-medium mb-2">
                    Registration closed
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Event information
                </p>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">
                    {formatPrice(event.price)}
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {isOrganizer ? (
                  <Button
                    className="w-full mb-4"
                    onClick={() => router.push(`/events/${id}/manage`)}
                  >
                    Manage Event
                  </Button>
                ) : isRegistered ? (
                  <Button className="w-full mb-4" disabled>
                    Already Registered
                  </Button>
                ) : (
                  <Button
                    className="w-full mb-4"
                    onClick={handleRegister}
                    disabled={!event.registrations}
                  >
                    {event.registrations
                      ? "Register Now"
                      : "Registration Closed"}
                  </Button>
                )}

                <div className="space-y-4 mt-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Event Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Team Size</p>
                      <p className="text-sm text-muted-foreground">
                        1-4 Members
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Registrations</p>
                      <p className="text-sm text-muted-foreground">
                        {registrationsCount}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Registration Deadline
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(registrationDeadline.toISOString())}, 11:59
                        PM
                      </p>
                    </div>
                  </div>
                </div>

                {event.eligibility && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium mb-2">Eligibility</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.eligibility}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

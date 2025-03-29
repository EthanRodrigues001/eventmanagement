"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Trophy, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import type { Event } from "@/lib/types";
import Link from "next/link";

interface EventDetailProps {
  event: Event | null;
}

export function EventDetail({ event }: EventDetailProps) {
  if (!event) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">Select an event to view details</p>
      </div>
    );
  }

  const isLive = (() => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    return now >= startDate && now <= endDate;
  })();

  // Calculate registration deadline (2 days before event)
  const registrationDeadline = new Date(
    new Date(event.startDate).getTime() - 2 * 24 * 60 * 60 * 1000
  );

  return (
    <div className="space-y-6">
      <div className="aspect-video overflow-hidden rounded-lg bg-muted">
        <img
          src={event.bannerURL || "/placeholder.svg?height=400&width=800"}
          alt={event.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
            <img
              src={event.logoURL || "/placeholder.svg?height=48&width=48"}
              alt={`${event.title} logo`}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold">{event.title}</h2>
            <p className="text-sm text-muted-foreground">
              {formatDate(event.startDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
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
          {event.isPublished ? (
            <Badge variant="outline" className="bg-blue-500 text-white">
              Published
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-500 text-white">
              Draft
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {event.description}
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">{event.location}</p>
            </div>
          </div>

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
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Event Time</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(event.startDate)} - {formatTime(event.endDate)}
              </p>
            </div>
          </div>

          {event.price > 0 && (
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Prize</p>
                <p className="text-sm text-muted-foreground">
                  ₹{event.price.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {event.eligibility && (
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Eligibility</p>
                <p className="text-sm text-muted-foreground">
                  {event.eligibility}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t flex justify-between">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Link href={`/events/${event.id}`}>
            <Button size="sm">View Details</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

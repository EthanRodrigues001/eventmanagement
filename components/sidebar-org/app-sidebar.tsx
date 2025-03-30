"use client";

import type * as React from "react";
import {
  DollarSign,
  FileText,
  Mic2,
  Settings,
  Trophy,
  Users,
  ListTodo,
  UserPlus,
  Share2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { TeamSwitcher } from "./team-switcher";

import { NavUser } from "./nav-user";
import { NavProjects } from "./nav-projects";
import type { Event } from "@/lib/types";
import Link from "next/link";
import { Button } from "../ui/button";
import { PublishButton } from "../events/event-publish-button";
import { ToggleRegistrationsButton } from "../events/toggle-registrations-button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
// import { usePathname } from "next/navigation";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  eventId: string;
}

export function AppSidebar({ eventId, ...props }: AppSidebarProps) {
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!eventId) return;

    // Set up a real-time listener for the event document
    const unsubscribe = onSnapshot(
      doc(db, "events", eventId),
      (doc) => {
        if (doc.exists()) {
          const eventData = doc.data();
          // Format dates for display
          const formattedEvent: Event = {
            id: doc.id,
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
        }
      },
      (error) => {
        console.error("Error fetching event:", error);
        toast.error("Failed to load event details. Please try again.");
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [eventId]);

  const navItems = [
    {
      name: "Details",
      url: `/events/${eventId}/manage`,
      icon: Settings,
    },
    {
      name: "Media",
      url: `/events/${eventId}/manage/media`,
      icon: FileText,
    },
    {
      name: "Team",
      url: `/events/${eventId}/manage/team`,
      icon: Users,
    },
    {
      name: "Speakers",
      url: `/events/${eventId}/manage/speakers`,
      icon: Mic2,
    },
    {
      name: "Sponsors",
      url: `/events/${eventId}/manage/sponsors`,
      icon: DollarSign,
    },
    {
      name: "Winners",
      url: `/events/${eventId}/manage/winners`,
      icon: Trophy,
    },
    {
      name: "Tasks",
      url: `/events/${eventId}/manage/tasks`,
      icon: ListTodo,
    },
    {
      name: "Participants",
      url: `/events/${eventId}/manage/participants`,
      icon: UserPlus,
    },
    {
      name: "Files",
      url: `/events/${eventId}/manage/files`,
      icon: FileText,
    },
    {
      name: "Social Media",
      url: `/events/${eventId}/manage/social`,
      icon: Share2,
    },
  ];

  const handleToggleRegistrations = (isOpen: boolean) => {
    if (event) {
      setEvent({ ...event, registrations: isOpen });
    }
  };

  const handlePublishChange = (isPublished: boolean) => {
    if (event) {
      setEvent({ ...event, isPublished });
    }
  };
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={navItems} />
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-2">
        <ToggleRegistrationsButton
          eventId={eventId}
          registrationsOpen={event?.registrations ?? false}
          onToggle={handleToggleRegistrations}
        />
        <PublishButton
          eventId={eventId}
          isPublished={event?.isPublished ?? false}
          onPublishChange={handlePublishChange}
          className="w-full"
        />
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/events/${eventId}`}>View Event</Link>
        </Button>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

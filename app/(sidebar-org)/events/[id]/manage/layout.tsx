"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { toast } from "sonner";
import { AppSidebar } from "@/components/sidebar-org/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useParams } from "next/navigation";
import type { Event } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    // Set up a real-time listener for the event document
    const unsubscribe = onSnapshot(
      doc(db, "events", eventId),
      (doc) => {
        if (doc.exists()) {
          setLoading(false);
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
        setLoading(false);
        console.error("Error fetching event:", error);
        toast.error("Failed to load event details. Please try again.");
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
    <SidebarProvider>
      <AppSidebar eventId={eventId || ""} />
      <SidebarInset>
        <div className="flex h-full flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger
                className="-ml-1"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              />
              <Separator
                orientation="vertical"
                className="h-4 w-1 bg-primary/20"
              />
              <h1
                className={`text-xl font-bold ${
                  !sidebarOpen ? "block" : "block"
                }`}
              >
                {event.title}
              </h1>
              <div
                className={`flex items-center gap-2 border rounded-lg border-primary/20 px-2 py-0.5 ${
                  !sidebarOpen ? "block" : "block"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    event.isPublished ? "bg-green-500" : "bg-yellow-500"
                  }`}
                ></span>
                <span className="text-xs text-muted-foreground">
                  {event.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
        {/* {children} */}
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { Badge, Certificate, Winner } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AchievementsPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's event participations
      const participationsQuery = query(
        collection(db, "eventParticipants"),
        where("userId", "==", user.uid)
      );

      const participationsSnapshot = await getDocs(participationsQuery);
      const eventIds = participationsSnapshot.docs.map(
        (doc) => doc.data().eventId
      );

      // Get user's organized events
      const organizedEventsQuery = query(
        collection(db, "events"),
        where("createdBy", "==", user.uid)
      );

      const organizedEventsSnapshot = await getDocs(organizedEventsQuery);
      const organizedEventIds = organizedEventsSnapshot.docs.map(
        (doc) => doc.id
      );

      // Get user's wins
      const winsQuery = query(
        collection(db, "winners"),
        where("userId", "==", user.uid)
      );

      const winsSnapshot = await getDocs(winsQuery);
      const wins: Winner[] = winsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          eventId: data.eventId,
          userId: data.userId,
          position: data.position,
          addedAt: data.addedAt.toDate().toISOString(),
        };
      });

      // Count wins by position
      const winCounts: Record<string, number> = {};
      wins.forEach((win) => {
        winCounts[win.position] = (winCounts[win.position] || 0) + 1;
      });

      // Generate badges
      const badgesList: Badge[] = [];

      // Organizer badges
      if (organizedEventIds.length >= 1) {
        badgesList.push({
          id: "organizer-1",
          name: "Organizer",
          description: "Organized at least 1 event",
          imageUrl: "/badges/organizer.png",
          earnedAt: new Date().toISOString(),
        });
      }

      if (organizedEventIds.length >= 5) {
        badgesList.push({
          id: "organizer-5",
          name: "Event Master",
          description: "Organized at least 5 events",
          imageUrl: "/badges/event-master.png",
          earnedAt: new Date().toISOString(),
        });
      }

      // Participation badges
      if (eventIds.length >= 1) {
        badgesList.push({
          id: "participant-1",
          name: "Participant",
          description: "Participated in at least 1 event",
          imageUrl: "/badges/participant.png",
          earnedAt: new Date().toISOString(),
        });
      }

      if (eventIds.length >= 5) {
        badgesList.push({
          id: "participant-5",
          name: "Active Participant",
          description: "Participated in at least 5 events",
          imageUrl: "/badges/active-participant.png",
          earnedAt: new Date().toISOString(),
        });
      }

      if (eventIds.length >= 10) {
        badgesList.push({
          id: "participant-10",
          name: "Event Enthusiast",
          description: "Participated in at least 10 events",
          imageUrl: "/badges/event-enthusiast.png",
          earnedAt: new Date().toISOString(),
        });
      }

      // Winner badges
      if (wins.length >= 1) {
        badgesList.push({
          id: "winner-1",
          name: "Winner",
          description: "Won at least 1 event",
          imageUrl: "/badges/winner.png",
          earnedAt: new Date().toISOString(),
        });
      }

      if (wins.length >= 5) {
        badgesList.push({
          id: "winner-5",
          name: "Champion",
          description: "Won at least 5 events",
          imageUrl: "/badges/champion.png",
          earnedAt: new Date().toISOString(),
        });
      }

      // First place badges
      const firstPlaceWins = wins.filter(
        (win) => win.position === "First Place"
      ).length;

      if (firstPlaceWins >= 1) {
        badgesList.push({
          id: "first-place-1",
          name: "Gold Medalist",
          description: "Achieved first place in at least 1 event",
          imageUrl: "/badges/gold-medal.png",
          earnedAt: new Date().toISOString(),
        });
      }

      if (firstPlaceWins >= 3) {
        badgesList.push({
          id: "first-place-3",
          name: "Triple Crown",
          description: "Achieved first place in at least 3 events",
          imageUrl: "/badges/triple-crown.png",
          earnedAt: new Date().toISOString(),
        });
      }

      setBadges(badgesList);

      // Generate certificates from wins
      const certificatesList: Certificate[] = [];

      // Get event details for each win
      for (const win of wins) {
        try {
          const eventDocRef = doc(collection(db, "events"), win.eventId);
          const eventDoc = await getDoc(eventDocRef);

          if (eventDoc.exists()) {
            const eventData = eventDoc.data();

            certificatesList.push({
              id: win.id,
              name: eventData.title,
              eventId: win.eventId,
              userId: win.userId,
              position: win.position,
              imageUrl: `/api/certificate?eventName=${encodeURIComponent(
                eventData.title
              )}&position=${encodeURIComponent(
                win.position
              )}&userName=${encodeURIComponent(
                user.displayName || "Participant"
              )}&logoUrl=${encodeURIComponent(
                eventData.logoURL || ""
              )}&date=${encodeURIComponent(
                new Date(win.addedAt).toLocaleDateString()
              )}`,
              earnedAt: win.addedAt,
            });
          }
        } catch (error) {
          console.error("Error getting event details:", error);
        }
      }

      // Add participation certificates
      for (const eventId of eventIds) {
        // Skip events where the user already has a winner certificate
        if (certificatesList.some((cert) => cert.eventId === eventId)) continue;

        try {
          const eventDocRef = doc(collection(db, "events"), eventId);
          const eventDoc = await getDoc(eventDocRef);

          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            const participantDoc = participationsSnapshot.docs.find(
              (doc) => doc.data().eventId === eventId
            );

            if (participantDoc) {
              const participantData = participantDoc.data();

              certificatesList.push({
                id: participantDoc.id,
                name: eventData.title,
                eventId: eventId,
                userId: user.uid,
                position: "Participation",
                imageUrl: `/api/certificate?eventName=${encodeURIComponent(
                  eventData.title
                )}&position=Participation&userName=${encodeURIComponent(
                  user.displayName || "Participant"
                )}&logoUrl=${encodeURIComponent(
                  eventData.logoURL || ""
                )}&date=${encodeURIComponent(
                  new Date(
                    participantData.registeredAt.toDate()
                  ).toLocaleDateString()
                )}`,
                earnedAt: participantData.registeredAt.toDate().toISOString(),
              });
            }
          }
        } catch (error) {
          console.error("Error getting event details:", error);
        }
      }

      setCertificates(certificatesList);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      toast.error("Failed to load achievements. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  const handleDownloadCertificate = (certificate: Certificate) => {
    // Create a link element
    const link = document.createElement("a");
    link.href = certificate.imageUrl;
    link.download = `${certificate.name.replace(
      /\s+/g,
      "-"
    )}-${certificate.position.replace(/\s+/g, "-")}-certificate.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <Header searchPlaceholder="Find achievements" />

      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Badges</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-wrap gap-4">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <Skeleton className="h-4 w-20 mt-2" />
                    </div>
                  ))}
              </div>
            ) : badges.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {badges.map((badge) => (
                  <BadgeItem key={badge.id} badge={badge} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  You haven&apos;t earned any badges yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Participate in events and win competitions to earn badges
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col rounded-lg border p-4"
                    >
                      <Skeleton className="aspect-video w-full mb-3" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
              </div>
            ) : certificates.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="flex flex-col rounded-lg border p-4"
                  >
                    <div className="mb-3 aspect-video overflow-hidden rounded-md bg-muted relative group">
                      <img
                        src={certificate.imageUrl || "/placeholder.svg"}
                        alt={certificate.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleDownloadCertificate(certificate)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium">{certificate.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(certificate.earnedAt).toLocaleDateString()}
                      </p>
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {certificate.position}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  You haven&apos;t earned any certificates yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Participate in events to earn certificates
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BadgeItem({ badge }: { badge: Badge }) {
  return (
    <div className="flex flex-col items-center">
      <div className="group relative">
        <Avatar className="h-16 w-16">
          <AvatarImage src={badge.imageUrl} alt={badge.name} />
          <AvatarFallback>{badge.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/70 opacity-0 transition-opacity group-hover:opacity-100">
          <p className="px-2 text-center text-xs text-white">
            {badge.description}
          </p>
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-medium">{badge.name}</p>
    </div>
  );
}
// Removed the incorrect implementation of the `doc` function as it is now imported from Firebase.

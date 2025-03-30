"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { useAuth } from "@/context/AuthContext";
import { Copy, Instagram, Linkedin, Twitter } from "lucide-react";

import { format } from "date-fns";
import { generateSocialPostUser } from "@/lib/ai";

interface WinnerEvent {
  id: string;
  eventId: string;
  position: string;
  eventTitle: string;
  eventDate: string;
  eventDescription: string;
}

export default function MySocialPage() {
  const { user } = useAuth();
  const [winnerEvents, setWinnerEvents] = useState<WinnerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [platform, setPlatform] = useState<
    "instagram" | "twitter" | "linkedin"
  >("instagram");
  const [generatedText, setGeneratedText] = useState("");

  useEffect(() => {
    const fetchWinnerEvents = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get user's wins
        const winsQuery = query(
          collection(db, "winners"),
          where("userId", "==", user.uid)
        );

        const winsSnapshot = await getDocs(winsQuery);
        const winnerEventsData: WinnerEvent[] = [];

        // Get event details for each win
        for (const winDoc of winsSnapshot.docs) {
          const winData = winDoc.data();

          try {
            const eventDoc = await getDoc(doc(db, "events", winData.eventId));

            if (eventDoc.exists()) {
              const eventData = eventDoc.data();

              winnerEventsData.push({
                id: winDoc.id,
                eventId: winData.eventId,
                position: winData.position,
                eventTitle: eventData.title,
                eventDate: eventData.startDate.toDate().toISOString(),
                eventDescription: eventData.description,
              });
            }
          } catch (error) {
            console.error("Error fetching event details:", error);
          }
        }

        setWinnerEvents(winnerEventsData);
      } catch (error) {
        console.error("Error fetching winner events:", error);
        toast.error("Failed to load your achievements");
      } finally {
        setLoading(false);
      }
    };

    fetchWinnerEvents();
  }, [user]);

  const handleGeneratePost = async () => {
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }

    const event = winnerEvents.find((e) => e.eventId === selectedEvent);
    if (!event) return;

    try {
      setGenerating(true);
      const text = await generateSocialPostUser(
        {
          eventTitle: event.eventTitle,
          position: event.position,
          eventDate: format(new Date(event.eventDate), "MMMM d, yyyy"),
        },
        platform
      );
      setGeneratedText(text);
    } catch (error) {
      console.error("Error generating post:", error);
      toast.error("Failed to generate social media post");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generatedText);
    toast.success("Text copied to clipboard");
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Social Media Posts</CardTitle>
            <CardDescription>
              Share your achievements and event wins on social media
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <div className="h-10 animate-pulse rounded-md bg-muted"></div>
                <div className="h-40 animate-pulse rounded-md bg-muted"></div>
              </div>
            ) : winnerEvents.length > 0 ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="event">Select Achievement</Label>
                  <Select
                    value={selectedEvent}
                    onValueChange={setSelectedEvent}
                  >
                    <SelectTrigger id="event">
                      <SelectValue placeholder="Choose an event you won" />
                    </SelectTrigger>
                    <SelectContent>
                      {winnerEvents.map((event) => (
                        <SelectItem key={event.id} value={event.eventId}>
                          {event.eventTitle} - {event.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Tabs
                  defaultValue="instagram"
                  onValueChange={(value) => setPlatform(value as any)}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="instagram"
                      className="flex items-center gap-2"
                    >
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </TabsTrigger>
                    <TabsTrigger
                      value="twitter"
                      className="flex items-center gap-2"
                    >
                      <Twitter className="h-4 w-4" />
                      Twitter/X
                    </TabsTrigger>
                    <TabsTrigger
                      value="linkedin"
                      className="flex items-center gap-2"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Post Text</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGeneratePost}
                        disabled={generating || !selectedEvent}
                      >
                        {generating ? "Generating..." : "Generate Text"}
                      </Button>
                    </div>

                    <Textarea
                      value={generatedText}
                      onChange={(e) => setGeneratedText(e.target.value)}
                      placeholder="Your social media post text will appear here. Select an event and click 'Generate Text' to create content."
                      className="min-h-[200px]"
                    />

                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handleCopyText}
                      disabled={!generatedText}
                    >
                      <Copy className="h-4 w-4" />
                      Copy Text
                    </Button>
                  </div>
                </Tabs>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  You haven&apos;t won any events yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Participate in events and win competitions to share your
                  achievements
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <h3 className="text-sm font-medium mb-2">
              Tips for sharing achievements:
            </h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Be proud but humble about your achievements</li>
              <li>Thank the organizers and mention what you learned</li>
              <li>Tag the event or organization in your post</li>
              <li>Include a photo of yourself with your award if possible</li>
              <li>Encourage others to participate in future events</li>
            </ul>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

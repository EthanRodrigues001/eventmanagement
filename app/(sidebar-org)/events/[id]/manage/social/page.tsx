"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import type { Event } from "@/lib/types";
import { Copy, Download, Instagram, Linkedin, Twitter } from "lucide-react";
import { generateSocialPost } from "@/lib/ai";
import { format } from "date-fns";

export default function SocialMediaPage() {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [platform, setPlatform] = useState<
    "instagram" | "twitter" | "linkedin"
  >("instagram");
  const [theme, setTheme] = useState<"default" | "dark" | "vibrant">("default");
  const [generatedText, setGeneratedText] = useState("");
  const [imageUrl, setImageUrl] = useState("");

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

          // Generate image URL
          generateImageUrl(formattedEvent, platform, theme);
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

  const generateImageUrl = (event: Event, platform: string, theme: string) => {
    if (!event) return;

    const baseUrl = `/api/social/generate-image?`;
    const params = new URLSearchParams({
      platform,
      theme,
      eventName: event.title,
      eventDate: format(new Date(event.startDate), "MMMM d, yyyy"),
      eventLocation: event.location,
      eventDescription: event.description.substring(0, 200),
    });

    if (event.logoURL) {
      params.append("logoUrl", event.logoURL);
    }

    setImageUrl(`${baseUrl}${params.toString()}`);
  };

  const handleGeneratePost = async () => {
    if (!event) return;

    try {
      setGenerating(true);

      const post = await generateSocialPost(
        {
          title: event.title,
          description: event.description,
          startDate: new Date(event.startDate),
          location: event.location,
        },
        platform
      );

      setGeneratedText(post);
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

  const handleDownloadImage = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${event?.title
      .replace(/\s+/g, "-")
      .toLowerCase()}-${platform}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePlatformChange = (
    value: "instagram" | "twitter" | "linkedin"
  ) => {
    setPlatform(value);
    if (event) {
      generateImageUrl(event, value, theme);
    }
  };

  const handleThemeChange = (value: "default" | "dark" | "vibrant") => {
    setTheme(value);
    if (event) {
      generateImageUrl(event, platform, value);
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
          <CardTitle>Social Media Posts</CardTitle>
          <CardDescription>
            Generate and customize social media posts for your event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="instagram"
            onValueChange={(value) => handlePlatformChange(value as any)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="instagram"
                className="flex items-center gap-2"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </TabsTrigger>
              <TabsTrigger value="twitter" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter/X
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={theme}
                    onValueChange={(value) => handleThemeChange(value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="vibrant">Vibrant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt="Social media preview"
                    className="w-full h-auto"
                    onError={(e) => {
                      e.currentTarget.src =
                        "/placeholder.svg?height=400&width=400";
                    }}
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleDownloadImage}
                >
                  <Download className="h-4 w-4" />
                  Download Image
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Post Text</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePost}
                    disabled={generating}
                  >
                    {generating ? "Generating..." : "Generate Text"}
                  </Button>
                </div>

                <Textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  placeholder="Your social media post text will appear here. Click 'Generate Text' to create content."
                  className="min-h-[300px]"
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
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <h3 className="text-sm font-medium mb-2">
            Tips for effective social media posts:
          </h3>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Keep Instagram captions engaging with relevant hashtags</li>
            <li>
              Twitter posts should be concise and include a clear call to action
            </li>
            <li>
              LinkedIn posts should be professional and highlight the value of
              attending
            </li>
            <li>Always include event date, time, and location in your posts</li>
            <li>Use eye-catching images that represent your event</li>
          </ul>
        </CardFooter>
      </Card>
    </div>
  );
}

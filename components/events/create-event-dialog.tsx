"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { EVENT_CATEGORIES } from "@/lib/types";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

export function CreateEventDialog() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: 0,
    registrations: true,
    eligibility: "",
    location: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    sponsorshipGoal: 0,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "sponsorshipGoal"
          ? Number.parseFloat(value) || 0
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, [name]: date || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create an event");
      return;
    }

    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.location
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    if (formData.startDate > formData.endDate) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      setLoading(true);

      // Create event in Firestore
      const eventRef = await addDoc(collection(db, "events"), {
        title: formData.title,
        description: formData.description,
        logoURL: null,
        bannerURL: null,
        category: formData.category,
        price: formData.price,
        registrations: formData.registrations,
        eligibility: formData.eligibility,
        location: formData.location,
        startDate: formData.startDate,
        endDate: formData.endDate,
        sponsorshipGoal: formData.sponsorshipGoal,
        currentSponsorship: 0,
        isPublished: false,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add creator to organizing team as organizer
      await addDoc(collection(db, "organizingTeam"), {
        userId: user.uid,
        eventId: eventRef.id,
        role: "organizer",
      });

      // Add creator as participant
      await addDoc(collection(db, "eventParticipants"), {
        userId: user.uid,
        eventId: eventRef.id,
        registeredAt: serverTimestamp(),
      });

      toast.success("Event created successfully");
      setOpen(false);

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        price: 0,
        registrations: true,
        eligibility: "",
        location: "",
        startDate: null,
        endDate: null,
        sponsorshipGoal: 0,
      });

      // Redirect to event management page
      router.push(`/events/${eventRef.id}/manage`);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new event. You can edit more details
            after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Event Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter event title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter event description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleSelectChange("category", value)
                  }
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map((category) => (
                      <SelectItem
                        key={category}
                        value={category}
                        className="capitalize"
                      >
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Enter event location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        format(formData.startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate || undefined}
                      onSelect={(date) => handleDateChange("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? (
                        format(formData.endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate || undefined}
                      onSelect={(date) => handleDateChange("endDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prize Amount (₹)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  placeholder="Enter prize amount"
                  value={formData.price}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 for a free event
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsorshipGoal">Sponsorship Goal (₹)</Label>
                <Input
                  id="sponsorshipGoal"
                  name="sponsorshipGoal"
                  type="number"
                  min="0"
                  placeholder="Enter sponsorship goal"
                  value={formData.sponsorshipGoal}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eligibility">Eligibility</Label>
              <Input
                id="eligibility"
                name="eligibility"
                placeholder="e.g., Engineering Students • MBA Students • Undergraduate • Postgraduate"
                value={formData.eligibility}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground">
                Specify who can participate in this event
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="registrations"
                checked={formData.registrations}
                onCheckedChange={(checked) =>
                  handleSwitchChange("registrations", checked)
                }
              />
              <Label htmlFor="registrations">Open for registrations</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

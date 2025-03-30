"use client";

import { useState, useEffect } from "react";
import { Calendar, Filter } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate, formatPrice, truncateText } from "@/lib/utils";
import type { Event, EventFilters } from "@/lib/types";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filters, setFilters] = useState<EventFilters>({
    price: [0, 5000],
    categories: [],
    startDate: null,
  });
  const [maxPrice, setMaxPrice] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [suggestedEvents] = useState<Event[]>([]);

  // Get unique categories from events
  const categories = Array.from(
    new Set(events.map((event) => event.category || "uncategorized"))
  );

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Create a query to get published events
      const eventsQuery = query(
        collection(db, "events"),
        where("isPublished", "==", true),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(eventsQuery);
      const eventsData: Event[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Format dates for display
        const formattedEvent: Event = {
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
        };

        eventsData.push(formattedEvent);
      });

      setEvents(eventsData);

      // Find max price for slider
      const highestPrice = Math.max(
        ...eventsData.map((event) => event.price),
        1000
      );

      if (highestPrice > 0 && highestPrice !== maxPrice) {
        setMaxPrice(highestPrice);
        setFilters((prev) => ({
          ...prev,
          price: [prev.price[0], highestPrice],
        }));
      }

      // Apply filters
      applyFilters(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (eventsToFilter: Event[]) => {
    let filtered = [...eventsToFilter];

    // Apply price filter
    filtered = filtered.filter(
      (event) =>
        event.price >= filters.price[0] && event.price <= filters.price[1]
    );

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((event) =>
        filters.categories.includes(event.category || "uncategorized")
      );
    }

    // Apply date filter
    if (filters.startDate) {
      const filterDate = filters.startDate;
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.startDate);
        return eventDate >= filterDate;
      });
    }

    setFilteredEvents(filtered);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilters(events);
  }, [filters]);

  const handlePriceChange = (value: number[]) => {
    setFilters((prev) => ({ ...prev, price: value as [number, number] }));
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      categories: checked
        ? [...prev.categories, category]
        : prev.categories.filter((c) => c !== category),
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, startDate: date || null }));
  };

  const handleRegister = (eventId: string) => {
    // Placeholder for registration logic
    toast.success(`Successfully registered for event ${eventId}!`);
  };

  return (
    <div className="container mx-auto py-8 px-4 pt-36">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Events</h1>
        {user && <CreateEventDialog />}
      </div>

      <div className="flex flex-col md:flex-row gap-8 pb-8">
        {/* Filters - 25% width on desktop */}
        <div className="w-full md:w-1/4 space-y-6">
          <div className="bg-card rounded-lg p-4 shadow">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </h2>

            {/* Price Filter */}
            <div className="space-y-4 mb-6">
              <h3 className="font-medium">Price Range</h3>
              <Slider
                defaultValue={[0, maxPrice]}
                max={maxPrice}
                step={100}
                value={filters.price}
                onValueChange={handlePriceChange}
                className="my-6"
              />
              <div className="flex justify-between text-sm">
                <span>{formatPrice(filters.price[0])}</span>
                <span>{formatPrice(filters.price[1])}</span>
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-4 mb-6">
              <h3 className="font-medium">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filters.categories.includes(category)}
                      onCheckedChange={(checked) =>
                        handleCategoryChange(category, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`category-${category}`}
                      className="text-sm font-medium capitalize"
                    >
                      {category || "Uncategorized"}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div className="space-y-4">
              <h3 className="font-medium">Start Date</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.startDate ? (
                      formatDate(filters.startDate.toISOString())
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={filters.startDate || undefined}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {filters.startDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleDateChange(undefined)}
                >
                  Clear date
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Events List - 75% width on desktop */}
        <div className="w-full md:w-3/4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-24 ml-auto" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <div className="h-48 overflow-hidden bg-muted">
                    <img
                      src={
                        event.bannerURL ||
                        "/placeholder.svg?height=200&width=400" ||
                        "/placeholder.svg"
                      }
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {truncateText(event.description, 120)}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span>{formatDate(event.startDate)}</span>
                      <span className="font-medium">
                        {formatPrice(event.price)}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Link href={`/events/${event.id}`}>
                      <Button>View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
              <h3 className="text-xl font-medium">No events found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Event Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <div className="rounded-lg border p-4 text-center">
              <p className="text-muted-foreground">
                Please log in to see event suggestions
              </p>
            </div>
          ) : loading ? (
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
  );
}

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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filters, setFilters] = useState<EventFilters>({
    price: [0, 5000],
    categories: [],
    startDate: null,
  });
  const [maxPrice, setMaxPrice] = useState(5000);
  const [loading, setLoading] = useState(true);

  // Get unique categories from events
  const categories = Array.from(
    new Set(events.map((event) => event.category || "uncategorized"))
  );

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Build query parameters for filtering
      const queryParams = new URLSearchParams();

      if (filters.price[0] > 0) {
        queryParams.append("minPrice", filters.price[0].toString());
      }

      if (filters.price[1] < maxPrice) {
        queryParams.append("maxPrice", filters.price[1].toString());
      }

      if (filters.categories.length === 1) {
        queryParams.append("category", filters.categories[0]);
      }

      if (filters.startDate) {
        queryParams.append("startDate", filters.startDate.toISOString());
      }

      const response = await fetch(`/api/events?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data.events);

      // Find max price for slider
      const highestPrice = Math.max(
        ...data.events.map((event: Event) => event.price)
      );
      if (highestPrice > 0 && highestPrice !== maxPrice) {
        setMaxPrice(highestPrice);
        setFilters((prev) => ({
          ...prev,
          price: [prev.price[0], highestPrice],
        }));
      }

      // Apply client-side filtering for multiple categories
      let filtered = [...data.events];

      if (filters.categories.length > 1) {
        filtered = filtered.filter((event) =>
          filters.categories.includes(event.category || "uncategorized")
        );
      }

      setFilteredEvents(filtered);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Error", {
        description: "Failed to load events. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const handlePriceChange = (value: [number, number]) => {
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-8">
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
          <h1 className="text-3xl font-bold mb-6">Events</h1>

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
                        "/placeholder.svg?height=200&width=400"
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
    </div>
  );
}

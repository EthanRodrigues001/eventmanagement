import { type NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const minPrice = searchParams.get("minPrice")
      ? Number.parseInt(searchParams.get("minPrice") as string)
      : null;
    const maxPrice = searchParams.get("maxPrice")
      ? Number.parseInt(searchParams.get("maxPrice") as string)
      : null;
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");

    const db = getFirestore();

    // Start with base query for published events
    const query = db.collection("events").where("isPublished", "==", true);

    // Apply filters if provided
    // Note: Firestore doesn't support multiple range operators on different fields
    // So we'll apply some filters in memory after fetching the data

    // Get all events and filter in memory
    const eventDocs = await query.get();

    const events = [];

    for (const doc of eventDocs.docs) {
      const eventData = doc.data();

      // Apply price filters
      if (minPrice !== null && eventData.price < minPrice) continue;
      if (maxPrice !== null && eventData.price > maxPrice) continue;

      // Apply category filter
      if (category && category !== "all" && eventData.category !== category)
        continue;

      // Apply date filter
      if (startDate) {
        const filterDate = new Date(startDate);
        const eventStartDate = eventData.startDate.toDate();

        if (eventStartDate < filterDate) continue;
      }

      // Format dates for JSON
      const formattedEvent = {
        ...eventData,
        startDate: eventData.startDate.toDate().toISOString(),
        endDate: eventData.endDate.toDate().toISOString(),
        createdAt: eventData.createdAt.toDate().toISOString(),
        updatedAt: eventData.updatedAt.toDate().toISOString(),
      };

      events.push(formattedEvent);
    }

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";

import { handleEventQuery } from "@/lib/ai";
// import { getDoc } from "firebase/firestore";
// import { collection, doc } from "firebase-admin/firestore";

import { db } from "@/lib/auth/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Parse request body
    const { eventId, message, userName } = await request.json();

    if (!eventId || !message || !userId || !userName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get event data
    const eventDocRef = db.collection("events").doc(eventId);
    const eventDoc = await eventDocRef.get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventData = eventDoc.data();

    if (!eventData) {
      return NextResponse.json(
        { error: "Event data is undefined" },
        { status: 500 }
      );
    }

    // Generate AI response
    const response = await handleEventQuery(
      {
        title: eventData.title,
        description: eventData.description,
        startDate: eventData.startDate.toDate(),
        endDate: eventData.endDate.toDate(),
        location: eventData.location,
        createdBy: userName,
      },
      message
    );

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Error handling chat message:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

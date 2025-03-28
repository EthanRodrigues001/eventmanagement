import { type NextRequest, NextResponse } from "next/server";

import { getFirestore } from "firebase-admin/firestore";
import { Speaker } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    // Parse request body
    const { eventId, name, profession } = await request.json();

    if (!eventId || !name || !profession) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getFirestore();

    // Get event data
    const eventDoc = await db.collection("events").doc(eventId).get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is the creator or in organizing team
    if (eventDoc.data()?.createdBy !== userId) {
      const organizerDocs = await db
        .collection("organizingTeam")
        .where("eventId", "==", eventId)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (organizerDocs.empty) {
        return NextResponse.json(
          { error: "You don't have permission to add speakers to this event" },
          { status: 403 }
        );
      }
    }

    // Add speaker
    const speakerRef = await db.collection("speakers").add({
      eventId,
      name,
      profession,
    });

    return NextResponse.json({
      success: true,
      speakerId: speakerRef.id,
      message: "Speaker added successfully",
    });
  } catch (error) {
    console.error("Error adding speaker:", error);
    return NextResponse.json(
      { error: "Failed to add speaker" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get event ID from query params
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    const db = getFirestore();

    // Get speakers for event
    const speakerDocs = await db
      .collection("speakers")
      .where("eventId", "==", eventId)
      .get();

    const speakers: Speaker[] = [];
    speakerDocs.forEach((doc) => {
      const data = doc.data();
      speakers.push({
        id: doc.id,
        eventId: data.eventId,
        name: data.name,
        profession: data.profession,
      } as Speaker);
    });

    return NextResponse.json({
      success: true,
      speakers,
    });
  } catch (error) {
    console.error("Error getting speakers:", error);
    return NextResponse.json(
      { error: "Failed to get speakers" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const speakerId = searchParams.get("speakerId");

    if (!speakerId) {
      return NextResponse.json(
        { error: "Missing speaker ID" },
        { status: 400 }
      );
    }
    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const db = getFirestore();

    // Get speaker data
    const speakerDoc = await db.collection("speakers").doc(speakerId).get();

    if (!speakerDoc.exists) {
      return NextResponse.json({ error: "Speaker not found" }, { status: 404 });
    }

    const speakerData = speakerDoc.data();

    // Get event data
    if (!speakerData) {
      return NextResponse.json(
        { error: "Speaker data not found" },
        { status: 404 }
      );
    }

    const eventDoc = await db
      .collection("events")
      .doc(speakerData.eventId)
      .get();

    // Check if user is the creator or in organizing team
    const eventData = eventDoc.data();
    if (!eventData || eventData.createdBy !== userId) {
      const organizerDocs = await db
        .collection("organizingTeam")
        .where("eventId", "==", speakerData.eventId)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (organizerDocs.empty) {
        return NextResponse.json(
          {
            error:
              "You don't have permission to remove speakers from this event",
          },
          { status: 403 }
        );
      }
    }

    // Delete speaker
    await db.collection("speakers").doc(speakerId).delete();

    return NextResponse.json({
      success: true,
      message: "Speaker removed successfully",
    });
  } catch (error) {
    console.error("Error removing speaker:", error);
    return NextResponse.json(
      { error: "Failed to remove speaker" },
      { status: 500 }
    );
  }
}

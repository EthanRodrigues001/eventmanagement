import { type NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const eventId = context.params.id;

    if (!eventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    const db = getFirestore();

    // Get event data
    const eventDoc = await db.collection("events").doc(eventId).get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventData = eventDoc.data();

    // Format dates for JSON
    if (!eventData) {
      return NextResponse.json(
        { error: "Event data is undefined" },
        { status: 500 }
      );
    }

    const formattedEvent = {
      ...eventData,
      startDate: eventData.startDate.toDate().toISOString(),
      endDate: eventData.endDate.toDate().toISOString(),
      createdAt: eventData.createdAt.toDate().toISOString(),
      updatedAt: eventData.updatedAt.toDate().toISOString(),
    };

    // Get registration count
    const registrationsCount = await db
      .collection("eventParticipants")
      .where("eventId", "==", eventId)
      .count()
      .get();

    return NextResponse.json({
      success: true,
      event: formattedEvent,
      registrationsCount: registrationsCount.data().count,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = context.params.id;
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }
    if (!eventId || !userId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    // Parse request body
    const updateData = await request.json();

    const db = getFirestore();

    // Get event data
    const eventDoc = await db.collection("events").doc(eventId).get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventData = eventDoc.data();

    // Check if user is the creator or in organizing team
    // Retrieve userUid from the authenticated user context

    if (!eventData || eventData.createdBy !== userId) {
      const organizerDocs = await db
        .collection("organizingTeam")
        .where("eventId", "==", eventId)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (organizerDocs.empty) {
        return NextResponse.json(
          { error: "You don't have permission to update this event" },
          { status: 403 }
        );
      }
    }

    // Update event
    const updateFields: Partial<{
      title: string;
      description: string;
      price: number;
      registrations: number;
      eligibility: string;
      location: string;
      startDate: Date;
      endDate: Date;
      sponsorshipGoal: number;
      isPublished: boolean;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (updateData.title !== undefined) updateFields.title = updateData.title;
    if (updateData.description !== undefined)
      updateFields.description = updateData.description;
    if (updateData.price !== undefined) updateFields.price = updateData.price;
    if (updateData.registrations !== undefined)
      updateFields.registrations = updateData.registrations;
    if (updateData.eligibility !== undefined)
      updateFields.eligibility = updateData.eligibility;
    if (updateData.location !== undefined)
      updateFields.location = updateData.location;
    if (updateData.startDate !== undefined)
      updateFields.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined)
      updateFields.endDate = new Date(updateData.endDate);
    if (updateData.sponsorshipGoal !== undefined)
      updateFields.sponsorshipGoal = updateData.sponsorshipGoal;
    if (updateData.isPublished !== undefined)
      updateFields.isPublished = updateData.isPublished;

    await db.collection("events").doc(eventId).update(updateFields);

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

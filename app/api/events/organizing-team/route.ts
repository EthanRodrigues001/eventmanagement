import { type NextRequest, NextResponse } from "next/server";

import { getFirestore } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    // const { searchParams } = new URL(request.url);
    // const userId = searchParams.get("userId");
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Parse request body
    const { eventId, userId, role } = await request.json();

    if (!eventId || !userId || !role) {
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

    // Check if user is the creator or an organizer
    if (eventDoc.data()?.createdBy !== userId) {
      const organizerDocs = await db
        .collection("organizingTeam")
        .where("eventId", "==", eventId)
        .where("userId", "==", userId)
        .where("role", "==", "organizer")
        .limit(1)
        .get();

      if (organizerDocs.empty) {
        return NextResponse.json(
          {
            error:
              "You don't have permission to add members to the organizing team",
          },
          { status: 403 }
        );
      }
    }

    // Check if user is a participant
    const participantDocs = await db
      .collection("eventParticipants")
      .where("eventId", "==", eventId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (participantDocs.empty) {
      return NextResponse.json(
        {
          error:
            "User must be a participant before being added to the organizing team",
        },
        { status: 400 }
      );
    }

    // Check if user is already in organizing team
    const teamDocs = await db
      .collection("organizingTeam")
      .where("eventId", "==", eventId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!teamDocs.empty) {
      return NextResponse.json(
        { error: "User is already in the organizing team" },
        { status: 400 }
      );
    }

    // Add user to organizing team
    const teamRef = await db.collection("organizingTeam").add({
      eventId,
      userId,
      role,
    });

    return NextResponse.json({
      success: true,
      teamMemberId: teamRef.id,
      message: "User added to organizing team successfully",
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
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

    // Get organizing team members
    const teamDocs = await db
      .collection("organizingTeam")
      .where("eventId", "==", eventId)
      .get();

    const teamMembers = [];
    const userPromises = [];

    teamDocs.forEach((doc) => {
      const data = doc.data();
      userPromises.push(
        db
          .collection("users")
          .doc(data.userId)
          .get()
          .then((userDoc) => {
            if (userDoc.exists) {
              const userData = userDoc.data();
              teamMembers.push({
                id: doc.id,
                userId: data.userId,
                role: data.role,
                displayName: userData?.displayName ?? "Unknown",
                email: userData?.email ?? "Unknown",
                photoURL: userData?.photoURL ?? "Unknown",
              });
            }
          })
      );
    });

    await Promise.all(userPromises);

    return NextResponse.json({
      success: true,
      teamMembers,
    });
  } catch (error) {
    console.error("Error getting team members:", error);
    return NextResponse.json(
      { error: "Failed to get team members" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Get team member ID from query params

    const teamMemberId = searchParams.get("teamMemberId");

    if (!teamMemberId) {
      return NextResponse.json(
        { error: "Missing team member ID" },
        { status: 400 }
      );
    }

    const db = getFirestore();

    // Get team member data
    const teamMemberDoc = await db
      .collection("organizingTeam")
      .doc(teamMemberId)
      .get();

    if (!teamMemberDoc.exists) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    const teamMemberData = teamMemberDoc.data();

    // Get event data
    if (!teamMemberData) {
      return NextResponse.json(
        { error: "Team member data is undefined" },
        { status: 400 }
      );
    }

    const eventDoc = await db
      .collection("events")
      .doc(teamMemberData.eventId)
      .get();

    // Check if user is the creator or an organizer
    if (eventDoc.data()?.createdBy !== userId) {
      const organizerDocs = await db
        .collection("organizingTeam")
        .where("eventId", "==", teamMemberData.eventId)
        .where("userId", "==", userId)
        .where("role", "==", "organizer")
        .limit(1)
        .get();

      if (organizerDocs.empty) {
        return NextResponse.json(
          {
            error:
              "You don't have permission to remove members from the organizing team",
          },
          { status: 403 }
        );
      }
    }

    // Cannot remove the event creator from organizing team
    if (teamMemberData.userId === eventDoc.data()?.createdBy) {
      return NextResponse.json(
        { error: "Cannot remove the event creator from the organizing team" },
        { status: 400 }
      );
    }

    // Delete team member
    await db.collection("organizingTeam").doc(teamMemberId).delete();

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}

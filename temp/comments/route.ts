import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    // Get event ID from query params
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    const db = getFirestore();

    // Get comments for event
    const commentsQuery = db
      .collection("comments")
      .where("eventId", "==", eventId)
      .orderBy("createdAt", "desc");

    const commentsSnapshot = await commentsQuery.get();
    const comments = [];

    for (const doc of commentsSnapshot.docs) {
      const data = doc.data();

      // Get user data
      const userDoc = await db.collection("users").doc(data.userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      comments.push({
        id: doc.id,
        userId: data.userId,
        eventId: data.eventId,
        comment: data.comment,
        createdAt: data.createdAt.toDate(),
        displayName: userData?.displayName || "Unknown User",
        photoURL: userData?.photoURL || null,
      });
    }

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("Error getting comments:", error);
    return NextResponse.json(
      { error: "Failed to get comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { eventId, comment } = await request.json();

    if (!eventId || !comment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getFirestore();

    // Check if event exists
    const eventDoc = await db.collection("events").doc(eventId).get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Add comment
    const commentRef = await db.collection("comments").add({
      userId: userUid,
      eventId,
      comment,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      commentId: commentRef.id,
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}

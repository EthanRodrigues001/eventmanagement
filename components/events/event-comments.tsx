"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { useAuth } from "@/context/AuthContext";

interface EventCommentsProps {
  eventId: string;
}

interface Comment {
  id: string;
  userId: string;
  eventId: string;
  comment: string;
  createdAt: Date;
  displayName: string;
  photoURL: string | null;
}

export function EventComments({ eventId }: EventCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      setLoading(true);

      // Query comments for this event
      const commentsQuery = query(
        collection(db, "comments"),
        where("eventId", "==", eventId),
        orderBy("createdAt", "desc")
      );

      const commentsSnapshot = await getDocs(commentsQuery);
      const commentsData: Comment[] = [];

      // Get user data for each comment
      for (const doc of commentsSnapshot.docs) {
        const data = doc.data();

        // Get user details
        const userDoc = await getDocs(
          query(collection(db, "users"), where("userId", "==", data.userId))
        );
        const userData =
          userDoc.docs.length > 0 ? userDoc.docs[0].data() : null;
        // const userData = userDoc.exists() ? userDoc.data() : null;

        commentsData.push({
          id: doc.id,
          userId: data.userId,
          eventId: data.eventId,
          comment: data.comment,
          createdAt: data.createdAt.toDate(),
          displayName: userData?.displayName || "Unknown User",
          photoURL: userData?.photoURL || null,
        });
      }

      setComments(commentsData);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [eventId]);

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Add comment to Firestore
      await addDoc(collection(db, "comments"), {
        userId: user.uid,
        eventId,
        comment: newComment,
        createdAt: serverTimestamp(),
      });

      toast.success("Comment added successfully");
      setNewComment("");

      // Refresh comments
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-xl font-bold">Comments & Questions</h2>
      </div>

      {/* Add comment form */}
      <div className="space-y-4">
        <Textarea
          placeholder={
            user
              ? "Ask a question or leave a comment..."
              : "Please log in to comment"
          }
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!user || isSubmitting}
          className="min-h-[100px]"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitComment}
            disabled={!user || isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground py-4">
            Loading comments...
          </p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={comment.photoURL || ""}
                  alt={comment.displayName}
                />
                <AvatarFallback>
                  {comment.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{comment.displayName}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.createdAt, {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm whitespace-pre-line">
                  {comment.comment}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}

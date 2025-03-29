"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Search, UserPlus } from "lucide-react";
import type { ChatMessage, Connection } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    {
      id: string;
      displayName: string;
      photoURL: string | null;
      email: string;
    }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const socketRef = useRef<any>(null);

  // Fetch user connections
  const fetchConnections = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const connectionsQuery = query(
        collection(db, "connections"),
        where("userId", "==", user.uid)
      );

      const connectionsSnapshot = await getDocs(connectionsQuery);
      const connectionsData: Connection[] = [];

      for (const connectionDoc of connectionsSnapshot.docs) {
        const data = connectionDoc.data();

        // Get the other user's details
        const otherUserDoc = await getDoc(
          doc(db, "users", data.connectedUserId)
        );

        if (otherUserDoc.exists()) {
          const userData = otherUserDoc.data();

          // Get last message if any
          const combinedParticipants = [user.uid, data.connectedUserId]
            .sort()
            .join("_");

          const messagesQuery = query(
            collection(db, "chatMessages"),
            where("combinedParticipants", "==", combinedParticipants),
            orderBy("sentAt", "desc"),
            limit(1)
          );

          const messagesSnapshot = await getDocs(messagesQuery);
          let lastMessage = "";
          let lastMessageTime = "";

          if (!messagesSnapshot.empty) {
            const messageData = messagesSnapshot.docs[0].data();
            lastMessage = messageData.message;
            lastMessageTime = messageData.sentAt.toDate().toISOString();
          }

          connectionsData.push({
            id: connectionDoc.id,
            userId: data.connectedUserId,
            displayName:
              (userData as { displayName?: string }).displayName || "Unknown",
            photoURL: (userData as { photoURL: string | null }).photoURL,
            email: (userData as { email: string }).email,
            lastMessage,
            lastMessageTime,
          });
        }
      }

      setConnections(connectionsData);

      // Select first connection if available
      if (connectionsData.length > 0 && !selectedConnection) {
        setSelectedConnection(connectionsData[0]);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Failed to load connections. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch chat messages
  const fetchMessages = async () => {
    if (!user || !selectedConnection) return;

    try {
      const combinedParticipants = [user.uid, selectedConnection.userId]
        .sort()
        .join("_");

      const messagesQuery = query(
        collection(db, "chatMessages"),
        where("combinedParticipants", "==", combinedParticipants),
        orderBy("sentAt", "asc")
      );

      // Use onSnapshot to get real-time updates
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData: ChatMessage[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            userId: data.userId,
            receiverId: data.receiverId,
            message: data.message,
            sentAt: data.sentAt
              ? data.sentAt.toDate().toISOString()
              : new Date().toISOString(),
            isRead: data.isRead,
          });
        });

        setChatMessages(messagesData);

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages. Please try again.");
    }
  };

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      socketRef.current = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
        {
          auth: { userId: user.uid, userName: user.displayName },
        }
      );

      socketRef.current.on("new-message", (message: ChatMessage) => {
        if (
          (message.userId === user.uid &&
            message.receiverId === selectedConnection?.userId) ||
          (message.userId === selectedConnection?.userId &&
            message.receiverId === user.uid)
        ) {
          setChatMessages((prev) => [...prev, message]);

          // Scroll to bottom
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [user, selectedConnection]);

  // Fetch connections on mount
  useEffect(() => {
    fetchConnections();
  }, [user]);

  // Fetch messages when selected connection changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (selectedConnection) {
      fetchMessages().then((unsub) => {
        unsubscribe = unsub;
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedConnection]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConnection || !user) return;

    try {
      const combinedParticipants = [user.uid, selectedConnection.userId]
        .sort()
        .join("_");

      const docRef = await addDoc(collection(db, "chatMessages"), {
        userId: user.uid,
        receiverId: selectedConnection.userId,
        participants: [user.uid, selectedConnection.userId],
        combinedParticipants,
        message: newMessage,
        sentAt: serverTimestamp(),
        isRead: false,
      });

      // Emit message via socket
      if (socketRef.current) {
        socketRef.current.emit("send-message", {
          id: docRef.id,
          userId: user.uid,
          receiverId: selectedConnection.userId,
          participants: [user.uid, selectedConnection.userId],
          combinedParticipants,
          message: newMessage,
          sentAt: new Date().toISOString(),
          isRead: false,
        });
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    try {
      setSearching(true);

      // Search for users by displayName or email
      const usersQuery = query(
        collection(db, "users"),
        where("displayName", ">=", searchQuery),
        where("displayName", "<=", searchQuery + "\uf8ff"),
        limit(10)
      );

      const usersSnapshot = await getDocs(usersQuery);
      const usersData: {
        id: string;
        displayName: string;
        photoURL: string | null;
        email: string;
      }[] = [];

      usersSnapshot.forEach((doc) => {
        // Skip current user
        if (doc.id === user.uid) return;

        const data = doc.data();
        usersData.push({
          id: doc.id,
          displayName: data.displayName || "Unknown",
          photoURL: data.photoURL,
          email: data.email,
        });
      });

      // Also search by email
      const emailQuery = query(
        collection(db, "users"),
        where("email", ">=", searchQuery),
        where("email", "<=", searchQuery + "\uf8ff"),
        limit(10)
      );

      const emailSnapshot = await getDocs(emailQuery);

      emailSnapshot.forEach((doc) => {
        // Skip current user and already added users
        if (doc.id === user.uid || usersData.some((u) => u.id === doc.id))
          return;

        const data = doc.data();
        usersData.push({
          id: doc.id,
          displayName: data.displayName || "Unknown",
          photoURL: data.photoURL,
          email: data.email,
        });
      });

      // Filter out existing connections
      const connectionUserIds = connections.map((c) => c.userId);
      const filteredUsers = usersData.filter(
        (u) => !connectionUserIds.includes(u.id)
      );

      setSearchResults(filteredUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleAddConnection = async (userId: string, displayName: string) => {
    if (!user) return;

    try {
      // Check if connection already exists
      const connectionsQuery = query(
        collection(db, "connections"),
        where("userId", "==", user.uid),
        where("connectedUserId", "==", userId)
      );

      const connectionsSnapshot = await getDocs(connectionsQuery);

      if (!connectionsSnapshot.empty) {
        toast.error("This user is already in your connections");
        return;
      }

      // Add connection for current user
      await addDoc(collection(db, "connections"), {
        userId: user.uid,
        connectedUserId: userId,
        createdAt: serverTimestamp(),
      });

      // Add connection for the other user
      await addDoc(collection(db, "connections"), {
        userId: userId,
        connectedUserId: user.uid,
        createdAt: serverTimestamp(),
      });

      toast.success(`${displayName} added to your connections`);

      // Refresh connections
      fetchConnections();

      // Clear search
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error adding connection:", error);
      toast.error("Failed to add connection. Please try again.");
    }
  };

  return (
    <div>
      <Header searchPlaceholder="Find connections" />

      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Connections</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-9 px-3"
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                >
                  {searching ? "..." : "Search"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Search Results</h3>
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-accent"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={result.photoURL || ""}
                              alt={result.displayName}
                            />
                            <AvatarFallback>
                              {result.displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium">
                              {result.displayName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {result.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleAddConnection(result.id, result.displayName)
                          }
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connections List */}
              {loading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg p-3"
                    >
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))
              ) : connections.length > 0 ? (
                connections.map((connection) => (
                  <div
                    key={connection.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent ${
                      selectedConnection?.id === connection.id
                        ? "bg-accent"
                        : ""
                    }`}
                    onClick={() => setSelectedConnection(connection)}
                  >
                    <Avatar>
                      <AvatarImage
                        src={connection.photoURL || ""}
                        alt={connection.displayName}
                      />
                      <AvatarFallback>
                        {connection.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium">{connection.displayName}</p>
                      {connection.lastMessage && (
                        <p className="truncate text-sm text-muted-foreground">
                          {connection.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-muted-foreground">No connections yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Search for users to connect
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedConnection ? selectedConnection.displayName : "Chat"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex h-[500px] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {selectedConnection ? (
                  chatMessages.length > 0 ? (
                    chatMessages.map((msg) => {
                      const isCurrentUser = msg.userId === user?.uid;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isCurrentUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className="mt-1 text-xs opacity-70">
                              {new Date(msg.sentAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">
                        No messages yet. Start a conversation!
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                      Select a connection to start chatting
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedConnection && (
                <div className="mt-4 flex items-center gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

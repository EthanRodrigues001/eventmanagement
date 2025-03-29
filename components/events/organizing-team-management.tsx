"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Users, UserPlus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import type { TeamMember } from "@/lib/types";

interface Participant {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}

interface OrganizingTeamManagementProps {
  eventId: string;
}

export function OrganizingTeamManagement({
  eventId,
}: OrganizingTeamManagementProps) {
  //   const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);

      const teamQuery = query(
        collection(db, "organizingTeam"),
        where("eventId", "==", eventId)
      );

      const teamSnapshot = await getDocs(teamQuery);
      const teamData: TeamMember[] = [];
      const userPromises: Promise<void>[] = [];

      teamSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();

        userPromises.push(
          getDoc(doc(db, "users", data.userId)).then((userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              teamData.push({
                id: docSnapshot.id, // Use docSnapshot.id for the document ID
                userId: data.userId,
                eventId: data.eventId,
                role: data.role,
                displayName: userData.displayName || "Unknown",
                email: userData.email || "Unknown",
                photoURL: userData.photoURL,
              });
            }
          })
        );
      });

      await Promise.all(userPromises);
      setTeamMembers(teamData);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load organizing team. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const participantsQuery = query(
        collection(db, "eventParticipants"),
        where("eventId", "==", eventId)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const participantsData: Participant[] = [];
      const userPromises: Promise<void>[] = [];

      participantsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();

        userPromises.push(
          getDoc(doc(db, "users", data.userId)).then((userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              participantsData.push({
                id: docSnapshot.id, // Use docSnapshot.id for the document ID
                userId: data.userId,
                displayName: userData.displayName || "Unknown",
                email: userData.email || "Unknown",
                photoURL: userData.photoURL,
              });
            }
          })
        );
      });

      await Promise.all(userPromises);

      // Filter out participants who are already team members
      const teamMemberUserIds = teamMembers.map((member) => member.userId);
      const filteredParticipants = participantsData.filter(
        (participant) => !teamMemberUserIds.includes(participant.userId)
      );

      setParticipants(filteredParticipants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants. Please try again.");
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [eventId]);

  useEffect(() => {
    if (dialogOpen) {
      fetchParticipants();
    }
  }, [dialogOpen, teamMembers]);

  const handleAddTeamMember = async () => {
    if (!selectedParticipant || !selectedRole) {
      toast.error("Please select both a participant and a role.");
      return;
    }

    try {
      setAdding(true);

      await addDoc(collection(db, "organizingTeam"), {
        eventId,
        userId: selectedParticipant,
        role: selectedRole,
        createdAt: serverTimestamp(),
      });

      toast.success("Team member added successfully");

      // Reset form
      setSelectedParticipant("");
      setSelectedRole("");
      setDialogOpen(false);

      // Refresh team members list
      fetchTeamMembers();
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add team member"
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTeamMember = async (
    teamMemberId: string,
    displayName: string
  ) => {
    try {
      await deleteDoc(doc(db, "organizingTeam", teamMemberId));

      toast.success(
        `${displayName} has been removed from the organizing team.`
      );

      // Refresh team members list
      fetchTeamMembers();
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove team member"
      );
    }
  };

  const roleOptions = [
    { value: "organizer", label: "Organizer" },
    { value: "sponsorship", label: "Sponsorship" },
    { value: "media", label: "Media" },
    { value: "documentation", label: "Documentation" },
    { value: "logistics", label: "Logistics" },
    { value: "technical", label: "Technical" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Organizing Team
        </CardTitle>
        <CardDescription>Manage your event organizing team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Select a participant to add to the organizing team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="participant">Participant</Label>
                <Select
                  value={selectedParticipant}
                  onValueChange={setSelectedParticipant}
                >
                  <SelectTrigger id="participant">
                    <SelectValue placeholder="Select participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No available participants
                      </SelectItem>
                    ) : (
                      participants.map((participant) => (
                        <SelectItem
                          key={participant.userId}
                          value={participant.userId}
                        >
                          {participant.displayName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTeamMember} disabled={adding}>
                {adding ? "Adding..." : "Add to Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Team members list */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Current Team Members</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading team members...
            </p>
          ) : teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No team members added yet
            </p>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.photoURL || ""} />
                      <AvatarFallback>
                        {member.displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.displayName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full capitalize">
                          {member.role}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleRemoveTeamMember(member.id, member.displayName)
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get a document from Firestore
import { DocumentReference } from "firebase/firestore";

async function getDoc(
  docRef: DocumentReference
): Promise<{ exists: () => boolean; data: () => any; id: string }> {
  try {
    const snapshot = await getDoc(docRef);
    return {
      exists: snapshot.exists,
      data: () => snapshot.data(),
      id: snapshot.id,
    };
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
}

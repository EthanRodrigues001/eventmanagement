"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Image, Trash2, Download, Search } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadButton } from "@/lib/uploadthing";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface EventFile {
  id: string;
  eventId: string;
  filename: string;
  fileId: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  uploaderName?: string;
  createdAt: string;
}

interface FilesManagementProps {
  eventId: string;
}

export function FilesManagement({ eventId }: FilesManagementProps) {
  const [files, setFiles] = useState<EventFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileToDelete, setFileToDelete] = useState<EventFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState<
    "idle" | "uploading" | "complete" | "error"
  >("idle");

  useEffect(() => {
    toast("File statues: " + uploadingStatus);
  }, [uploadingStatus]);

  const fetchFiles = async () => {
    try {
      setLoading(true);

      const filesQuery = query(
        collection(db, "eventFiles"),
        where("eventId", "==", eventId),
        orderBy("createdAt", "desc")
      );

      const filesSnapshot = await getDocs(filesQuery);
      const filesData: EventFile[] = [];

      for (const userDoc of filesSnapshot.docs) {
        const data = userDoc.data();

        const file: EventFile = {
          id: userDoc.id,
          eventId: data.eventId,
          filename: data.filename,
          fileId: data.fileId,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          uploadedBy: data.uploadedBy,
          createdAt: data.createdAt.toDate().toISOString(),
        };

        // Get uploader details
        try {
          const userDoc = await getDoc(doc(db, "users", data.uploadedBy));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userDataTyped = userData as { displayName?: string };
            file.uploaderName = userDataTyped.displayName || "Unknown";
          }
        } catch (error) {
          console.error("Error fetching uploader details:", error);
        }

        filesData.push(file);
      }

      setFiles(filesData);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [eventId]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      setIsDeleting(true);

      // Delete from Firestore
      await deleteDoc(doc(db, "eventFiles", fileToDelete.id));

      toast.success(`${fileToDelete.filename} has been deleted.`);

      // Update local state
      setFiles(files.filter((file) => file.id !== fileToDelete.id));

      // Reset state
      setFileToDelete(null);
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter files based on search query
  const filteredFiles = files.filter((file) => {
    const searchLower = searchQuery.toLowerCase();
    return file.filename.toLowerCase().includes(searchLower);
  });

  // Group files by type
  const imageFiles = filteredFiles.filter(
    (file) => file.fileType.startsWith("image/") || file.fileType === "image"
  );

  const documentFiles = filteredFiles.filter(
    (file) =>
      file.fileType === "application/pdf" ||
      file.fileType.includes("document") ||
      file.fileType.includes("sheet") ||
      file.fileType === "document"
  );

  const otherFiles = filteredFiles.filter(
    (file) =>
      !file.fileType.startsWith("image/") &&
      file.fileType !== "image" &&
      file.fileType !== "application/pdf" &&
      !file.fileType.includes("document") &&
      !file.fileType.includes("sheet") &&
      file.fileType !== "document"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Event Files</h2>
          <p className="text-muted-foreground">
            Upload and manage files for your event
          </p>
        </div>

        <div className="flex items-center gap-2">
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              if (res && res.length > 0) {
                // Add file to Firestore
                const file = res[0];

                addDoc(collection(db, "eventFiles"), {
                  eventId,
                  filename: file.name,
                  fileId: file.key,
                  fileUrl: file.ufsUrl,
                  fileType: file.type || "image",
                  uploadedBy: "user123", // Replace with actual user ID
                  createdAt: serverTimestamp(),
                })
                  .then(() => {
                    toast.success("File uploaded successfully");
                    fetchFiles();
                  })
                  .catch((error) => {
                    console.error("Error adding file to database:", error);
                    toast.error("Failed to save file information");
                  });
              }
              setUploadingStatus("complete");
            }}
            onUploadError={(error: Error) => {
              console.error("Error uploading file:", error);
              toast.error(`Error uploading file: ${error.message}`);
              setUploadingStatus("error");
            }}
            onUploadBegin={() => {
              setUploadingStatus("uploading");
            }}
            className="ut-button:bg-primary ut-button:ut-readying:bg-primary/80 ut-button:ut-uploading:bg-primary/80"
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search files..."
          className="pl-8"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {/* Files display */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All Files ({filteredFiles.length})
          </TabsTrigger>
          <TabsTrigger value="images">Images ({imageFiles.length})</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documentFiles.length})
          </TabsTrigger>
          <TabsTrigger value="other">Other ({otherFiles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderFilesList(filteredFiles)}
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          {imageFiles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imageFiles.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                    <img
                      src={file.fileUrl || "/placeholder.svg"}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/placeholder.svg?height=200&width=200";
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => window.open(file.fileUrl, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setFileToDelete(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs truncate mt-1">{file.filename}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No image files found</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          {renderFilesList(documentFiles)}
        </TabsContent>

        <TabsContent value="other" className="mt-4">
          {renderFilesList(otherFiles)}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {fileToDelete?.filename}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFile}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  function renderFilesList(filesList: EventFile[]) {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border rounded-md"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10" />
                <div>
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (filesList.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No files found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery
              ? "Try adjusting your search"
              : "Upload files to get started"}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filesList.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 border rounded-md"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-md bg-muted">
                {file.fileType.startsWith("image/") ||
                file.fileType === "image" ? (
                  <Image className="h-5 w-5" />
                ) : file.fileType === "application/pdf" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-file-text"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" x2="8" y1="13" y2="13" />
                    <line x1="16" x2="8" y1="17" y2="17" />
                    <line x1="10" x2="8" y1="9" y2="9" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-file"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium">{file.filename}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {file.fileType.split("/")[1] || file.fileType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(file.fileUrl, "_blank")}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFileToDelete(file)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }
}

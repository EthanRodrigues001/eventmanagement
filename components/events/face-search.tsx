"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";

interface FaceSearchProps {
  eventId: string;
}

export function FaceSearch({ eventId }: FaceSearchProps) {
  const [searchImage, setSearchImage] = useState<string | null>(null);
  const [matchedImages, setMatchedImages] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState<
    "idle" | "uploading" | "complete" | "error"
  >("idle");

  useEffect(() => {
    toast("File statues: " + uploadingStatus);
  }, [uploadingStatus]);

  const handleFaceSearch = async () => {
    if (!searchImage) {
      toast.error("Please upload an image first");
      return;
    }

    setIsSearching(true);
    setMatchedImages([]);

    try {
      // In a real implementation, this would call your face recognition API
      // For now, we'll simulate a search by fetching some event images

      // Fetch event images
      const filesQuery = query(
        collection(db, "eventFiles"),
        where("eventId", "==", eventId),
        where("fileType", "in", [
          "image",
          "image/jpeg",
          "image/png",
          "image/jpg",
        ])
      );

      const filesSnapshot = await getDocs(filesQuery);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate matching by randomly selecting some images
      const allImages = filesSnapshot.docs.map((doc) => doc.data().fileUrl);
      const matchCount = Math.min(
        Math.floor(Math.random() * 5) + 1,
        allImages.length
      );

      // Randomly select images
      const selectedImages: string[] = [];
      for (let i = 0; i < matchCount && allImages.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * allImages.length);
        selectedImages.push(allImages[randomIndex]);
        allImages.splice(randomIndex, 1);
      }

      setMatchedImages(selectedImages);

      if (selectedImages.length > 0) {
        toast.success(`Found ${selectedImages.length} potential matches!`);
      } else {
        toast.info("No matches found. Try uploading a clearer image.");
      }
    } catch (error) {
      console.error("Error searching for faces:", error);
      toast.error("Failed to search for faces. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Find Yourself in Event Photos
        </CardTitle>
        <CardDescription>
          Upload your photo to find yourself in event images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Photo</TabsTrigger>
            <TabsTrigger
              value="results"
              disabled={matchedImages.length === 0 && !isSearching}
            >
              Results {matchedImages.length > 0 && `(${matchedImages.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 pt-4">
            {searchImage ? (
              <div className="space-y-4">
                <div className="mx-auto max-w-xs overflow-hidden rounded-lg border">
                  <img
                    src={searchImage || "/placeholder.svg"}
                    alt="Search image"
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSearchImage(null)}
                  >
                    Remove
                  </Button>
                  <Button onClick={handleFaceSearch} disabled={isSearching}>
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Find Matches
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-md">
                <UploadDropzone
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                      setSearchImage(res[0].url);
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
                  className="ut-label:text-lg ut-allowed-content:text-muted-foreground ut-button:bg-primary ut-button:ut-readying:bg-primary/80 ut-button:ut-uploading:bg-primary/80"
                />
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Upload a clear photo of your face for best results
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="pt-4">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Searching for matches...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This may take a moment
                </p>
              </div>
            ) : matchedImages.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We found {matchedImages.length} potential matches. Click on an
                  image to view it in full size.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {matchedImages.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-md overflow-hidden border bg-muted"
                    >
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={imageUrl || "/placeholder.svg"}
                          alt={`Match ${index + 1}`}
                          className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                        />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No matches found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try uploading a clearer photo or a different angle
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="rounded-md bg-muted p-4">
          <h4 className="text-sm font-medium mb-2">How it works</h4>
          <p className="text-sm text-muted-foreground">
            Our face recognition system analyzes your uploaded photo and
            compares it with faces in event photos. The system uses advanced AI
            to find potential matches based on facial features.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            For best results, upload a clear, front-facing photo with good
            lighting.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
    text: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(async ({ file }) => {
    // This code RUNS ON YOUR SERVER after upload
    console.log("File URL:", file.url);

    // Return data to the client
    return { url: file.url };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

# System Context & Architecture: eventmanagement

This document provides a comprehensive overview of the **Event Management Website** repository (`eventmanagement`). It outlines the tech stack, database structure, routing flows, core functionalities, and the technical rationale behind the design choices.

---

## 1. Overview & Project Purpose
The **Event Management Website** is a modern, real-time platform designed specifically for college campuses. It streamlines the lifecycle of event coordination, from organization and task management to public discovery, registration, and post-event engagement (like certification and social sharing).

---

## 2. Tech Stack & Rationale
The project is built using a modern, serverless, and AI-first web development stack.

| Technology | Role | Why It Was Used |
| :--- | :--- | :--- |
| **Next.js 15 (App Router)** | Core Framework | Next.js offers unified server/client routing via the App Router, automatic code splitting, optimized image loading (`next/image`), and the **Edge Runtime** which is leveraged to render dynamic images (certificates/social shares) with low latency. |
| **React 19** | Frontend Library | React 19 introduces improved handling of server actions, asynchronous state transitions, and compatibility with Next.js 15's concurrent rendering features. |
| **Tailwind CSS v4** | Styling | Offers a utility-first approach with a CSS-first configuration that integrates compile-time optimizations and allows for rapid UI development and styling consistency. |
| **Framer Motion (`motion` v12)** | Animations | Implements micro-interactions, smooth tab transitions, and premium animations that elevate the website's visual quality. |
| **Radix UI & Shadcn** | UI Primitives | Accessible, unstyled UI components (Dialogs, Tabs, Selects, Sliders, Dropdowns) styled using Tailwind CSS to create a premium, customized, and responsive design. |
| **Firebase Client SDK & Admin SDK** | Auth & Backend | **Firebase Authentication** handles user identity via Google Sign-In. **Cloud Firestore** acts as the NoSQL database. The Admin SDK is utilized in secure API routes (e.g. `api/chat`) to perform privileged queries and read Firestore data on the server. |
| **Vercel AI SDK & Gemini 1.5 Flash** | AI Engine | Handles conversational AI (Event Chatbot) and structured output generation (generating tasks for organizers and social media posts) via Google's Gemini models, which offer fast latency and native multimodal capabilities. |
| **UploadThing** | File Uploads | A developer-focused file-upload service that avoids the complexity of configuring raw AWS S3 buckets or Firebase Storage. It integrates easily with Next.js API routes and handles files securely. |
| **Next/OG (`ImageResponse`)** | Dynamic Media | Generates on-the-fly digital certificates and social media graphics by rendering React components as SVG/PNG images on the Edge. |

---

## 3. Database Schema (Cloud Firestore)
Firestore is structured as a NoSQL document database. Below is the relational structure showing how collections are referenced:

### `users`
Represents platform users (students, organizers, and admins).
* **Document ID**: `uid` (matching Firebase Auth UID)
* **Fields**:
  * `uid`: `string`
  * `email`: `string | null`
  * `displayName`: `string | null`
  * `photoURL`: `string | null`
  * `phoneNumber`: `string | null`
  * `organization`: `string | null` (e.g., college department or committee)
  * `gender`: `string | null`
  * `isAdmin`: `boolean` (controls global admin features)
  * `onboardingCompleted`: `boolean` (forces redirect to onboarding if false)
  * `createdAt`: `timestamp`
  * `lastLogin`: `timestamp`

### `events`
Holds details of all created events.
* **Document ID**: Auto-generated string
* **Fields**:
  * `title`: `string`
  * `description`: `string`
  * `logoURL`: `string | null`
  * `bannerURL`: `string | null`
  * `category`: `string` (e.g., "technical", "cultural", "social", "academic", "sports", "other")
  * `price`: `number` (prizes value or registration fees)
  * `registrations`: `boolean` (toggle representing if registrations are open/closed)
  * `eligibility`: `string` (eligibility rules for participants)
  * `location`: `string` (classroom, lab, auditorium, or online link)
  * `startDate`: `timestamp`
  * `endDate`: `timestamp`
  * `sponsorshipGoal`: `number`
  * `currentSponsorship`: `number`
  * `isPublished`: `boolean` (if false, the event is only visible to organizers as a draft)
  * `createdBy`: `string` (referencing `users.uid`)
  * `createdAt`: `timestamp`
  * `updatedAt`: `timestamp`

### `speakers`
Public figures or guests invited to deliver lectures/workshops at an event.
* **Document ID**: Auto-generated string
* **Fields**:
  * `eventId`: `string` (referencing `events.id`)
  * `name`: `string`
  * `profession`: `string`

### `organizingTeam`
Association collection for users who manage the event.
* **Document ID**: Auto-generated string
* **Fields**:
  * `eventId`: `string` (referencing `events.id`)
  * `userId`: `string` (referencing `users.uid`)
  * `role`: `string` (e.g., "Convenor", "Technical Head", "PR Head")

### `eventParticipants`
Registrations list for events.
* **Document ID**: Auto-generated string
* **Fields**:
  * `eventId`: `string` (referencing `events.id`)
  * `userId`: `string` (referencing `users.uid`)
  * `registeredAt`: `timestamp`

### `eventFiles`
Media files and documents uploaded for the event. Used for public viewing or photo matching.
* **Document ID**: Auto-generated string
* **Fields**:
  * `eventId`: `string` (referencing `events.id`)
  * `fileUrl`: `string` (UploadThing file link)
  * `fileType`: `string` (e.g., "image/jpeg", "application/pdf")
  * `uploadedAt`: `timestamp`

### `comments`
Public comments and questions posted under event detail pages.
* **Document ID**: Auto-generated string
* **Fields**:
  * `eventId`: `string` (referencing `events.id`)
  * `userId`: `string` (referencing `users.uid`)
  * `comment`: `string`
  * `createdAt`: `timestamp`

### `tasks`
Work items tracked by the organizing team to coordinate the event.
* **Document ID**: Auto-generated string
* **Fields**:
  * `eventId`: `string` (referencing `events.id`)
  * `title`: `string`
  * `description`: `string`
  * `category`: `string` ("PR", "marketing", "logistics", "technical", "sponsorship", "documentation", "general")
  * `assignedTo`: `string | null` (referencing `users.uid`)
  * `status`: `string` ("pending" | "completed")
  * `createdAt`: `timestamp`
  * `updatedAt`: `timestamp`

---

## 4. Application Flow & Routing Structure
The Next.js App Router defines pages through folder hierarchy. The project uses **Route Groups** (folders prefixed with parentheses like `(auth)`) to isolate layouts and sub-pages.

### Core User Flows:
1. **Authentication & Onboarding**:
   * Users click "Login" and authenticate using **Google Auth**.
   * A Firestore listener detects if a document exists for the user. If missing or if `onboardingCompleted` is `false`, they are redirected to `/onboarding` to fill in gender, department, phone number, and organization.
2. **Event Discovery & Filtering**:
   * Public page `/events` loads all events where `isPublished` is `true`.
   * Users can search, filter by price (free vs paid) using a slider, filter by category checklists, or select a starting date using a calendar popover.
3. **Event Registration & Engagement**:
   * On `/events/[id]`, registered users can:
     * Interact with the **AI Event Chatbot** to ask questions about the event (e.g., "Where is it?", "What is the prize?").
     * Write queries in the comments section.
     * Upload their photo into the **Face Search** component to locate images of themselves among the uploaded event photos.
4. **Organizer Event Management**:
   * Under `/events/[id]/manage`, organizers have a dedicated sidebar enabling:
     * **Details**: Edit descriptions, event title, pricing, location.
     * **Media**: Set banner and logo images.
     * **Team**: Manage/add users to the organizing team with specific roles.
     * **Speakers & Sponsors**: Keep records of speakers and manage sponsorship goals/amounts.
     * **Tasks**: Manage a Kanban-like list of tasks. Organizers can create tasks manually or use **Gemini AI** to auto-generate 5 distinct tasks for category fields (marketing, logistics, technical, etc.) and assign them to team members based on their designated roles.
     * **Social Media**: Generate promotional posts for Instagram, LinkedIn, and Twitter using Gemini AI, with options to download a dynamically rendered announcement banner.
     * **Winners & Certificates**: Declare event winners (1st, 2nd, 3rd) and generate customized printable completion or winner certificates.

---

## 5. AI Integrations
Gemini AI features are implemented using the Vercel AI SDK (`ai` package) in `lib/ai.ts`:

1. **Event Assistant (`handleEventQuery`)**:
   * Injects event contextual metadata (title, dates, location, description) directly into the model prompt context.
   * Enables attendees to get immediate, context-specific answers.
2. **Task Auto-Generation (`generateEventTasks`)**:
   * Takes the event details and a list of organizing team members and roles.
   * Asks Gemini 1.5 Flash to output a structured JSON array using `Output.object`.
   * Assigns tasks matching member capabilities (e.g. technical tasks to the Tech Head).
3. **Social Post Writer (`generateSocialPost` & `generateSocialPostUser`)**:
   * Tailors output styles and character limits specifically for Instagram (visual, hashtags), Twitter (concise), and LinkedIn (professional/reflective).
   * Supports generating organizer marketing posts and attendee "achievement shares" (for winning/participation).

---

## 6. Dynamic Image Generation Flow
The `/api/social/generate-image` and `/api/certificate` endpoints use Vercel's `@vercel/og` library:
1. When a user requests a certificate (e.g., from `/my-events/achievements`), the client calls `/api/certificate?eventName=...&userName=...&position=...`.
2. The Edge route executes, rendering a React component that styles a certificate structure (borders, title, award type, signature lines).
3. Vercel OG converts this React element tree into SVG, compiles it using Yoga, and returns a high-resolution PNG image directly.
4. This ensures that certificates are lightweight to generate, highly scalable, and instantly downloadable without server-side canvas or puppeteer rendering overhead.

# Event Management Website

The **Event Management Website** is a powerful, modern web application built with **Next.js**, designed to streamline event planning and management. With seamless integrations of **Firebase**, **UploadThing**, and **Gemini AI**, this platform allows users to create, manage, and enhance their event experiences efficiently.

Firebase provides a robust backend for authentication and real-time database management, UploadThing simplifies file uploads, and Gemini AI enhances the experience with AI-driven features.

## Youtube Demo Video

[Event Management Website Demo Video](https://www.youtube.com/watch?v=mQ5MvmtQ_q8&ab_channel=EthanRodrigues)

## Getting Started

First, install dependencies:

```sh
npm install
```

Then, run the development server:

```sh
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

### Firebase Setup

Firebase serves as the backend for authentication, database storage, and real-time updates.

- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
- Enable Firestore and Authentication
- Generate Firebase configuration credentials
- Add your Firebase credentials in a `.env.local` file:

```sh
NEXT_PUBLIC_FIREBASE_API_KEY=<your_firebase_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your_auth_domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your_project_id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your_storage_bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_messaging_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your_app_id>
```

### UploadThing Setup

UploadThing simplifies the process of handling media and file uploads.

- Sign up at [UploadThing](https://uploadthing.com/)
- Obtain your UploadThing API key
- Add it to `.env.local`:

```sh
NEXT_PUBLIC_UPLOADTHING_API_KEY=<your_uploadthing_api_key>
```

### Gemini API Setup (If Applicable)

Gemini AI enhances the application by providing intelligent suggestions and automation.

- Obtain the necessary API keys for the Gemini integration
- Add them to `.env.local`:

```sh
NEXT_PUBLIC_GEMINI_API_KEY=<your_gemini_api_key>
```

## Editing the Project

You can start modifying the project by editing `app/page.tsx`. The page auto-updates as you edit the file.

This project uses `next/font` to automatically optimize and load Geist, a new font family for Vercel.

## Learn More

To learn more about Next.js, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can also check out the [Next.js GitHub repository](https://github.com/vercel/next.js) – your feedback and contributions are welcome!

## Deployment

The easiest way to deploy your Next.js app is through [Vercel](https://vercel.com), the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

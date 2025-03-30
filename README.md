# Event Management Website

This is an event management website built using Next.js and Firebase. Follow the steps below to set up and run the application on your local machine.

## Prerequisites

- Node.js installed
- Firebase account
- API keys for necessary services

## Installation and Setup

### 1. Clone the Repository

sh
git clone <repository_url>
cd <project_directory>

### 2. Install Dependencies

sh
npm install

### 3. Configure Firebase

- Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
- Enable Firestore and Authentication as required
- Generate Firebase configuration credentials
- Add your Firebase credentials in a .env.local file:

sh
NEXT_PUBLIC_FIREBASE_API_KEY=<your_firebase_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your_auth_domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your_project_id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your_storage_bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_messaging_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your_app_id>

### 4. Configure Uploading Service (UploadThing)

- Sign up at [UploadThing](https://uploadthing.com/)
- Obtain your UploadThing API key
- Add the following to your .env.local file:

sh
NEXT_PUBLIC_UPLOADTHING_API_KEY=<your_uploadthing_api_key>

### 5. Configure Gemini API

- Obtain the necessary API keys for the Gemini integration.
- Add the following in the .env.local file:

sh
NEXT_PUBLIC_GEMINI_API_KEY=<your_gemini_api_key>

### 6. Start the Development Server

sh
npm run dev

The application should now be running at http://localhost:3000/.

## Notes

- Ensure all necessary API keys are set in the .env.local file.
- Restart the development server after making changes to environment variables.

## License

This project is licensed under [your chosen license].

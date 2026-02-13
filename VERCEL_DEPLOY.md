# Vercel Deployment Guide for Nextn (Endosmanager)

This guide outlines the steps to deploy the Endosmanager application to Vercel.

## 1. Prerequisites

- A Vercel account (https://vercel.com)
- The project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## 2. Environment Variables

The application requires the following environment variables to be set in Vercel. You can find these settings in your Vercel project under **Settings > Environment Variables**.

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `GOOGLE_GENAI_API_KEY` | API Key for Google GenAI (Gemini) |

> **Note:** The `NEXT_PUBLIC_` prefix makes these variables available to the browser. `GOOGLE_GENAI_API_KEY` is a secret and should *not* have this prefix if only used server-side (Genkit usually runs server-side).

## 3. Deployment Steps

1.  **Import Project**: In Vercel, click "Add New..." > "Project" and select your Git repository.
2.  **Configure Project**:
    - **Framework Preset**: Next.js (should be auto-detected)
    - **Root Directory**: `endomanager` (since the app is in a subdirectory)
3.  **Add Environment Variables**: Copy the values from your local `.env.local` (or Firebase Console) and add them to the Vercel deployment configuration.
4.  **Deploy**: Click "Deploy".

## 4. Post-Deployment

- Verify that authentication works (Firebase).
- Test AI features to ensure `GOOGLE_GENAI_API_KEY` is correctly recognized.

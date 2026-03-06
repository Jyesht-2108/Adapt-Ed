# Firebase Authentication Setup Guide

## Prerequisites
- A Google account
- Node.js and npm installed

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter your project name (e.g., "AdaptEd")
4. Follow the setup wizard (you can disable Google Analytics if not needed)

## Step 2: Enable Google Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. Click on **Google** in the providers list
4. Toggle the **Enable** switch
5. Enter a project support email (your email)
6. Click **Save**

## Step 3: Register Your Web App

1. In the Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Select **Project settings**
3. Scroll down to "Your apps" section
4. Click the **Web icon** (`</>`) to add a web app
5. Enter an app nickname (e.g., "AdaptEd Web")
6. Check "Also set up Firebase Hosting" if you want (optional)
7. Click **Register app**

## Step 4: Copy Firebase Configuration

After registering your app, you'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 5: Create Environment File

1. In the `frontend` directory, create a `.env` file
2. Copy the values from your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. Replace the placeholder values with your actual Firebase configuration values

## Step 6: Configure Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add your development domain (usually `localhost` is already there)
3. When deploying, add your production domain

## Step 7: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/login` (or your dev server URL)

3. Click "Sign in with Google"

4. You should see a Google sign-in popup

5. After signing in, you should be redirected to either:
   - `/onboarding` (if you're a new user)
   - `/dashboard` (if you're a returning user with a roadmap)

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Make sure your domain is added to the Authorized domains list in Firebase Console
- For localhost, it should be added by default

### "Firebase: Error (auth/popup-blocked)"
- Your browser is blocking popups
- Allow popups for your development domain

### Environment variables not loading
- Make sure your `.env` file is in the `frontend` directory
- Restart your development server after creating/modifying `.env`
- Vite requires the `VITE_` prefix for environment variables

### "Firebase: Error (auth/api-key-not-valid)"
- Double-check that you copied the API key correctly
- Make sure there are no extra spaces or quotes in your `.env` file

## Security Notes

- **Never commit your `.env` file to version control**
- The `.env` file is already in `.gitignore`
- For production, set environment variables in your hosting platform
- Firebase API keys are safe to expose in client-side code (they're restricted by domain)

## Next Steps

After authentication is working:
1. Store user data in Firestore (optional)
2. Implement user profile management
3. Add email/password authentication (optional)
4. Set up Firebase Security Rules
5. Configure Firebase Hosting for deployment (optional)

## Useful Links

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

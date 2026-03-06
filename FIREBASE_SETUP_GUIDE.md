# Firebase Authentication Setup Guide

Firebase authentication has been enabled in the frontend. Follow these steps to complete the setup:

## Frontend Setup (Already Done ✓)

The following files have been created:
- `frontend/src/lib/firebase.ts` - Firebase configuration
- `frontend/src/lib/api.ts` - API helper functions
- `frontend/src/contexts/AuthContext.tsx` - Updated to use Firebase Auth
- `frontend/.env` - Environment variables template

## Steps to Enable Firebase

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard

### 2. Enable Google Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Toggle **Enable**
4. Add your support email
5. Click **Save**

### 3. Register Web App

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register app with a nickname (e.g., "AdaptEd Web")
5. Copy the configuration values

### 4. Configure Frontend Environment

Edit `frontend/.env` and replace with your Firebase config values:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 5. Add Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add your domains:
   - `localhost` (for development)
   - Your production domain (when deployed)

### 6. Backend Setup (Optional - for Admin SDK)

If you want to verify Firebase tokens on the backend:

1. Go to **Project Settings** > **Service accounts**
2. Click **Generate new private key**
3. Save the JSON file as `backend/firebase-admin-key.json`
4. Add to `backend/.env`:
   ```env
   FIREBASE_ADMIN_KEY_PATH=firebase-admin-key.json
   ```

5. Install Firebase Admin SDK:
   ```bash
   cd backend
   pip install firebase-admin
   ```

6. Add to `.gitignore`:
   ```
   firebase-admin-key.json
   ```

## Testing

1. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to the login page
3. Click "Sign in with Google"
4. Complete the Google sign-in flow
5. You should be redirected to the onboarding or dashboard

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to Authorized domains in Firebase Console

### "Firebase: Error (auth/api-key-not-valid)"
- Check that your API key in `.env` is correct
- Ensure the Firebase project is active

### "Firebase: Error (auth/popup-blocked)"
- Allow popups for localhost in your browser
- Try using redirect instead of popup (modify AuthContext.tsx)

### Environment variables not loading
- Restart the dev server after changing `.env`
- Ensure `.env` is in the `frontend` directory
- Check that variables start with `VITE_`

## Current Status

✅ Firebase SDK installed (v12.9.0)
✅ Firebase configuration file created
✅ AuthContext updated to use Firebase
✅ API helper functions created
✅ Environment template created

⏳ Pending: Add your Firebase project credentials to `.env`
⏳ Pending: Enable Google sign-in in Firebase Console

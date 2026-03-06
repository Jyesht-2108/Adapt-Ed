# Firebase Authentication Setup Checklist

Follow these steps to complete the Firebase authentication setup:

## ✅ Step 1: Create Firebase Project
- [ ] Go to https://console.firebase.google.com/
- [ ] Click "Add project" or "Create a project"
- [ ] Name your project (e.g., "AdaptEd")
- [ ] Complete the setup wizard

## ✅ Step 2: Enable Google Authentication
- [ ] Navigate to **Authentication** in Firebase Console
- [ ] Click **Sign-in method** tab
- [ ] Enable **Google** provider
- [ ] Add your support email
- [ ] Click **Save**

## ✅ Step 3: Register Web App
- [ ] Click gear icon (⚙️) → **Project settings**
- [ ] Scroll to "Your apps" section
- [ ] Click Web icon (`</>`)
- [ ] Enter app nickname (e.g., "AdaptEd Web")
- [ ] Click **Register app**

## ✅ Step 4: Get Firebase Configuration
- [ ] Copy the `firebaseConfig` object shown after registration
- [ ] Keep this information handy for the next step

## ✅ Step 5: Create .env File
- [ ] In the `frontend` directory, create a file named `.env`
- [ ] Copy the template from `.env.example`
- [ ] Replace placeholder values with your Firebase config values:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## ✅ Step 6: Verify Authorized Domains
- [ ] In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
- [ ] Verify `localhost` is in the list (should be there by default)
- [ ] When deploying, add your production domain here

## ✅ Step 7: Test the Setup
- [ ] Make sure `.env` file is saved in `frontend` directory
- [ ] Start the development server:
  ```bash
  cd frontend
  npm run dev
  ```
- [ ] Open your browser to the dev server URL (usually http://localhost:5173)
- [ ] You should be redirected to `/login`
- [ ] Click "Sign in with Google"
- [ ] Complete the Google sign-in flow
- [ ] You should be redirected to `/onboarding` (new user) or `/dashboard` (returning user)

## ✅ Step 8: Verify Features
- [ ] Login with Google works
- [ ] User avatar appears in header
- [ ] User name and email display correctly
- [ ] Profile dropdown menu works
- [ ] Logout button works
- [ ] After logout, redirected to `/login`
- [ ] Protected routes redirect to `/login` when not authenticated

## 🎉 Success!

If all checkboxes are complete, your Firebase authentication is fully set up!

## 🐛 Troubleshooting

If something doesn't work, check:

1. **Environment variables not loading?**
   - Restart your dev server after creating `.env`
   - Verify `.env` is in the `frontend` directory
   - Check for typos in variable names (must start with `VITE_`)

2. **"Unauthorized domain" error?**
   - Add your domain to Authorized domains in Firebase Console
   - For localhost, it should already be there

3. **Popup blocked?**
   - Allow popups for your development domain in browser settings

4. **Still having issues?**
   - Check browser console for error messages
   - Verify all Firebase config values are correct
   - Make sure Google sign-in is enabled in Firebase Console

## 📚 Additional Resources

- Full setup guide: `FIREBASE_SETUP.md`
- Implementation details: `AUTH_IMPLEMENTATION.md`
- Firebase docs: https://firebase.google.com/docs/auth

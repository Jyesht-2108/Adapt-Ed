# Quick Start Checklist

## ✅ Already Done

- [x] Firebase credentials added to `.env`
- [x] Firebase initialized in `src/lib/firebase.ts`
- [x] Authentication context set up
- [x] Protected routes configured
- [x] Google Auth Provider configured

## ⏳ You Need to Do

### 1. Enable Google Sign-In in Firebase Console
**Time**: 2 minutes

1. Go to: https://console.firebase.google.com/project/ridehailingapp-5eeec/authentication/providers
2. Click on "Google"
3. Toggle "Enable"
4. Select your email as support email
5. Click "Save"

### 2. Add Authorized Domain
**Time**: 1 minute

1. In Firebase Console → Authentication → Settings → Authorized domains
2. `localhost` should already be there
3. If not, click "Add domain" and add `localhost`

### 3. Install Dependencies (if not done)
**Time**: 2-3 minutes

```bash
cd AdaptEd/frontend
npm install
```

### 4. Start Development Server
**Time**: 30 seconds

```bash
npm run dev
```

### 5. Test Authentication
**Time**: 1 minute

1. Open browser to `http://localhost:5173`
2. Click "Sign in with Google"
3. Select your Google account
4. Should redirect to dashboard

## That's It!

Total setup time: ~5-7 minutes

## Common Issues

### "unauthorized-domain" error
→ Add `localhost` to authorized domains in Firebase Console

### "operation-not-allowed" error  
→ Enable Google Sign-In in Firebase Console

### Environment variables not loading
→ Restart dev server after creating `.env`

## Need Help?

Check `FIREBASE_SETUP_COMPLETE.md` for detailed instructions.

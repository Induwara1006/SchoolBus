# 🚀 Quick Start - Deploy in 5 Minutes

## Step 1: Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase
```bash
firebase login
```

## Step 3: Configure Your Environment
```bash
# Copy the production environment template
copy .env.production .env.production.local

# Edit .env.production.local with your Firebase project credentials
# Get these from: Firebase Console > Project Settings > Your apps > SDK setup and configuration
```

Example `.env.production.local`:
```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxxxxxxxxx
```

## Step 4: Initialize Firebase (First Time Only)
```bash
firebase init

# Select:
# ☑ Firestore
# ☑ Hosting

# Settings:
# - Firestore rules file: firestore.rules (already exists)
# - Public directory: dist
# - Single-page app: Yes
# - Overwrite index.html: No
```

## Step 5: Enable Firebase Authentication
1. Go to: https://console.firebase.google.com
2. Select your project
3. Go to: Authentication > Sign-in method
4. Enable: Email/Password
5. Enable: Google
6. Add your domain to Authorized domains (for production)

## Step 6: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

## Step 7: Test Production Build Locally
```bash
npm run build:prod
npm run preview
```
Visit: http://localhost:4173

## Step 8: Deploy to Firebase Hosting
```bash
npm run deploy
```

## Step 9: Test Your Live Application
Your app will be deployed to: `https://your-project-id.web.app`

Test:
- ✅ Can you access the site?
- ✅ Can you login with email/password?
- ✅ Can you login with Google?
- ✅ Does the parent dashboard work?
- ✅ Does the driver dashboard work?
- ✅ Do real-time updates work?

---

## 🎉 That's It!

Your School Bus Transport System is now live!

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build:prod
```

### Authentication Not Working
- Check that your domain is in Firebase Console > Authentication > Settings > Authorized domains
- Verify your `.env.production.local` has correct credentials
- Make sure Google OAuth is enabled

### Database Permission Errors
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check rules in Firebase Console > Firestore Database > Rules

---

## 📚 Need More Help?

- **Complete Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Checklist**: [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md)
- **Summary**: [SUMMARY.md](SUMMARY.md)

---

## 🆘 Emergency Rollback

If something goes wrong:
```bash
firebase hosting:rollback
```

---

**Ready?** Start with Step 1 above! 🚀

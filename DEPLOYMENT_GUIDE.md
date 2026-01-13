# School Bus Transport System - Production Deployment Guide

## 🚀 Quick Start - Deploying to Production

### Prerequisites
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Firebase project created
- Git for version control

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Copy `.env.production` to `.env.production.local`
- [ ] Update all Firebase credentials in `.env.production.local`
- [ ] Verify all required environment variables are set
- [ ] Ensure `.env.production.local` is in `.gitignore` (already done)

### 2. Firebase Setup
- [ ] Create Firebase project at https://console.firebase.google.com
- [ ] Enable Authentication (Email/Password & Google)
- [ ] Create Firestore Database (production mode)
- [ ] Add authorized domains in Authentication settings
- [ ] Deploy Firestore security rules
- [ ] Set up Firebase Hosting

### 3. Code Review
- [ ] All console.log statements removed (✅ Done)
- [ ] Error boundaries implemented (✅ Done)
- [ ] Production build tested locally
- [ ] All features working correctly

## 🔧 Step-by-Step Deployment

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
```bash
# Copy the production environment template
copy .env.production .env.production.local

# Edit .env.production.local with your actual Firebase credentials
# Get these from Firebase Console > Project Settings > Your apps
```

### Step 3: Test Production Build Locally
```bash
# Build for production
npm run build:prod

# Preview the production build
npm run preview

# Open http://localhost:4173 to test
```

### Step 4: Login to Firebase
```bash
firebase login
```

### Step 5: Initialize Firebase (if not done)
```bash
# This will create firebase.json and .firebaserc
firebase init

# Select:
# - Firestore (configure rules)
# - Hosting (dist folder)
# - Functions (if using)
```

### Step 6: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Step 7: Deploy to Firebase Hosting
```bash
# Deploy everything (recommended for first deployment)
npm run deploy

# Or deploy manually
npm run build:prod
firebase deploy --only hosting
```

### Step 8: Verify Deployment
- Visit your Firebase Hosting URL
- Test login functionality
- Test parent and driver dashboards
- Verify real-time updates work
- Check for any console errors

## 🔐 Security Best Practices

### Environment Variables
- ✅ Never commit `.env`, `.env.local`, or `.env.production.local`
- ✅ Use different Firebase projects for dev and production
- ✅ Rotate API keys if accidentally exposed

### Firestore Rules
Your firestore.rules file contains production-ready security rules that:
- Require authentication for all operations
- Restrict users to their own data
- Validate data types and required fields
- Prevent unauthorized access

### Firebase Configuration
- ✅ Enable App Check for additional security
- ✅ Set up budget alerts to monitor usage
- ✅ Configure CORS policies if using Firebase Functions

## 📊 Post-Deployment Monitoring

### Firebase Console
1. Monitor Authentication users
2. Check Firestore database for data integrity
3. Review Hosting metrics and bandwidth
4. Set up budget alerts

### Application Monitoring
- Check Firebase Analytics (if configured)
- Monitor error rates
- Track user engagement
- Review performance metrics

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build:prod
```

### Firebase Deployment Issues
```bash
# Check Firebase project
firebase projects:list

# Verify you're using the correct project
firebase use <project-id>

# Re-deploy
firebase deploy --only hosting
```

### Authentication Issues
- Verify authorized domains in Firebase Console
- Check that all environment variables are correct
- Ensure Google OAuth is enabled for your domain

### Database Issues
- Review Firestore rules are deployed
- Check indexes are created for queries
- Verify collection names match code

## 🔄 Updating the Application

### For Minor Updates
```bash
# Make your changes
git add .
git commit -m "Description of changes"

# Build and deploy
npm run deploy
```

### For Major Updates
1. Test thoroughly in development
2. Create a backup of Firestore data
3. Update Firestore rules if needed
4. Deploy during low-traffic periods
5. Monitor for issues after deployment

## 📱 Domain Configuration

### Custom Domain Setup
1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow DNS configuration steps
4. SSL certificates are auto-provisioned

### Authorized Domains
Add your domain to:
- Firebase Console > Authentication > Settings > Authorized domains
- Firebase Console > Authentication > Sign-in method > Google > Authorized domains

## 💾 Backup Strategy

### Firestore Data
```bash
# Export Firestore data
gcloud firestore export gs://[BUCKET_NAME]

# Or use Firebase Console:
# Firestore Database > Import/Export
```

### Code Repository
- Keep production branch protected
- Tag releases with version numbers
- Maintain changelog

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Review Firebase Console logs
3. Verify environment variables
4. Check this guide's troubleshooting section

## 🎉 Success Checklist

After deployment, verify:
- [ ] Application loads at production URL
- [ ] Users can register and login
- [ ] Parent dashboard shows children correctly
- [ ] Driver dashboard updates in real-time
- [ ] Maps display correctly
- [ ] Notifications work
- [ ] Payments are processing (if configured)
- [ ] Mobile responsiveness works
- [ ] No console errors

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [React Production Mode](https://react.dev/reference/react-dom/client/createRoot)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Maintained by:** School Transport Development Team

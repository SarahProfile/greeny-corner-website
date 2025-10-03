# Firebase Phone Authentication Setup

## Development Mode
The app currently uses **mock phone authentication** for development since Firebase Phone Auth is not properly configured.

**For testing:**
- Enter any valid phone number (e.g., +971566431790)
- Use verification code: **123456**

## Production Setup Required

To enable real Firebase Phone Authentication, follow these steps:

### 1. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **greeny-corner**
3. Navigate to **Authentication → Sign-in method**
4. Click on **Phone** and enable it
5. Add authorized domains:
   - `localhost` (for development)
   - `localhost:3000` (for development)
   - Your production domain

### 2. App Configuration
1. In Firebase Console, go to **Project Settings**
2. Under **Your apps**, find your web app
3. Make sure all required configuration is set:
   - API Key ✓
   - Auth Domain ✓
   - Project ID ✓
   - App ID ✓

### 3. Test Phone Numbers (Optional)
For testing without SMS charges:
1. In Firebase Console → Authentication → Sign-in method
2. Click on **Phone** provider
3. Add test phone numbers with verification codes
4. Example: `+1 555-555-5555` with code `123456`

### 4. Production Requirements
For production deployment:
1. **Enable billing** on Firebase project (required for phone auth)
2. **Add production domains** to authorized domains
3. **Configure proper reCAPTCHA** settings
4. **Set up phone number quotas** and limits

## Current Error
```
Firebase: Error (auth/invalid-app-credential)
```
This error indicates Phone Authentication is not enabled in Firebase Console.

## Quick Fix
1. Enable Phone Authentication in Firebase Console
2. Remove the development mock mode by setting `NODE_ENV=production`
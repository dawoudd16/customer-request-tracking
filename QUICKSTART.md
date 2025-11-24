# Quick Start Guide

## Prerequisites

1. **Node.js** (v16+)
2. **Firebase Project** with:
   - Authentication (Email/Password enabled)
   - Firestore Database
   - Storage Bucket

## Step 1: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable **Authentication** → **Email/Password**
4. Create **Firestore Database** (start in test mode for development)
5. Create **Storage Bucket**
6. Go to **Project Settings** → **Service Accounts**
7. Click **Generate New Private Key** → Save the JSON file securely

## Step 2: Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/your-service-account-key.json
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Start backend:
```bash
npm start
# or for development:
npm run dev
```

## Step 3: Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:3001
```

Start frontend:
```bash
npm run dev
```

## Step 4: Create First User

1. Go to Firebase Console → Authentication
2. Add a user with email/password (e.g., `agent@example.com`)
3. Note the UID
4. In Firestore, create a document in `users` collection:
   - Document ID: `<the-uid-from-step-2>`
   - Fields:
     ```json
     {
       "name": "Test Agent",
       "email": "agent@example.com",
       "role": "agent",
       "createdAt": <timestamp>
     }
     ```

## Step 5: Test the System

1. Open `http://localhost:5173`
2. Login with the agent credentials
3. Create a new request
4. Copy the customer link
5. Open the customer link in an incognito window
6. Upload documents and submit

## Troubleshooting

### Backend won't start
- Check Firebase service account path in `.env`
- Ensure Firestore and Storage are enabled
- Check port 3001 is not in use

### Frontend can't connect to backend
- Verify backend is running on port 3001
- Check CORS settings in `backend/src/app.js`
- Check `VITE_API_URL` in frontend `.env`

### Authentication errors
- Verify Firebase config in frontend `.env`
- Check user exists in Firebase Authentication
- Verify user document exists in Firestore with correct role

### File upload fails
- Check Firebase Storage rules (should allow authenticated uploads)
- Verify Storage bucket is created
- Check file size limits (default: 10MB)

## Next Steps

- Review the main [README.md](README.md) for detailed documentation
- Customize business rules in `backend/src/jobs/`
- Add more document types if needed
- Extend Manager dashboard features (Version 2)


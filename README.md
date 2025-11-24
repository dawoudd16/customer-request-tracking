# Customer Request Tracking System

A secure, web-based system for car dealerships to manage customer document uploads and request tracking. Built with Node.js/Express backend and React frontend, using Firebase for authentication, database, and storage.

## Features

### Version 1 (Current)

- **Customer Portal**: Secure token-based access for customers to upload documents
- **Tele-Sales Dashboard**: Full request management for sales agents
- **Reminder System**: Automatic 24h and 48h reminders
- **SLA Expiry**: Automatic expiration after 6 days
- **Review Workflow**: Approve/reject requests with comments
- **Audit Logging**: Complete audit trail of all actions

### Version 2 (Planned)

- **Manager Dashboard**: KPIs, advanced filtering, reassignment
- **External Partner API**: Read-only status queries for CRM integration

## Architecture

### Backend

- **Framework**: Node.js + Express
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Admin SDK (for employee verification)
- **Jobs**: node-cron for scheduled tasks

### Frontend

- **Framework**: React with Vite
- **Routing**: React Router
- **Authentication**: Firebase Web SDK (for employees)
- **Styling**: Inline styles (can be upgraded to CSS modules or styled-components)

## Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── routes/          # API route definitions
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access layer
│   │   ├── jobs/            # Scheduled tasks
│   │   ├── models/          # Data models
│   │   ├── firebase.js      # Firebase Admin setup
│   │   ├── authMiddleware.js # Auth verification
│   │   ├── app.js           # Express app config
│   │   └── server.js        # Server entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── pages/           # Page components
    │   ├── components/      # Reusable components
    │   ├── utils/           # Utility functions
    │   ├── firebaseClient.js # Firebase Web SDK setup
    │   ├── App.jsx          # Main app component
    │   └── main.jsx         # Entry point
    ├── package.json
    ├── vite.config.js
    └── .env.example
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Firebase project with:
  - Authentication enabled (Email/Password)
  - Firestore database
  - Storage bucket
  - Service account key (for backend)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Configure Firebase service account:
     - Option 1: Download service account JSON from Firebase Console
     - Set `FIREBASE_SERVICE_ACCOUNT_PATH` to the path of the JSON file
     - Option 2: Set individual environment variables (see `.env.example`)

4. Configure Firebase:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Generate a new private key
   - Save it securely and reference it in `.env`

5. Start the server:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

   Server runs on `http://localhost:3001` by default.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Get Firebase Web SDK config from Firebase Console:
     - Go to Project Settings > General
     - Scroll to "Your apps" section
     - Copy the config values to `.env`

4. Start the development server:
   ```bash
   npm run dev
   ```

   Frontend runs on `http://localhost:5173` by default.

## Firebase Configuration

### Firestore Collections

The system uses the following collections:

- **users**: Employee and customer user records
- **requests**: Customer request records
- **documents**: Uploaded document metadata
- **auditLogs**: Audit trail of all actions

### Initial User Setup

To create a Tele-Sales agent:

1. Create a user in Firebase Authentication (email/password)
2. Create a corresponding document in Firestore `users` collection:
   ```javascript
   {
     id: "<firebase-uid>",
     name: "Agent Name",
     email: "agent@example.com",
     role: "agent",
     createdAt: <timestamp>
   }
   ```

For managers, set `role: "manager"`.

## API Endpoints

### Customer Endpoints (Public)

- `GET /api/customer/requests/:token` - Get request by secure token
- `POST /api/customer/requests/:id/documents` - Upload document
- `POST /api/customer/requests/:id/submit` - Submit request

### Tele-Sales Endpoints (Protected)

- `POST /api/telesales/requests` - Create new request
- `GET /api/telesales/requests` - List assigned requests
- `GET /api/telesales/requests/:id` - Get request details
- `PATCH /api/telesales/requests/:id` - Update request
- `POST /api/telesales/requests/:id/reminded` - Mark reminder confirmed
- `POST /api/telesales/requests/:id/reopen` - Reopen expired request
- `POST /api/telesales/requests/:id/review` - Review request (approve/reject)

### Manager Endpoints (Protected, Version 1: Stubbed)

- `GET /api/manager/kpis` - Get KPIs
- `GET /api/manager/requests` - List all requests (with filters)
- `POST /api/manager/requests/:id/reassign` - Reassign request (v2)
- `POST /api/manager/requests/:id/reopen` - Reopen expired request
- `GET /api/manager/requests/:id/audit` - Get audit log

### Partner Endpoints (Read-Only)

- `GET /api/partner/requests/:id/status` - Get request status

## Business Rules

### Reminder System

1. **First Reminder (24h)**: Triggered 24 hours after request creation
   - Sets `needsReminderLevel = 1` (yellow badge)
   - Only for OPEN, IN_PROGRESS, or SUBMITTED requests

2. **Second Reminder (48h)**: Triggered 48 hours after agent confirms a reminder
   - Sets `needsReminderLevel = 2` (red badge)
   - Requires `lastReminderAt` to be set

3. **Reminder Confirmation**: When agent clicks "I reminded the customer"
   - Resets `needsReminderLevel = 0`
   - Sets `lastReminderAt = now`

### SLA Expiry

- Requests expire after **6 days (144 hours)** from creation
- Only applies to non-COMPLETED requests
- Sets `status = "EXPIRED"` and `expiredAt = now`
- Expired requests become read-only for customers
- Can be reopened by Tele-Sales agents or Managers

### Document Upload

- Required documents: ID, Driving Licence, Proof of Address, Bank Statement
- Completion percentage calculated automatically
- Submit button only enabled when all documents are uploaded (100%)

### Review Workflow

- Only SUBMITTED requests can be reviewed
- Approve: Sets `reviewStatus = "APPROVED"` (optional comment)
- Reject: Sets `reviewStatus = "REJECTED"` (comment required)
- Review feedback visible to customers in portal

## Scheduled Jobs

Two cron jobs run every hour:

1. **Reminder Job** (`reminderJob.js`): Updates reminder levels
2. **SLA Expiry Job** (`slaExpiryJob.js`): Expires old requests

## Security

- **Customer Access**: High-entropy secure tokens (unguessable)
- **Employee Access**: Firebase Authentication with ID token verification
- **Role-Based Access**: Agents only see their assigned requests
- **HTTPS Required**: All endpoints should be served over HTTPS in production
- **Audit Logging**: All sensitive actions are logged

## Development Notes

- The code is structured to be beginner-friendly with extensive comments
- Business rules are clearly documented in comments
- Version 2 features are stubbed but structured for easy extension
- Manager dashboard and external partner API are placeholders

## License

This is a prototype system for educational/demonstration purposes.


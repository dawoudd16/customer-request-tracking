# Project Overview for Individual Report

## Project Title
Customer Request Tracking System for Car Dealerships

## Project Description
A secure, web-based system that allows car dealerships to manage customer document uploads and request tracking. The system enables tele-sales agents to create secure request links for customers, who can then upload required documents (ID, Driving License, Proof of Address, Bank Statement) through a secure portal. The system includes automated reminders, SLA expiry management, and a review workflow for approving or rejecting customer submissions.

## Technology Stack

### Backend
- **Framework**: Node.js with Express.js
- **Database**: Firebase Firestore (NoSQL)
- **Storage**: Firebase Storage (for document files)
- **Authentication**: Firebase Admin SDK (for employee authentication)
- **Scheduled Tasks**: node-cron (for automated reminders and expiry)
- **File Upload**: Multer (for handling document uploads)

### Frontend
- **Framework**: React.js (v18.2.0)
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Authentication**: Firebase Web SDK (for employee login)
- **Styling**: Inline CSS (modern, responsive design)

## Key Features Implemented

### 1. Customer Portal
- Secure token-based access (unguessable tokens)
- Document upload interface (4 required documents)
- Real-time upload progress
- Document preview and download
- Submit request functionality
- View review status and feedback
- Documents hidden after submission for security

### 2. Tele-Sales Dashboard
- Create new customer requests with secure links
- View all assigned requests
- Request detail view with full information
- Update request status
- Mark reminders as confirmed
- Review requests (approve/reject with comments)
- Reopen expired requests
- Delete requests
- Display customer portal link for resending
- Show logged-in agent name

### 3. Automated Reminder System
- **First Reminder (24h)**: Yellow badge after 24 hours
- **Second Reminder (48h)**: Red badge 48 hours after first reminder confirmation
- Automated cron job runs every hour
- Manual reminder confirmation by agents

### 4. SLA Expiry Management
- Requests automatically expire after 6 days (144 hours)
- Expired requests become read-only for customers
- Can be reopened by agents or managers
- Automatic status update via cron job

### 5. Review Workflow
- Agents can approve or reject submitted requests
- Comments required for rejections
- Review status visible to customers
- Automatic status transitions

### 6. Security Features
- Role-based access control (agents, managers)
- Secure token generation for customer access
- Firebase Authentication for employees
- Audit logging for all sensitive actions
- Documents hidden after submission

## System Architecture

### Backend Structure (Layered Architecture)
```
backend/
├── routes/          # API endpoint definitions
├── controllers/     # Request handlers (business logic entry points)
├── services/        # Core business logic
├── repositories/    # Data access layer (Firestore operations)
├── jobs/            # Scheduled tasks (cron jobs)
├── models/          # Data models and constants
└── middleware/      # Authentication middleware
```

### Frontend Structure (Component-Based)
```
frontend/
├── pages/           # Main page components (Login, Dashboard, Portal)
├── components/      # Reusable UI components
├── utils/           # Utility functions (API calls, helpers)
└── firebaseClient.js # Firebase configuration
```

## Database Schema (Firestore Collections)

### `requests` Collection
- Request ID, customer name, email, phone
- Status (OPEN, IN_PROGRESS, SUBMITTED, COMPLETED, EXPIRED)
- Review status (PENDING, APPROVED, REJECTED)
- Secure token for customer access
- Reminder levels and timestamps
- SLA expiry information
- Created/updated timestamps

### `documents` Collection
- Document ID, request ID reference
- Document type (ID, DRIVING_LICENSE, etc.)
- File path in Firebase Storage
- Upload timestamp
- File metadata

### `users` Collection
- User ID (Firebase Auth UID)
- Name, email, role (agent/manager)
- Created timestamp

### `auditLogs` Collection
- Action type, user ID, request ID
- Timestamp, details
- Complete audit trail

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
- `POST /api/telesales/requests/:id/review` - Review request
- `DELETE /api/telesales/requests/:id` - Delete request
- `GET /api/telesales/me` - Get current user info

## Business Rules

### Reminder System Logic
1. First reminder triggers 24 hours after request creation
2. Second reminder triggers 48 hours after agent confirms first reminder
3. Reminder confirmation resets the reminder level and records timestamp

### SLA Expiry Logic
- Requests expire 6 days (144 hours) after creation
- Only non-COMPLETED requests can expire
- Expired requests are read-only for customers

### Document Upload Rules
- 4 required documents: ID, Driving License, Proof of Address, Bank Statement
- Submit button only enabled when all documents uploaded (100% completion)
- Documents hidden from customers after submission

## Challenges Overcome

1. **Date Formatting Issues**: Fixed Firestore Timestamp serialization by converting to ISO strings in backend
2. **Reminder Logic**: Corrected second reminder trigger condition
3. **Request Visibility**: Implemented agent-based filtering for request lists
4. **Document Security**: Implemented document hiding after submission
5. **State Management**: Fixed form reset and navigation issues in React components

## Testing Approach

- Manual testing with multiple user accounts
- Created diagnostic scripts for testing reminder and expiry logic
- Tested with real-time data manipulation (aging requests for testing)
- Cross-browser testing for frontend compatibility

## Future Enhancements (Planned)

- Manager Dashboard with KPIs and advanced filtering
- External Partner API for CRM integration
- Enhanced reporting and analytics
- Email notifications for reminders
- Mobile-responsive improvements

## Project Scope

This is an individual project demonstrating:
- Full-stack web development
- Database design and management
- Authentication and authorization
- Scheduled task automation
- File upload and storage
- RESTful API design
- Modern React development
- Security best practices



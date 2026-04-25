# WorkFlow Pro — Enterprise Work Management System





## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Clone Repository](#1-clone-the-repository)
  - [Backend Setup](#2-backend-setup)
  - [Frontend Setup](#3-frontend-setup)
  - [Firebase Configuration](#4-firebase-configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [State Management Strategy](#state-management-strategy)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)

---

##  Overview

**WorkFlow Pro** is a production-ready enterprise work management system built with modern web technologies. It provides teams with a comprehensive platform for project management, task tracking, team collaboration, and performance analytics.

The system implements a **hybrid state management architecture** combining Redux Toolkit for high-frequency data operations and Context API for stable application-wide state, ensuring optimal performance and maintainability.

### Key Highlights

- **Secure Authentication** — JWT-based auth with role-based access control (Admin, Manager, Employee)
- **Real-time Collaboration** — WebSocket-powered live updates across all connected clients
- **Advanced Analytics** — Interactive dashboards with Recharts visualizations
- **Modern UI/UX** — Responsive design with dark mode support and smooth animations
- **Modular Architecture** — Clean separation of concerns with Context API + Redux Toolkit
- **Comprehensive Testing** — Unit tests, integration tests, and test coverage reports
- **Production Ready** — Optimized build, security best practices, and deployment guides

---

## Features

### Core Functionality

#### Authentication & Authorization
- JWT-based authentication with secure token management
- Role-based access control (RBAC) with three tiers:
  - **Admin** — Full system access, user management, all CRUD operations
  - **Manager** — Project and task management, team oversight
  - **Employee** — Task viewing and self-assigned task management
- Protected routes with automatic token validation
- Session persistence with localStorage
- Password hashing with bcrypt (12 rounds)

#### Project Management
- Create, update, archive, and delete projects
- Project status tracking (Active, Completed, Pending, Archived)
- Due date management with overdue indicators
- Member assignment and access control
- Real-time project updates across all users
- Project-specific task filtering

#### Task Management (Kanban Board)
- Drag-and-drop Kanban interface powered by @dnd-kit
- Four workflow stages: To Do → In Progress → Review → Done
- Task types: Bug, Feature, Improvement
- Priority levels: High, Medium, Low
- Task assignment with user search
- Due date tracking with visual overdue warnings
- Comments and attachments support
- Real-time task synchronization via WebSocket
- Optimistic UI updates for instant feedback

#### User Management (Admin Only)
- User CRUD operations
- Role assignment and modification
- Account status management (Active/Inactive)
- Last activity tracking
- Prevent self-deletion and self-role-modification
- User search and filtering

#### Reports & Analytics
- Interactive charts with Recharts:
  - Task distribution by status (Bar Chart)
  - Task breakdown by type (Pie Chart)
  - Priority analysis (Horizontal Bar Chart)
  - Project status overview (Bar Chart)
- Real-time statistics:
  - Total tasks and completion rate
  - Active projects count
  - High-priority task tracker
- Auto-updating dashboards

#### User Experience
- **Dark Mode** — System-wide theme toggle with localStorage persistence
- **Real-time Notifications** — Toast notifications for all user actions
- **Responsive Design** — Mobile-first approach with Tailwind CSS
- **Loading States** — Skeleton loaders and progress indicators
- **Error Handling** — Graceful error messages with retry options
- **Accessibility** — ARIA labels, keyboard navigation, screen reader support

#### Settings & Preferences
- Profile management (name, avatar)
- Password change with current password verification
- Theme preferences (light/dark mode)
- Role and permission display

---

## Architecture

WorkFlow Pro implements a **modern hybrid state management architecture** that optimally distributes state between Redux Toolkit and Context API based on update frequency and data flow patterns.

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                                │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    React Application (Vite)                      │   │
│  │                                                                   │   │
│  │  ┌─────────────────┐         ┌───────────────────────────┐     │   │
│  │  │  Redux Toolkit  │         │     Context API           │     │   │
│  │  │  (Hot State)    │         │     (Cold State)          │     │   │
│  │  │                 │         │                           │     │   │
│  │  │ • authSlice     │         │ • ThemeContext            │     │   │
│  │  │ • projectsSlice │         │ • SocketContext           │     │   │
│  │  │ • tasksSlice    │         │ • NotificationContext     │     │   │
│  │  │ • usersSlice    │         │ • ModalContext            │     │   │
│  │  │ • dashboardSlice│         │                           │     │   │
│  │  └─────────────────┘         └───────────────────────────┘     │   │
│  │           │                              │                      │   │
│  │           └──────────────┬───────────────┘                      │   │
│  │                          │                                       │   │
│  │                    React Components                             │   │
│  │     (Login, Dashboard, Projects, Kanban, Users, etc.)          │   │
│  │                          │                                       │   │
│  └──────────────────────────┼───────────────────────────────────────┘   │
│                              │                                           │
│                    ┌─────────▼─────────┐                                │
│                    │   Axios Instance   │                                │
│                    │  (HTTP Client)     │                                │
│                    └─────────┬─────────┘                                │
│                              │                                           │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
                               │ HTTP/REST
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│                       BACKEND SERVER (Node.js)                            │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    Express.js Application                       │     │
│  │                                                                  │     │
│  │  ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐ │     │
│  │  │ Middleware   │    │  Controllers │    │     Routes      │ │     │
│  │  │              │    │              │    │                 │ │     │
│  │  │ • Auth       │───▶│ • Auth       │◀──▶│ • /auth/*      │ │     │
│  │  │ • RoleGuard  │    │ • Projects   │    │ • /projects/*  │ │     │
│  │  │ • CORS       │    │ • Tasks      │    │ • /tasks/*     │ │     │
│  │  │ • Helmet     │    │ • Users      │    │ • /users/*     │ │     │
│  │  └──────────────┘    │ • Notifs     │    │ • /notifs/*    │ │     │
│  │                       └──────────────┘    └─────────────────┘ │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                │                                         │
│                                ▼                                         │
│                    ┌───────────────────────┐                            │
│                    │   Socket.io Server    │                            │
│                    │  (WebSocket Handler)  │                            │
│                    └───────────────────────┘                            │
│                                │                                         │
└────────────────────────────────┼─────────────────────────────────────────┘
                                 │
                                 │ Firestore SDK
                                 │
┌────────────────────────────────▼─────────────────────────────────────────┐
│                     FIREBASE CLOUD (Google)                               │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      Firestore Database                          │    │
│  │                                                                   │    │
│  │  Collections:                                                     │    │
│  │  • users         — User profiles and auth data                   │    │
│  │  • projects      — Project metadata and status                   │    │
│  │  • tasks         — Task details, assignments, comments           │    │
│  │  • activities    — System activity log                           │    │
│  │  • notifications — User notifications                            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTION                               │
│                                                                          │
│  User drags task from "To Do" → "In Progress" on Kanban board          │
└────────────────────────┬───────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND EVENT HANDLER                               │
│                                                                          │
│  1. @dnd-kit captures drag event                                        │
│  2. Component dispatches Redux action: updateTask(taskId, {status})    │
│  3. SocketContext emits: socket.emit('task:move', {...})               │
└────────────────────────┬───────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐           ┌──────────────────────┐
│  Redux Thunk     │           │  WebSocket Emit      │
│  (Async Action)  │           │  (Real-time Signal)  │
└────────┬─────────┘           └──────────┬───────────┘
         │                                │
         │ HTTP PUT                       │ WS Event
         │ /tasks/:id                     │
         ▼                                ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND SERVER                          │
│                                                       │
│  ┌────────────────────┐    ┌──────────────────────┐ │
│  │  REST Controller   │    │  Socket Handler      │ │
│  │                    │    │                      │ │
│  │  1. Validate JWT   │    │  1. Authenticate     │ │
│  │  2. Check perms    │    │  2. Broadcast to     │ │
│  │  3. Update DB      │    │     project room     │ │
│  └────────┬───────────┘    └──────────┬───────────┘ │
│           │                           │              │
│           ▼                           ▼              │
│  ┌─────────────────────────────────────────────┐   │
│  │         Firestore Database                   │   │
│  │  tasks/{taskId} updated with new status     │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │                               │
         │ HTTP Response                 │ WS Broadcast
         │ {success, task}               │ task:moved event
         ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│  Redux Store Update  │       │  Other Clients       │
│  tasksSlice updated  │       │  (same project)      │
│  ↓                   │       │  ↓                   │
│  UI re-renders       │       │  Redux receives      │
│  Task in new column  │       │  Socket event        │
└──────────────────────┘       │  ↓                   │
                               │  tasksSlice updated  │
                               │  ↓                   │
                               │  UI re-renders       │
                               │  Task moves in       │
                               │  real-time           │
                               └──────────────────────┘
```

### State Management Decision Map

```
                        ┌─────────────────────────┐
                        │  New State Needed?      │
                        └────────────┬────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     │                               │
                     ▼                               ▼
         ┌───────────────────────┐       ┌──────────────────────┐
         │ Updates frequently    │       │ Rarely changes       │
         │ from multiple sources?│       │ (once per session)?  │
         │ (API + WebSocket)     │       └──────────┬───────────┘
         └───────────┬───────────┘                  │
                     │                              │
                     │ YES                          │ YES
                     ▼                              ▼
         ┌───────────────────────┐       ┌──────────────────────┐
         │ Used across many      │       │ Shared app-wide      │
         │ unrelated components? │       │ but stable?          │
         └───────────┬───────────┘       └──────────┬───────────┘
                     │                              │
                     │ YES                          │ YES
                     ▼                              ▼
         ┌───────────────────────┐       ┌──────────────────────┐
         │ Need async operations │       │ Simple toggle/ref    │
         │ or devtools tracking? │       │ no async needed?     │
         └───────────┬───────────┘       └──────────┬───────────┘
                     │                              │
                     │ YES                          │ YES
                     ▼                              ▼
         ┌───────────────────────┐       ┌──────────────────────┐
         │   REDUX TOOLKIT       │       │    CONTEXT API       │
         │                       │       │                      │
         │ Examples:             │       │ Examples:            │
         │ • Auth state          │       │ • Dark mode          │
         │ • Projects list       │       │ • Socket instance    │
         │ • Tasks list          │       │ • Toast queue        │
         │ • Users list          │       │ • Modal controller   │
         │ • Activity feed       │       │                      │
         └───────────────────────┘       └──────────────────────┘
```

### Why This Architecture?

**Redux Toolkit handles:**
- **High-frequency updates** — Task moves, project changes, real-time events
- **Cross-cutting state** — Data needed by many unrelated components
- **Async operations** — API calls with loading/error states
- **DevTools integration** — Time-travel debugging, state inspection
- **Predictable updates** — Centralized reducers, immutable state

**Context API handles:**
- **Stable references** — Theme preference, WebSocket connection
- **UI-scoped state** — Modal open/close, notification queue
- **Simple toggles** — Dark mode, settings that change once per session
- **Performance** — Avoids Redux boilerplate for rarely-changing data

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.2.0 | UI library with hooks and concurrent features |
| **Vite** | 5.0.8 | Fast build tool with HMR |
| **Redux Toolkit** | 2.0.1 | State management for hot data |
| **React Router** | 6.21.0 | Client-side routing with protected routes |
| **Tailwind CSS** | 3.4.0 | Utility-first CSS framework |
| **@dnd-kit** | 6.1.0 | Drag-and-drop for Kanban board |
| **Recharts** | 2.10.3 | Data visualization library |
| **Socket.io Client** | 4.7.2 | WebSocket client for real-time updates |
| **React Hook Form** | 7.49.2 | Performant form validation |
| **Yup** | 1.3.3 | Schema validation |
| **Axios** | 1.6.2 | HTTP client with interceptors |
| **date-fns** | 3.0.6 | Date formatting and manipulation |
| **Lucide React** | 0.303.0 | Icon library |
| **React Hot Toast** | 2.4.1 | Toast notification system |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 4.18.2 | Web framework for REST API |
| **Socket.io** | 4.7.2 | WebSocket server for real-time events |
| **Firebase Admin** | 11.11.0 | Server-side Firebase SDK |
| **JWT** | 9.0.2 | Token-based authentication |
| **bcryptjs** | 2.4.3 | Password hashing |
| **Helmet** | 7.1.0 | Security headers middleware |
| **Morgan** | 1.10.0 | HTTP request logger |
| **CORS** | 2.8.5 | Cross-origin resource sharing |
| **Express Validator** | 7.0.1 | Request validation |

### Database & Services

| Service | Purpose |
|---------|---------|
| **Firebase Firestore** | NoSQL cloud database |
| **Firebase Auth** | User authentication (client SDK) |
| **Firebase Storage** | File uploads (optional) |

### Development & Testing

| Tool | Purpose |
|------|---------|
| **Jest** | Unit testing framework |
| **React Testing Library** | Component testing utilities |
| **Babel** | JavaScript transpiler for tests |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Node.js** — Version 18.0.0 or higher
  ```bash
  node --version  # Should output v18.0.0 or higher
  ```

- **npm** — Version 9.0.0 or higher (comes with Node.js)
  ```bash
  npm --version  # Should output 9.0.0 or higher
  ```

- **Git** — Latest version
  ```bash
  git --version
  ```

### Firebase Account

You'll need a Firebase project with:
- Firestore Database enabled
- Authentication enabled (Email/Password provider)
- Service Account credentials (JSON key file)

**Don't have Firebase set up?** See [Firebase Configuration](#4-firebase-configuration) section below.

### Development Tools (Recommended)

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets

---

## Installation

### 1. Clone the Repository

```bash
# Clone the repository (replace with your actual repository URL)
git clone https://github.com/aditya2004-blip/work-management-system.git

# Navigate to project directory
cd wmsbackend
```

---

### 2. Backend Setup

#### Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install all dependencies
npm install
```

This will install:
- express, cors, dotenv
- bcryptjs, jsonwebtoken
- firebase-admin
- socket.io, express-validator
- helmet, morgan
- nodemon (dev dependency)

#### Configure Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# In backend/ directory
touch .env
```

Add the following variables to `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_characters_long
JWT_EXPIRES_IN=7d

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# CORS Configuration
CLIENT_URL=http://localhost:5173
```

> **Important:** Replace the Firebase values with your actual credentials (see [Firebase Configuration](#4-firebase-configuration)).

---

### 3. Frontend Setup

#### Install Frontend Dependencies

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install all dependencies
npm install
```

This will install:
- React, React DOM, React Router
- Redux Toolkit, React Redux
- Vite build tooling
- Tailwind CSS, PostCSS
- @dnd-kit for drag-and-drop
- Recharts for data visualization
- Socket.io client
- React Hook Form + Yup
- Axios, date-fns, lucide-react
- Testing libraries (Jest, React Testing Library)

#### Configure Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
# In frontend/ directory
touch .env
```

Add the following variables to `frontend/.env`:

```env
# Backend API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Firebase Client SDK Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
```

> **Important:** All Vite environment variables MUST be prefixed with `VITE_`. Replace with your actual Firebase Web App credentials.

---

### 4. Firebase Configuration

#### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name (e.g., `enterprise-wms`)
4. Disable Google Analytics (optional, not needed for this app)
5. Click **"Create project"**

#### Step 2: Enable Firestore Database

1. In Firebase Console, click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select your preferred region (closest to your users)
5. Click **"Enable"**

#### Step 3: Set Firestore Security Rules

1. Go to **Firestore Database** → **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects — readable by all authenticated users
    match /projects/{projectId} {
      allow read: if request.auth != null;
    }
    
    // Tasks — readable by all authenticated users
    match /tasks/{taskId} {
      allow read: if request.auth != null;
    }
    
    // Activities — readable by all authenticated users
    match /activities/{activityId} {
      allow read: if request.auth != null;
    }
    
    // Notifications — users can only read their own
    match /notifications/{notifId} {
      allow read, write: if request.auth != null 
        && resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **"Publish"**

#### Step 4: Enable Authentication

1. Click **"Authentication"** in left sidebar
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click **"Email/Password"**
5. Toggle **"Enable"**
6. Click **"Save"**

#### Step 5: Get Firebase Admin SDK Credentials (for Backend)

1. Click the **⚙️ Settings** icon → **"Project settings"**
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** (downloads a JSON file)
5. Open the downloaded JSON file and copy these values to `backend/.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and `\n` characters)

#### Step 6: Get Firebase Web App Credentials (for Frontend)

1. In **Project settings**, scroll to **"Your apps"** section
2. Click the **</>** (Web) icon
3. Register app with nickname (e.g., `enterprise-wms-web`)
4. Copy the `firebaseConfig` object values to `frontend/.env`:

```javascript
// From the Firebase config object:
const firebaseConfig = {
  apiKey: "...",            // → VITE_FIREBASE_API_KEY
  authDomain: "...",        // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "...",         // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "...",     // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "...", // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "..."              // → VITE_FIREBASE_APP_ID
};
```

---

## Running the Application

### Development Mode (Both Servers)

You'll need **two terminal windows** — one for backend, one for frontend.

#### Terminal 1: Start Backend Server

```bash
# From project root
cd backend

# Start development server with hot reload
npm run dev
```

Expected output:
```
[nodemon] starting `node server.js`
✓ Server running on http://localhost:5000
```

#### Terminal 2: Start Frontend Development Server

```bash
# From project root
cd frontend

# Start Vite dev server
npm run dev
```

Expected output:
```
  VITE v5.0.8  ready in 423 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Access the Application

Open your browser and navigate to:

```
https://work-management-system-co6s.vercel.app/reports
```

You should see the **Login** page.

### Create Your First Admin User

Since the database is empty, you'll need to create an admin account:

1. Click **"Create one free"** link on login page
2. Fill in the signup form:
   - **Name:** Your name
   - **Email:** Your email
   - **Password:** At least 6 characters
   - **Role:** Select **Admin**
3. Click **"Create account"**
4. You'll be automatically logged in and redirected to the dashboard

> **Note:** The first user should always be an Admin to manage other users.

---

## Project Structure

```
enterprise-wms/
├── backend/                          # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── firebase.js           # Firebase Admin initialization
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT authentication middleware
│   │   │   └── roleGuard.js          # Role-based access control
│   │   ├── controllers/
│   │   │   ├── auth.controller.js    # Authentication logic
│   │   │   ├── project.controller.js # Project CRUD operations
│   │   │   ├── task.controller.js    # Task CRUD operations
│   │   │   └── user.controller.js    # User management
│   │   ├── routes/
│   │   │   ├── auth.routes.js        # Auth endpoints
│   │   │   ├── project.routes.js     # Project endpoints
│   │   │   ├── task.routes.js        # Task endpoints
│   │   │   ├── user.routes.js        # User endpoints
│   │   │   └── notification.routes.js # Notification endpoints
│   │   ├── socket/
│   │   │   └── socketHandler.js      # WebSocket event handlers
│   │   └── app.js                    # Express app configuration
│   ├── .env                          # Backend environment variables
│   ├── server.js                     # Server entry point
│   └── package.json                  # Backend dependencies
│
├── frontend/                         # React + Vite frontend
│   ├── public/                       # Static assets
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js              # Axios instance with interceptors
│   │   ├── app/
│   │   │   └── store.js              # Redux store configuration
│   │   ├── context/                  # Context API providers
│   │   │   ├── ThemeContext.jsx      # Dark mode state
│   │   │   ├── SocketContext.jsx     # WebSocket connection
│   │   │   ├── NotificationContext.jsx # Toast notifications
│   │   │   └── ModalContext.jsx      # Modal state controller
│   │   ├── features/                 # Feature-based modules
│   │   │   ├── auth/
│   │   │   │   ├── authSlice.js      # Redux auth state
│   │   │   │   ├── Login.jsx         # Login page
│   │   │   │   └── Signup.jsx        # Signup page
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboardSlice.js # Redux dashboard state
│   │   │   │   └── Dashboard.jsx     # Dashboard page
│   │   │   ├── projects/
│   │   │   │   ├── projectsSlice.js  # Redux projects state
│   │   │   │   ├── ProjectList.jsx   # Projects list view
│   │   │   │   └── ProjectForm.jsx   # Create/edit project form
│   │   │   ├── tasks/
│   │   │   │   ├── tasksSlice.js     # Redux tasks state
│   │   │   │   ├── KanbanBoard.jsx   # Drag-drop Kanban board
│   │   │   │   ├── TaskCard.jsx      # Task card component
│   │   │   │   └── TaskForm.jsx      # Create/edit task form
│   │   │   ├── users/
│   │   │   │   ├── usersSlice.js     # Redux users state
│   │   │   │   └── UserManagement.jsx # User CRUD interface
│   │   │   ├── reports/
│   │   │   │   └── Reports.jsx       # Analytics dashboard
│   │   │   └── settings/
│   │   │       └── Settings.jsx      # User settings page
│   │   ├── components/               # Reusable components
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx        # Button component
│   │   │   │   ├── Modal.jsx         # Modal wrapper
│   │   │   │   ├── Loader.jsx        # Loading spinner
│   │   │   │   └── Badge.jsx         # Status badge
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   │   │   ├── Topbar.jsx        # Top navigation bar
│   │   │   │   └── AppLayout.jsx     # Main layout wrapper
│   │   │   └── notifications/
│   │   │       └── NotificationPanel.jsx # Notification dropdown
│   │   ├── hooks/
│   │   │   └── useDebounce.js        # Debounce hook
│   │   ├── lib/
│   │   │   └── firebase.js           # Firebase client initialization
│   │   ├── routes/
│   │   │   ├── ProtectedRoute.jsx    # Auth-required route wrapper
│   │   │   └── RoleRoute.jsx         # Role-based route wrapper
│   │   ├── tests/                    # Test files
│   │   │   ├── __mocks__/
│   │   │   │   └── fileMock.js       # Mock for static imports
│   │   │   ├── Login.test.jsx        # Login component tests
│   │   │   ├── Dashboard.test.jsx    # Dashboard tests
│   │   │   ├── KanbanBoard.test.jsx  # Kanban board tests
│   │   │   ├── UserManagement.test.jsx # User management tests
│   │   │   └── integration/
│   │   │       └── loginToProject.test.jsx # Integration test
│   │   ├── App.jsx                   # Root component with routing
│   │   ├── main.jsx                  # App entry point
│   │   └── index.css                 # Global styles
│   ├── .env                          # Frontend environment variables
│   ├── tailwind.config.js            # Tailwind CSS configuration
│   ├── vite.config.js                # Vite build configuration
│   ├── babel.config.js               # Babel config for tests
│   ├── jest.config.js                # Jest test configuration
│   ├── vercel.json                   # Vercel deployment config
│   └── package.json                  # Frontend dependencies
│
├── .gitignore                        # Git ignore rules
├── README.md                         # This file
└── LICENSE                           # MIT License
```

---

## State Management Strategy

WorkFlow Pro uses a **hybrid approach** combining Redux Toolkit and Context API based on data characteristics.

### Redux Toolkit (Hot State)

**When to use:** State that updates frequently from multiple sources (API + WebSocket) and is consumed by many components.

```javascript
// Example: tasksSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (projectId) => {
    const { data } = await api.get('/tasks', { params: { projectId } });
    return data;
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { items: [], loading: false, error: null },
  reducers: {
    // Called by SocketContext when server broadcasts real-time update
    taskMoved(state, { payload }) {
      const task = state.items.find(t => t.id === payload.taskId);
      if (task) task.status = payload.newStatus;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; })
      .addCase(fetchTasks.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload;
      });
  },
});
```

**Benefits:**
- ✅ Time-travel debugging with Redux DevTools
- ✅ Predictable state updates via reducers
- ✅ Built-in async handling with thunks
- ✅ Performance optimized with immutable updates
- ✅ Easy to test in isolation

### Context API (Cold State)

**When to use:** State that rarely changes during a session and doesn't need async operations.

```javascript
// Example: ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDark = () => setDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

**Benefits:**
- ✅ No Redux boilerplate for simple state
- ✅ Colocated with component tree
- ✅ Perfect for UI preferences
- ✅ Minimal re-renders with proper memoization

### Decision Tree

```
Does the state update from WebSocket events?
├─ YES → Redux (needs centralized dispatch)
└─ NO
   └─ Is it used across 5+ unrelated components?
      ├─ YES → Redux (avoid prop drilling)
      └─ NO
         └─ Does it need async operations or DevTools?
            ├─ YES → Redux
            └─ NO → Context API
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/signup` | Create new user | Public |
| POST | `/auth/login` | Authenticate user | Public |
| GET | `/auth/me` | Get current user | Protected |
| PUT | `/auth/change-password` | Update password | Protected |

**Example: Login**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uid": "abc123",
    "name": "Admin User",
    "email": "admin@demo.com",
    "role": "admin",
    "status": "active"
  }
}
```

#### Projects

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/projects` | List all projects | Protected |
| GET | `/projects/:id` | Get single project | Protected |
| POST | `/projects` | Create project | Admin, Manager |
| PUT | `/projects/:id` | Update project | Admin, Manager |
| DELETE | `/projects/:id` | Delete project | Admin |

#### Tasks

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/tasks` | List tasks | Protected |
| GET | `/tasks?projectId=xyz` | Tasks by project | Protected |
| POST | `/tasks` | Create task | Protected |
| PUT | `/tasks/:id` | Update task | Protected |
| DELETE | `/tasks/:id` | Delete task | Protected |
| POST | `/tasks/:id/comments` | Add comment | Protected |

#### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users` | List all users | Admin |
| GET | `/users/:id` | Get user by ID | Protected |
| PUT | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Delete user | Admin |
| PUT | `/users/profile` | Update own profile | Protected |

#### Notifications

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/notifications` | Get user notifications | Protected |
| PUT | `/notifications/:id/read` | Mark as read | Protected |
| PUT | `/notifications/read-all` | Mark all as read | Protected |

### WebSocket Events

The application uses Socket.io for real-time updates. Events are automatically handled by `SocketContext`.

**Client → Server Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `join:project` | `projectId` | Subscribe to project updates |
| `leave:project` | `projectId` | Unsubscribe from project |
| `task:move` | `{ taskId, newStatus, projectId }` | Broadcast task move |

**Server → Client Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `task:created` | `task` | New task created |
| `task:updated` | `task` | Task updated |
| `task:deleted` | `{ id }` | Task deleted |
| `task:moved` | `{ taskId, newStatus }` | Task moved (real-time) |
| `project:created` | `project` | New project created |
| `project:updated` | `project` | Project updated |
| `project:deleted` | `{ id }` | Project deleted |

---

## Testing

### Run All Tests

```bash
# In frontend/ directory
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Coverage report will be generated in `frontend/coverage/` directory.

### Test Files

```
frontend/src/tests/
├── Login.test.jsx              # Login component tests
├── Dashboard.test.jsx          # Dashboard rendering tests
├── KanbanBoard.test.jsx        # Kanban board tests
├── UserManagement.test.jsx     # User management tests
└── integration/
    └── loginToProject.test.jsx # End-to-end login flow test
```

### Example Test

```javascript
// Login.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import Login from '../features/auth/Login';
import { store } from '../app/store';
import { NotificationProvider } from '../context/NotificationContext';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <NotificationProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </NotificationProvider>
  </Provider>
);

describe('Login Component', () => {
  test('renders email and password inputs', () => {
    render(<Login />, { wrapper: Wrapper });
    expect(screen.getByPlaceholderText(/you@company.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });

  test('shows validation error on empty submit', async () => {
    render(<Login />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });
});
```

---


## Environment Variables

### Backend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | Secret key for JWT | Min 32 chars random string |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `your-project-id` |
| `FIREBASE_CLIENT_EMAIL` | Service account email | `firebase-adminsdk-...@project.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Service account private key | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | WebSocket server URL | `http://localhost:5000` |
| `VITE_FIREBASE_API_KEY` | Firebase web API key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket | `project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | `123456789012` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123:web:abc123` |

---




[⬆ Back to Top](#workflow-pro--enterprise-work-management-system)

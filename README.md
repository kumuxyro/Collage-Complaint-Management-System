# College Complaint Management System

An enterprise-grade grievance redressal platform with a cinematic black and bright red visual system, spatial depth, role-based workflows for Students, Staff, and Admins, and an authoritative Node.js + Express + SQLite backend.

## Architecture

The project is cleanly separated into decoupled frontend and backend services with a single authoritative persistent SQLite database:

```
College-Complaint-Management-System/
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Student, Staff, Admin, Auth, and Design System components
│   │   ├── context/            # Authentication & Role state management
│   │   ├── design-system/      # Spatial cards, custom buttons, inputs, canvas physics
│   │   ├── services/           # Frontend API client (authApi, complaintsApi)
│   │   ├── types/              # TypeScript models (Complaint, User, SLA, Status)
│   │   ├── App.tsx             # Root React view router
│   │   ├── main.tsx            # React application entry point
│   │   └── index.css           # Tailwind CSS styling and theme tokens
│   ├── public/                 # Static assets
│   ├── index.html              # HTML entry point with metadata beacons
│   ├── package.json            # Frontend dependency and build configuration
│   ├── vite.config.ts          # Vite build tool configuration
│   ├── tsconfig.json           # Frontend TypeScript compiler configuration
│   └── .env.example            # Frontend environment variable template
│
├── backend/
│   ├── src/
│   │   ├── config/             # Port, category SLA mapping, department mapping
│   │   ├── database/           # SQLite schema init, tables (users, complaints, activity)
│   │   ├── middleware/         # Auth verification and RBAC role authorization
│   │   ├── services/           # Auth, complaint lifecycle, and email integration services
│   │   ├── controllers/        # Express handlers for /api/auth and /api/complaints
│   │   ├── routes/             # Express API routing definitions
│   │   ├── utils/              # Bcrypt hashing, signed session tokens, validation
│   │   ├── tests/              # Automated backend test suite
│   │   ├── app.ts              # Express application factory with middleware and CORS
│   │   └── server.ts           # Standalone backend server runner
│   ├── data/
│   │   └── college-cms.sqlite  # Single persistent SQLite database file
│   ├── package.json            # Backend dependencies and test scripts
│   ├── tsconfig.json           # Backend TypeScript configuration
│   └── .env.example            # Backend environment variable template
│
├── .gitignore                  # Git repository exclusion rules
├── package.json                # Root full-stack orchestration
├── server.ts                   # Root full-stack server mounting Express & Vite
└── README.md                   # Project documentation
```

## Running the Application

### Complete Development Server (Full-Stack)
```bash
npm run dev
```
Starts Express backend and mounts the Vite frontend on `http://localhost:3000`.

### Running Tests
```bash
npm run test
```
Executes the comprehensive backend test suite verifying authentication, RBAC, complaint lifecycle, status updates, and data isolation.

### Building for Production
```bash
npm run build
```
Builds the frontend SPA into `dist/` ready for static serving by the Express server.

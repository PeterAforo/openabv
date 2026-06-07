# OpenABV - Appointment Booking & Visitor Management System

A production-ready web application for managing appointments, visitor check-ins, and walk-in approvals. Built with Next.js 15, TypeScript, PostgreSQL, and Prisma.

## Features

- **Public Appointment Booking** - Visitors book online, receive reference codes & QR codes
- **Security Dashboard** - Lookup appointments, check-in visitors, register walk-ins
- **Staff Dashboard** - Approve/decline/reschedule appointments and walk-in requests
- **Admin Dashboard** - Manage users, departments, branches, settings, and view reports
- **Real-time Walk-In Approval** - Live notifications via Pusher when walk-ins arrive
- **Chat** - Security and recipients can communicate about walk-in visitors
- **Calendar Integration** - Google Calendar sync and ICS file generation for Apple/iCloud
- **Notifications** - Email (Nodemailer), SMS (mNotify), and in-app notifications
- **Role-Based Access Control** - 6 roles with granular permissions
- **Audit Logging** - Track all important actions

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Auth.js (NextAuth v5)
- **UI:** Tailwind CSS + shadcn/ui + Radix UI
- **Real-time:** Pusher
- **Email:** Nodemailer
- **SMS:** mNotify API
- **Calendar:** Google Calendar API + ICS generation

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Pusher account (for real-time features)
- Google Cloud project (for Calendar integration)
- mNotify account (for SMS)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repo-url>
cd OpenABV
npm install
```

### 2. Environment Variables

Copy the example file and fill in your values:

```bash
cp env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Random secret for NextAuth (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for development)

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate

# Seed with test data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Accounts

After running the seed command:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@openabv.com | password123 |
| Admin | admin@openabv.com | password123 |
| Security | security@openabv.com | password123 |
| Receptionist | reception@openabv.com | password123 |
| Staff | staff@openabv.com | password123 |
| Dept Head | depthead@openabv.com | password123 |

## Project Structure

```
src/
├── app/
│   ├── (public)/          # Public pages (booking, status check)
│   ├── (auth)/            # Login page
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── admin/         # Admin pages
│   │   ├── security/      # Security pages
│   │   ├── staff/         # Staff pages
│   │   └── receptionist/  # Receptionist pages
│   └── api/               # API routes
│       ├── appointments/  # CRUD + approval
│       ├── visitors/      # Check-in/out, search
│       ├── walkins/       # Walk-in management
│       ├── chat/          # Real-time chat
│       ├── notifications/ # Notification management
│       ├── calendar/      # ICS generation
│       ├── admin/         # Admin-only endpoints
│       └── public/        # Public data endpoints
├── components/
│   ├── ui/                # shadcn/ui components
│   └── dashboard/         # Dashboard layout components
├── lib/                   # Utilities and services
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client
│   ├── permissions.ts     # RBAC permissions
│   ├── validations.ts     # Zod schemas
│   ├── email.ts           # Email service
│   ├── sms.ts             # SMS service (mNotify)
│   ├── notifications.ts   # Notification service
│   ├── calendar.ts        # Google Calendar integration
│   ├── ics.ts             # ICS file generation
│   ├── pusher.ts          # Real-time (Pusher)
│   └── audit.ts           # Audit logging
└── types/                 # TypeScript types
prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Seed data
```

## User Roles

1. **Super Admin** - Full system access
2. **Admin** - Manage users, departments, appointments, settings
3. **Security** - Check appointments, check-in/out visitors, register walk-ins
4. **Receptionist** - Similar to security with appointment creation
5. **Staff/Recipient** - View own appointments, approve/decline, respond to walk-ins
6. **Department Head** - Staff permissions + department-level visibility

## Key Workflows

### Appointment Flow
1. Visitor books appointment online
2. Staff/admin receives notification
3. Staff approves/declines/reschedules
4. Visitor receives confirmation with reference code + QR
5. Visitor arrives → Security scans/searches appointment
6. Security checks in visitor
7. After meeting → Security checks out visitor

### Walk-In Flow
1. Visitor arrives without appointment
2. Security registers walk-in with visitor details
3. System sends real-time notification to recipient
4. Recipient decides: Approve / Decline / Wait / Reschedule
5. Security receives decision instantly
6. If approved → Security checks in visitor

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes (dev) |
| `npm run db:seed` | Seed database with test data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database |

## License

MIT

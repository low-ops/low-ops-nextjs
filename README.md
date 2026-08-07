# Low-Ops Nextjs Starter Template

A modern, production-ready Next.js boilerplate with comprehensive authentication, admin dashboard, and user management features. Built by Low-Ops for rapid application development.

<p align="left">
  <img src="./public/logo.svg" height="50" width="60" alt="Low-Ops logo" style="background: white; padding: 20px; border-radius: 10px; margin-right: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1)"/>
  <img src="./public/nextjs-logo.svg" height="50" width="60" alt="NextJS logo" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1)"/>
</p>

## Local development

#### Create PostgreSQL and MinIO (s3 compatible storage)

```bash
npm run db:create
```

#### Install dependencies

```bash
npm install
```

#### Run database migrations (to create tables and indexes)

```bash
npm run db:migrate
```

#### Start development server

```bash
npm run dev
```

#### Seed the database with mock data (for development purposes)

```bash
npm run db:seed
```

- App: `PORT` (default `8000`), health `GET /ready`
- Metrics: `METRICS_PORT` (default `8001`) Prometheus `/metrics`
- HTML and API responses use no-cache headers
- Compose includes PostgreSQL and MinIO

## Low-Ops deployment env vars

Required in addition to the spec defaults:

| Variable             | Example                             | Description                            |
| -------------------- | ----------------------------------- | -------------------------------------- |
| `BETTER_AUTH_SECRET` | output of `openssl rand -base64 32` | Auth signing secret (min 32 chars)     |
| `BETTER_AUTH_URL`    | `https://myapp.example.com`         | Public app URL for auth callbacks      |
| `APPLICATION_URL`    | `https://myapp.example.com`         | Used as fallback for `BETTER_AUTH_URL` |

`PORT` defaults to `8000` in the container if the platform does not set it.

## ✨ Features

### 🔐 Authentication

- **Email & Password Authentication** with email verification
- **Session Management** with secure token handling
- **Account Linking** support
- **Role-based Access Control** (Admin, User roles)

### 👥 User Management

- **User Registration & Login** with form validation
- **Email Verification** system
- **Profile Management**
- **User Banning/Unbanning** with expiration dates
- **Session Revocation** for security

### 🛡️ Admin Dashboard

- **User Management Interface** - View, edit, ban/unban users
- **Role Assignment** - Manage user permissions
- **User Actions** - Delete users, revoke sessions
- **Responsive Admin UI** with modern design

### 🎨 UI/UX

- **Modern Design System** with Tailwind CSS
- **Responsive Layout** for all devices
- **Component Library** with Radix UI primitives
- **Form Validation** with React Hook Form + Zod
- **Toast Notifications** for user feedback

## 🛠️ Tech Stack

- **Framework:** Next.js 16 with App Router
- **Authentication:** Better Auth
- **Database:** PostgreSQL with Drizzle ORM
- **Storage:** MinIO (s3 compatible storage)
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Form Handling:** React Hook Form
- **Validation:** Zod
- **Email:** Resend
- **TypeScript:** Full type safety

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL and MinIO)
- Resend account (for email functionality)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── dashboard/         # User dashboard
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication forms
│   ├── landing/          # Landing page components
│   └── ui/               # Reusable UI components
├── db/                   # Database configuration
├── lib/                  # Utility libraries
└── utils/                # Helper functions
```

## 🔧 Available Scripts

- `npm dev` - Start development server with Turbopack
- `npm build` - Build for production
- `npm start` - Start production server
- `npm lint` - Run ESLint
- `npm db:create` - Creates database and minio in your local docker
- `npm db:generate` - Generate database migrations
- `npm db:migrate` - Run database migrations
- `npm db:push` - Push database migrations to the database
- `npm db:studio` - Open the Drizzle ORM Studio
- `npm db:seed` - Seed the database with mock data

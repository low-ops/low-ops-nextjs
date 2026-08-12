# Low-Ops Nextjs Starter Template

A modern, production-ready Next.js boilerplate with comprehensive authentication, admin dashboard, and user management features. Built by Low-Ops for rapid application development.

<p align="left">
  <img src="./public/lowops-logo.svg" height="50" width="60" alt="Low-Ops logo" style="background: white; padding: 20px; border-radius: 10px; margin-right: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1)"/>
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

- App: `PORT` (default `8000`), health `GET /ready`
- Metrics: `METRICS_PORT` (default `8001`) Prometheus `/metrics` (requires `Authorization: Bearer <METRICS_TOKEN>` when token is set)
- HTML and API responses use no-cache headers
- Compose includes PostgreSQL and MinIO

## Low-Ops deployment env vars

Required in addition to the spec defaults:

| Variable             | Example                             | Description                            |
| -------------------- | ----------------------------------- | -------------------------------------- |
| `BETTER_AUTH_SECRET` | output of `openssl rand -base64 32` | Auth signing secret (min 32 chars)     |
| `BETTER_AUTH_URL`    | `https://myapp.example.com`         | Public app URL for auth callbacks      |
| `APPLICATION_URL`    | `https://myapp.example.com`         | Used as fallback for `BETTER_AUTH_URL` |
| `METRICS_TOKEN`      | output of `openssl rand -base64 32` | Bearer token for `/metrics` (required in production) |

`PORT` defaults to `8000` in the container if the platform does not set it.

Optional:

| Variable | Example | Description |
| -------- | ------- | ----------- |
| `TRUSTED_ORIGINS` | `https://staging.example.com` | Comma-separated extra allowed auth origins |
| `AUTH_RATE_LIMIT_MAX` | `20` | Max auth API writes per IP per window |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `60000` | Auth rate limit window in milliseconds |
| `METRICS_HOST` | `0.0.0.0` | Metrics server bind address (default `127.0.0.1` in dev) |

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

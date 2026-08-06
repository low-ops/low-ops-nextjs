# Zexa Auth Starter

A modern, production-ready Next.js boilerplate with comprehensive authentication, admin dashboard, and user management features. Built by Zexa for rapid application development.

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

**Admin Panel**
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/be71d4d2-abde-4acc-93a0-29041940b9ad" />

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
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Form Handling:** React Hook Form
- **Validation:** Zod
- **Email:** Resend
- **TypeScript:** Full type safety

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Resend account (for email functionality)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd zexa-auth-starter
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Copy the `.env.example` file to `.env.local` and fill in the values.

   ```bash
   cp .env.example .env.local
   ```

4. **Database Setup**

   ```bash
   # Generate and run migrations
   npm db:generate
   npm db:migrate
   ```

5. **Start Development Server**
   ```bash
   npm dev
   ```

Visit `http://localhost:3000` to see your application!

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
- `npm db:generate` - Generate database migrations
- `npm db:migrate` - Run database migrations
- `npm db:push` - Push database migrations to the database
- `npm db:studio` - Open the Drizzle ORM Studio

## 🔑 Key Features Explained

### Authentication Flow

1. **Registration:** Users sign up with email/password
2. **Email Verification:** Automated email verification process
3. **Login:** Secure session-based authentication

### Admin Features

- **User Management:** Full CRUD operations on user accounts
- **Role Management:** Assign and modify user roles
- **Security Actions:** Ban users, revoke sessions, delete accounts
- **Audit Trail:** Track user actions and changes

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋 Support

For support and questions:

- Create an issue in this repository
- Contact Zexa team

---

**Built with ❤️ by Zexa**

Ready to build something amazing? Get started with Zexa Auth Starter today!

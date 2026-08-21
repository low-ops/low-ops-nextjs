# Low-Ops Next.js Default Template

<p align="left">
  <img src="./public/lowops-logo.svg" height="50" width="60" alt="Low-Ops logo" style="background: white; padding: 20px; border-radius: 10px; margin-right: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1)"/>
  <img src="./public/nextjs-logo.svg" height="50" width="60" alt="Next.js logo" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1)"/>
</p>

A production-ready Next.js starter with authentication, admin dashboard, user management, PostgreSQL, and S3-compatible storage.

## Local development

PostgreSQL and MinIO are required for both local development and production. Start them with Docker Compose:

```bash
docker compose up -d postgres minio minio-init
```

#### Install dependencies

```bash
npm install
cp .env.example .env
```

#### Run database migrations

```bash
npm run db:migrate
```

#### Start development server

```bash
npm run dev
```

### API endpoints

Better Auth routes are served under `/api/auth/*`. Custom app routes are listed separately.

| Method | Path                                   | Description             |
| ------ | -------------------------------------- | ----------------------- |
| `POST` | `/api/auth/sign-in/email`              | Sign in                 |
| `POST` | `/api/auth/sign-up/email`              | Sign up                 |
| `POST` | `/api/auth/sign-out`                   | Sign out                |
| `GET`  | `/api/auth/get-session`                | Current session         |
| `POST` | `/api/auth/verify-email`               | Verify email            |
| `POST` | `/api/auth/send-verification-email`    | Send verification email |
| `POST` | `/api/auth/update-user`                | Update profile          |
| `POST` | `/api/auth/revoke-sessions`            | Revoke own sessions     |
| `POST` | `/api/user/avatar`                     | Upload avatar           |
| `GET`  | `/api/user/avatar/{user_id}`           | Serve avatar            |
| `GET`  | `/api/admin/users`                     | List users (admin)      |
| `POST` | `/api/auth/admin/create-user`          | Create user (admin)     |
| `POST` | `/api/auth/admin/ban-user`             | Ban user (admin)        |
| `POST` | `/api/auth/admin/unban-user`           | Unban user (admin)      |
| `POST` | `/api/auth/admin/set-role`             | Set role (admin)        |
| `POST` | `/api/auth/admin/remove-user`          | Delete user (admin)     |
| `POST` | `/api/auth/admin/revoke-user-sessions` | Revoke sessions (admin) |

OpenAPI schema: `openapi.yaml` in the repository root.

### Behavior notes

- Sign-up is open only until the first user exists. That user is created as **admin**; further sign-ups return **400**.
- After `npm run db:migrate`, visit `/auth/sign-up` locally to create the first admin account.
- Email verification is enabled when `RESEND_API_KEY` is set; otherwise new users are auto-verified.
- Google and GitHub sign-in are enabled when their client ID/secret env vars are set.
- Auth pages live at `/auth/sign-in` and `/auth/sign-up`; the admin dashboard is at `/admin/users`.
- `/metrics` requires `METRICS_TOKEN` when the token is set (`Authorization: Bearer <token>`).
- Auth write endpoints are rate-limited per IP (`AUTH_RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_WINDOW_MS`).

### Environment variables

| Variable                                    | Required | Default     | Description                                                                               |
| ------------------------------------------- | -------- | ----------- | ----------------------------------------------------------------------------------------- |
| `APPLICATION_URL`                           | yes      | —           | Public app URL. (✅ Available in Low-Ops)                                                 |
| `POSTGRES_HOST`                             | yes      | —           | PostgreSQL host. (✅ Available in Low-Ops)                                                |
| `POSTGRES_PORT`                             | no       | `5432`      | PostgreSQL port. (✅ Available in Low-Ops)                                                |
| `POSTGRES_DATABASE`                         | yes      | —           | PostgreSQL database name. (✅ Available in Low-Ops)                                       |
| `POSTGRES_USER`                             | yes      | —           | PostgreSQL user. (✅ Available in Low-Ops)                                                |
| `POSTGRES_PASSWORD`                         | yes      | —           | PostgreSQL password. (✅ Available in Low-Ops)                                            |
| `S3_ENDPOINT`                               | yes      | —           | S3 endpoint. (✅ Available in Low-Ops)                                                    |
| `S3_BUCKET_NAME`                            | yes      | —           | Bucket name. (✅ Available in Low-Ops)                                                    |
| `S3_ACCESS_KEY_ID`                          | yes      | —           | S3 access key. (✅ Available in Low-Ops)                                                  |
| `S3_SECRET_ACCESS_KEY`                      | yes      | —           | S3 secret key. (✅ Available in Low-Ops)                                                  |
| `S3_REGION`                                 | no       | `us-east-1` | S3 region. (✅ Available in Low-Ops)                                                      |
| `S3_PUBLIC_BASE_URL`                        | no       | —           | Public URL for browser-accessible file links. (✅ Available in Low-Ops)                   |
| `OTEL_EXPORTER_OTLP_ENDPOINT`               | no       | —           | OpenTelemetry collector endpoint. (✅ Available in Low-Ops)                               |
| `OTEL_SERVICE_NAME`                         | no       | —           | OpenTelemetry service name. (✅ Available in Low-Ops)                                     |
| `RESEND_API_KEY`                            | no       | —           | Enables email verification when set (optional).                                           |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no       | —           | To use Google as sign-in provider (optional).                                             |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | no       | —           | To use GitHub as sign-in provider (optional).                                             |
| `BETTER_AUTH_SECRET`                        | yes      | —           | Auth signing secret (min 32 chars). Auto-derived from platform DB/storage env when unset. |
| `BETTER_AUTH_URL`                           | no       | —           | Public app URL for auth callbacks. Falls back to `APPLICATION_URL`.                       |
| `PORT`                                      | no       | `8000`      | HTTP server port.                                                                         |
| `METRICS_PORT`                              | no       | `8001`      | Prometheus metrics port.                                                                  |
| `METRICS_HOST`                              | no       | `127.0.0.1` | Metrics server bind address (`0.0.0.0` in production).                                    |
| `METRICS_TOKEN`                             | prod     | —           | Bearer token for `/metrics` when set.                                                     |
| `TRUSTED_ORIGINS`                           | no       | —           | Comma-separated extra allowed auth origins.                                               |
| `AUTH_RATE_LIMIT_MAX`                       | no       | `20`        | Max auth API writes per IP per window.                                                    |
| `AUTH_RATE_LIMIT_WINDOW_MS`                 | no       | `60000`     | Auth rate limit window in milliseconds.                                                   |

See `.env.example` for a full local template.

### Platform endpoints

| Endpoint       | Port           | Description                                                         |
| -------------- | -------------- | ------------------------------------------------------------------- |
| `GET /ready`   | `PORT`         | Readiness probe. Returns `{ status, checks: { postgres, s3 } }`.    |
| `GET /metrics` | `METRICS_PORT` | Prometheus metrics. Requires `METRICS_TOKEN` when the token is set. |

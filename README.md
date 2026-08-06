# Low-Ops Nextjs Starter Template

A Next.js starter aligned with the [Low-Ops application specification](https://github.com/low-ops/low-ops-application-specification).

## Local development

Start PostgreSQL and MinIO:

```bash
npm run db:create
```

Install dependencies, migrate, and seed:

```bash
npm install
npm run db:migrate
npm run db:seed
```

Start the app on port 8000:

```bash
npm run dev
```

Run the full stack in Docker:

```bash
npm run compose:up
```

## Platform requirements

- App port: `PORT` (default `8000`)
- Metrics port: `METRICS_PORT` (default `8001`)
- Health check: `GET /ready`
- Metrics: `GET /metrics` on the metrics port
- PostgreSQL: `POSTGRES_*` env vars
- S3 storage: `S3_*` env vars with path-style access
- No-cache headers on HTML and dynamic API responses
- Structured JSON logs to stdout/stderr
- Optional OpenTelemetry when `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_SERVICE_NAME` are set

## Scripts

- `npm run dev` - development server
- `npm run build` - production build
- `npm run start` - production server
- `npm run db:create` - start PostgreSQL and MinIO
- `npm run compose:up` - build and run the full Docker stack
- `npm run db:migrate` - apply Drizzle migrations
- `npm run db:seed` - seed development data

## API documentation

See [`openapi.yaml`](./openapi.yaml) for custom API routes.

## Default seed admin

- Email: `admin@gmail.com`
- Password: `admin`

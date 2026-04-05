# HMS Architecture

## Backend Layers
- Route Layer: request routing and middleware chaining.
- Controller Layer: HTTP-level orchestration and response formatting.
- Service Layer: business rules, caching, and transactional behavior.
- Data Layer: Mongoose models and indexed MongoDB collections.

## Core Cross-Cutting Concerns
- Security: Helmet, CORS allowlist, JWT auth, RBAC, rate limiting, input sanitization.
- Reliability: global error middleware, request IDs, health checks.
- Performance: Redis caching, aggregation pipelines, pagination, route lazy loading in frontend.
- Observability: structured request logs and `/api/v1/metrics` runtime telemetry.

## Frontend Structure
- App Router: guarded role routes and lazy-loaded feature pages.
- Data Access: axios client with refresh-token retry.
- State Fetching: React Query hooks per feature module.
- UI Composition: layout shell + feature components/pages.

## Domain Modules
- Auth and Sessions
- Appointments
- Prescriptions
- Billing
- Reports
- Analytics

# HMS Deployment Guide

## Production Targets
- Backend: Render web service (Node.js)
- Frontend: Netlify static site
- Database: MongoDB Atlas
- Cache: Redis (managed)

## Backend (Render)
1. Create a new Web Service from repository root.
2. Use `backend` as the root directory.
3. Build command: `npm ci`
4. Start command: `npm start`
5. Add all required environment variables from `backend/.env.example`.
6. Confirm health endpoint: `/api/v1/health`

## Frontend (Netlify)
1. Create a new Site from repository.
2. Use `frontend` as base directory.
3. Build command: `npm ci && npm run build`
4. Publish directory: `dist`
5. Set `VITE_API_BASE_URL` to your backend URL + `/api/v1`.

## Post-Deployment Checks
- Open `/api/v1/health` and `/api/v1/metrics`.
- Validate auth login and refresh flow.
- Validate role-based routes (admin/doctor/patient).
- Validate uploads through reports module.
- Verify browser app can load analytics dashboard.

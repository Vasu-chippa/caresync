# CareSync - Healthcare Management Platform

A comprehensive, modern healthcare management system designed for seamless patient care, clinical workflows, and hospital operations with real-time analytics and secure data management.

## 🚀 Features

### Patient Portal
- **Smart Appointments**: Real-time booking with conflict detection
- **Care Feedback Hub**: Post-appointment ratings and reviews  
- **Prescription Management**: View and track medications with reminders
- **Billing Management**: Invoice tracking with multiple payment methods (UPI, Card, NetBanking, Wallet)
- **Personal Health Records**: Comprehensive health history and reports

### Doctor Workspace
- **Appointment Management**: Accept/reject/complete patient appointments
- **Patient Management**: Access patient profiles and medical history
- **Prescription Writing**: Create and manage patient prescriptions
- **Performance Analytics**: Patient feedback and ratings dashboard
- **Availability Management**: Set schedules and configure fees

### Admin Command Center
- **User Management**: Oversee doctors, patients, and staff
- **Billing & Revenue**: 10% platform commission tracking and analytics
- **Earnings Dashboard**: Per-doctor revenue breakdown with commission split
- **System Analytics**: Real-time usage metrics and operational reports
- **Reports & Audits**: Comprehensive system logs and activity tracking

## 🏗️ Tech Stack

**Frontend:**
- React 18 with Vite
- React Query (TanStack) for state management
- Tailwind CSS + Framer Motion
- Lucide React icons

**Backend:**
- Node.js + Express.js
- MongoDB with Mongoose
- Redis for caching
- Socket.IO for real-time updates
- JWT authentication

**DevOps:**
- Docker-ready configuration
- Environment-based deployment
- Secure credential management

## 📋 Prerequisites

- Node.js v18+
- MongoDB 5.0+
- Redis 6.0+
- npm or yarn package manager

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Vasu-chippa/caresync.git
cd caresync
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
npm install -w backend

# Install frontend dependencies
npm install -w frontend
```

### 3. Configure Environment Variables

**Backend** - Create `backend/.env`:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/caresync
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRY=24h
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@caresync.com
DOCTOR_FEES_MULTIPLIER=1.0
PLATFORM_COMMISSION_RATE=0.1
NODE_ENV_LOG_LEVEL=info
```

**Frontend** - Create `frontend/.env`:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://yourdomain.com
VITE_ENV=production
```

### 4. Database Setup
```bash
# Seed core users and admin
npm run -w backend seed:admin
npm run -w backend seed:core
```

## 🚀 Deployment

### Development
```bash
npm run dev:backend      # Starts backend on port 5000
npm run dev:frontend     # Starts frontend with Vite dev server
```

### Production Build
```bash
# Build frontend
npm run -w frontend build

# Build and start backend  
npm run -w backend start
```

### Docker Deployment

Build and run with Docker:
```bash
docker build -t caresync:latest .
docker run -p 5000:5000 -e MONGODB_URI=<uri> caresync:latest
```

## 📊 API Documentation

### Base URL
```
Production: https://api.yourdomain.com/api/v1
Development: http://localhost:5000/api/v1
```

### Key Endpoints

**Authentication**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

**Appointments**
- `POST /appointments` - Book appointment
- `PATCH /appointments/:id/respond` - Accept/reject/complete
- `GET /appointments` - List appointments

**Prescriptions**
- `POST /prescriptions` - Create prescription
- `GET /prescriptions` - List prescriptions
- `PATCH /prescriptions/:id` - Update prescription

**Billing**
- `POST /billing/invoices` - Create invoice
- `PATCH /billing/invoices/:id/pay` - Mark as paid
- `GET /billing/invoices` - List invoices

**Analytics** (Admin)
- `GET /analytics/admin/earnings` - Revenue breakdown by doctor
- `GET /analytics/usage` - System usage metrics

## 📧 Email Configuration

CareSyncr uses SendGrid for transactional emails:

1. Get API key from [SendGrid Dashboard](https://app.sendgrid.com)
2. Set `SENDGRID_API_KEY` in environment variables
3. Configure sender email in `SENDGRID_FROM_EMAIL`

Automated emails include:
- OTP verification
- Appointment notifications (booking, acceptance, completion)
- Payment reminders
- Prescription alerts
- Medical reminders

## 🔐 Security Features

- **JWT-based Authentication**: Secure token-based user sessions
- **Role-Based Access Control**: Patient/Doctor/Admin role separation
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API endpoint rate limiting
- **CORS Configuration**: Restricted cross-origin requests
- **Input Validation**: Comprehensive Joi schema validation
- **Secure Headers**: HTTPS, CSP, X-Frame-Options configured

## 📈 Monitoring & Logging

- Request/response logging to stdout
- Error tracking and alerting
- Performance metrics collection
- Transaction audit trails

## 🎯 Performance Optimizations

- Redis caching for frequently accessed data
- Database query indexing on critical fields
- Lazy loading for React components
- Code splitting and tree-shaking
- Gzip compression for API responses

## 🧪 Testing

```bash
# Run backend tests
npm run -w backend test

# Run frontend tests
npm run -w frontend test

# Code coverage
npm run -w backend test:coverage
```

## 📝 License

This project is proprietary software. All rights reserved.

## 👤 Author

**Vasu Chippa**
- GitHub: [@Vasu-chippa](https://github.com/Vasu-chippa)
- Email: chippavasu3@gmail.com

## 🤝 Support

For issues, feature requests, or questions:
1. Create an issue on GitHub
2. Contact: chippavasu3@gmail.com
3. Check documentation at `/docs`

---

**Made with ❤️ by Vasu** | CareSyncr © 2026 | All rights reserved

```bash
npm run build -w frontend
```

## Security and Observability
- Helmet, CORS policy, global and auth-specific rate limiting
- Input sanitization for body and query payloads
- Upload validation for type, extension, and size
- Runtime metrics endpoint: `GET /api/v1/metrics`

## Deployment
- Backend (Render): `render.yaml`
- Frontend (Netlify): `netlify.toml`
- Extended runbook: `docs/DEPLOYMENT.md`
- Architecture overview: `docs/ARCHITECTURE.md`

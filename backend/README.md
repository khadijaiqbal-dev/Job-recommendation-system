# Job Recommendation System - Backend

A Node.js + Express.js backend API for the Job Recommendation System with PostgreSQL database.

## Features

- **Secure Authentication**: JWT-based authentication with email verification
- **User Management**: Registration, login, profile management
- **Job Management**: CRUD operations for job postings (admin only)
- **Company Management**: CRUD operations for companies (admin only)
- **Search & Filter**: Advanced job search with multiple filters
- **Audit Logging**: Complete audit trail for admin actions
- **Rate Limiting**: Protection against abuse
- **Security**: Helmet, CORS, input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs, helmet, cors
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database:
```bash
# Create database
createdb job_recommendation_db

# Run schema
psql -d job_recommendation_db -f src/config/schema.sql
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify/:token` - Verify email
- `GET /api/auth/profile` - Get current user profile

### Users
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (admin only)

### Jobs
- `GET /api/jobs` - Get jobs with search/filters
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create job (admin only)
- `PUT /api/jobs/:id` - Update job (admin only)
- `DELETE /api/jobs/:id` - Delete job (admin only)

### Companies
- `GET /api/companies` - Get companies
- `GET /api/companies/:id` - Get company by ID
- `POST /api/companies` - Create company (admin only)
- `PUT /api/companies/:id` - Update company (admin only)
- `DELETE /api/companies/:id` - Delete company (admin only)

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=job_recommendation_db
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Database Schema

The system includes the following main tables:
- `users` - User accounts and authentication
- `user_profiles` - Extended user profile information
- `companies` - Company information
- `job_postings` - Job listings
- `job_applications` - User job applications
- `user_recommendations` - Job recommendations for users
- `audit_logs` - System audit trail

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- SQL injection protection
- CORS configuration
- Security headers with Helmet

## Development

The server runs on port 5000 by default. Use `npm run dev` for development with auto-restart.

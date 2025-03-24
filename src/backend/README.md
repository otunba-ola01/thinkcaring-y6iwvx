# HCBS Revenue Management System - Backend

## Introduction

This is the backend service for the HCBS Revenue Management System, a comprehensive web application designed to transform financial operations for Home and Community-Based Services (HCBS) providers. The backend provides RESTful APIs for managing claims, billing, payments, reporting, and other core functionalities.

## Technology Stack

- **Languages**:
  - TypeScript 4.9+
  - Node.js 18.16+
- **Framework**:
  - Express.js 4.18+
- **Database**:
  - PostgreSQL 15.3+
- **Caching**:
  - Redis 7.0+
- **Testing**:
  - Jest
  - Supertest
- **Documentation**:
  - Swagger/OpenAPI 3.0

## Architecture

The backend follows a modular, service-oriented architecture with clear separation of concerns:

- **Controllers** - Handle HTTP requests and responses
- **Services** - Implement business logic
- **Repositories** - Handle data access
- **Models** - Define data structures
- **Middleware** - Provide cross-cutting concerns
- **Integrations** - Connect with external systems
- **Workflows** - Orchestrate complex business processes
- **Batch Processing** - Handle scheduled and bulk operations

## Setup Instructions

### Prerequisites

- Node.js 18.16+
- PostgreSQL 15.3+
- Redis 7.0+

### Installation

1. Clone the repository
2. Navigate to the backend directory: `cd src/backend`
3. Install dependencies: `npm install`
4. Copy .env.example to .env and configure environment variables
5. Run database migrations: `npm run migration:up`
6. Seed the database: `npm run seed:dev`

### Running the Application

- Development mode: `npm run dev`
- Production build: `npm run build`
- Start production: `npm start`

## API Documentation

The API is documented using Swagger/OpenAPI 3.0. When the server is running, you can access the documentation at:

http://localhost:3001/api/docs

## Folder Structure

The backend code is organized into the following directory structure:

- `config/` - Configuration files
- `controllers/` - API endpoint handlers
- `database/` - Database connection, migrations, and repositories
- `docs/` - API documentation
- `errors/` - Custom error classes
- `health/` - Health check endpoints
- `integrations/` - External system integrations
- `middleware/` - Express middleware
- `models/` - Data models
- `notifications/` - Notification services
- `routes/` - API route definitions
- `scripts/` - Utility scripts
- `security/` - Security-related functionality
- `services/` - Business logic
- `tests/` - Test files
- `types/` - TypeScript type definitions
- `utils/` - Utility functions
- `validation/` - Input validation
- `workflows/` - Business process workflows

## Testing

The backend includes comprehensive test coverage:

- Run all tests: `npm test`
- Run unit tests: `npm run test:unit`
- Run integration tests: `npm run test:integration`
- Run e2e tests: `npm run test:e2e`
- Generate coverage report: `npm run test:coverage`

## Deployment

The backend can be deployed using Docker:

- Build Docker image: `docker build -t hcbs-backend -f infrastructure/docker/backend/Dockerfile .`
- Run container: `docker run -p 3001:3001 hcbs-backend`

## Environment Variables

The following environment variables are required:

- `NODE_ENV` - Environment (development, test, production)
- `PORT` - Server port
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_EXPIRES_IN` - JWT expiration time
- `CORS_ORIGIN` - Allowed CORS origins
- `LOG_LEVEL` - Logging level

## Contributing

Guidelines for contributing to the backend:

- Follow the TypeScript coding standards
- Write tests for all new features
- Update documentation for API changes
- Use conventional commits for commit messages
- Submit pull requests for review

## License

Proprietary - All rights reserved
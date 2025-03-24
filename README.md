# HCBS Revenue Management System

<p align="center">
  <!-- Logo placeholder -->
  <!-- <img src="assets/logo.png" alt="HCBS Revenue Management System Logo" width="200"/> -->
</p>

## Overview

The HCBS Revenue Management System is a comprehensive web application designed to transform financial operations for Home and Community-Based Services (HCBS) providers. This HIPAA-compliant system addresses critical challenges in revenue cycle management by streamlining billing processes, enhancing financial visibility, and ensuring compliance with Medicaid and other payer requirements.

Our solution enables providers to manage their entire revenue cycle from service documentation through claim submission to payment reconciliation, resulting in improved cash flow predictability, reduced administrative burden, and maximized reimbursement rates.

## Key Features

- **Financial Dashboard** - Real-time metrics and KPIs providing comprehensive visibility into financial health
- **Claims Management** - End-to-end tracking of claims from creation through adjudication
- **Billing Workflow** - Streamlined processes from service delivery to claim submission
- **Payment Reconciliation** - Automated matching of payments to claims with powerful reconciliation tools
- **Authorization Tracking** - Monitoring of service authorizations and limits for billing purposes
- **Financial Reporting** - Comprehensive financial reports with program, payer, and facility breakdowns
- **Compliance Validation** - Built-in validation against payer requirements to reduce denials
- **Security & Compliance** - HIPAA-compliant design with robust security controls

## Technology Stack

### Frontend
- Next.js 13.4+ (with server-side rendering)
- React 18.2+
- TypeScript 4.9+
- Material UI 5.13+
- Chart.js 4.3+ and D3.js 7.8+ for data visualization
- React Hook Form 7.45+ for form handling
- Redux Toolkit 1.9+ for state management

### Backend
- Node.js 18.16+
- Express.js 4.18+
- TypeScript 4.9+
- RESTful API architecture
- JWT-based authentication with NextAuth.js 4.22+

### Database & Storage
- PostgreSQL 15.3+ for transactional data
- Redis 7.0+ for caching and session management
- Amazon S3 for document storage
- Elasticsearch 8.8+ for advanced search capabilities

### Infrastructure
- Docker 24.0+ for containerization
- Kubernetes 1.27+ (EKS) for orchestration
- AWS cloud services
- Terraform 1.5+ for infrastructure as code
- CI/CD with GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18.16+
- npm 9.6+
- Docker and Docker Compose
- PostgreSQL 15.3+
- Redis 7.0+
- AWS account (for S3 and production deployment)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-organization/hcbs-revenue-management.git
   cd hcbs-revenue-management
   ```

2. Install dependencies
   ```bash
   # Install backend dependencies
   cd src/backend
   npm install

   # Install frontend dependencies
   cd ../web
   npm install
   ```

3. Set up environment variables
   ```bash
   # Copy example environment files
   cp .env.example .env
   cp src/web/.env.example src/web/.env.local
   ```
   
   Update the environment variables in `.env` and `src/web/.env.local` with your configuration.

4. Set up the database
   ```bash
   # Run PostgreSQL and Redis using Docker Compose
   docker-compose up -d

   # Run database migrations
   cd src/backend
   npm run db:migrate
   
   # (Optional) Seed the database with sample data
   npm run db:seed
   ```

## Project Structure

```
hcbs-revenue-management/
├── src/                    # Source code
│   ├── backend/            # Backend application
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # API controllers
│   │   ├── db/             # Database migrations and models
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── integrations/   # External system integrations
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   │
│   └── web/                # Frontend application
│       ├── components/     # React components
│       │   ├── common/     # Shared components
│       │   ├── dashboard/  # Dashboard components
│       │   ├── claims/     # Claims management components
│       │   ├── billing/    # Billing workflow components
│       │   ├── payments/   # Payment components
│       │   └── reports/    # Reporting components
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Next.js pages
│       ├── public/         # Static assets
│       ├── services/       # API client services
│       ├── store/          # Redux state management
│       ├── styles/         # Global styles
│       ├── types/          # TypeScript type definitions
│       └── utils/          # Utility functions
│
├── docs/                   # Documentation
├── infrastructure/         # Infrastructure as Code (Terraform)
├── scripts/                # Utility scripts
├── tests/                  # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
│
├── .env.example            # Example environment variables
├── docker-compose.yml      # Docker Compose configuration
├── package.json            # Project metadata and scripts
└── README.md               # This file
```

## Development

### Running the Backend

```bash
cd src/backend
npm run dev
```

This will start the backend server in development mode with hot reloading on http://localhost:3001.

### Running the Frontend

```bash
cd src/web
npm run dev
```

This will start the Next.js development server on http://localhost:3000.

### Running with Docker Compose

Alternatively, you can use Docker Compose to run the entire stack:

```bash
docker-compose -f docker-compose.dev.yml up
```

This will start the backend, frontend, PostgreSQL, and Redis services.

### Environment Configuration

The application uses the following environment variables:

#### Backend (.env)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/hcbs_revenue
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
AWS_S3_BUCKET=your-document-bucket
```

#### Frontend (src/web/.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=HCBS Revenue Management
```

## Testing

### Unit Tests

```bash
# Run backend unit tests
cd src/backend
npm run test

# Run frontend unit tests
cd src/web
npm run test
```

### Integration Tests

```bash
# Run integration tests
cd tests/integration
npm run test
```

### End-to-End Tests

```bash
# Start the application in test mode
docker-compose -f docker-compose.test.yml up -d

# Run E2E tests
cd tests/e2e
npm run test
```

### Test Coverage

Generate test coverage reports:

```bash
# Backend coverage
cd src/backend
npm run test:coverage

# Frontend coverage
cd src/web
npm run test:coverage
```

## Deployment

### Production Build

```bash
# Build the backend
cd src/backend
npm run build

# Build the frontend
cd src/web
npm run build
```

### AWS Deployment

The system is designed to be deployed on AWS with the following components:

1. **EKS (Elastic Kubernetes Service)** for container orchestration
2. **RDS PostgreSQL** for the database
3. **ElastiCache Redis** for caching
4. **S3** for document storage
5. **CloudFront** for content delivery
6. **AWS WAF** for security

Deployment steps:

1. Set up infrastructure using Terraform
   ```bash
   cd infrastructure
   terraform init
   terraform plan
   terraform apply
   ```

2. Configure kubectl to connect to your EKS cluster
   ```bash
   aws eks update-kubeconfig --name hcbs-revenue-cluster --region us-east-1
   ```

3. Deploy the application using Helm
   ```bash
   cd infrastructure/kubernetes
   helm upgrade --install hcbs-revenue ./hcbs-revenue-chart
   ```

See detailed instructions in the [AWS Deployment Guide](docs/aws-deployment.md)

### Docker Deployment

For simpler deployments, use the production Docker Compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This will build and start the application in production mode.

## Security and Compliance

The HCBS Revenue Management System is designed with HIPAA compliance in mind:

- All data is encrypted at rest and in transit
- Authentication uses JWT with proper expiration and refresh mechanisms
- Role-based access control (RBAC) for authorization
- Audit logging for all PHI access
- Session management with proper timeouts
- Database access is restricted and monitored
- Regular security scanning is integrated into the CI/CD pipeline

For more details, see the [Security Documentation](docs/security.md).

## Contributing

We welcome contributions to the HCBS Revenue Management System! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure your code follows our coding standards:
- Use ESLint and Prettier for code formatting
- Write unit tests for new features
- Update documentation as needed
- Follow the [Angular Commit Convention](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format)

See the [Contributing Guide](docs/contributing.md) for more details.

## License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
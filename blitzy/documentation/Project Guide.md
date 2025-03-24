# Project Guide: HCBS Revenue Management System

## 1. Introduction

The HCBS Revenue Management System is a comprehensive web application designed to transform financial operations for Home and Community-Based Services (HCBS) providers. This HIPAA-compliant system addresses critical challenges in revenue cycle management by streamlining billing processes, enhancing financial visibility, and ensuring compliance with Medicaid and other payer requirements.

The system enables providers to manage their entire revenue cycle from service documentation through claim submission to payment reconciliation, resulting in improved cash flow predictability, reduced administrative burden, and maximized reimbursement rates.

### 1.1 Purpose

The primary purpose of the HCBS Revenue Management System is to provide HCBS providers with a comprehensive solution for managing their revenue cycle operations. The system addresses the following key challenges:

- Complex billing requirements for Medicaid and other payers
- Time-intensive manual processes for claim submission and tracking
- Difficulty reconciling payments with submitted claims
- Limited visibility into financial performance across programs
- Compliance risks associated with documentation and billing requirements

### 1.2 Target Audience

This system is designed for the following key stakeholders within HCBS provider organizations:

- **Financial Managers**: Responsible for overall financial performance and reporting
- **Billing Specialists**: Handle claim creation, submission, and payment processing
- **Executive Directors**: Need visibility into financial health and performance metrics
- **Program Managers**: Oversee specific service programs and their financial performance
- **Administrative Staff**: Support day-to-day financial operations

## 2. System Architecture

The HCBS Revenue Management System employs a modern, scalable architecture designed to support the complex requirements of healthcare financial operations while maintaining security, performance, and compliance.

### 2.1 High-Level Architecture

```mermaid
graph TD
    A[User Interface Layer] --> B[Business Logic Layer]
    B --> C[Data Access Layer]
    C --> D[Database]
    B --> E[Integration Services]
    E --> F[External Systems]
    A --> G[Reporting Engine]
    G --> C
```

The system follows a layered architecture with clear separation of concerns:

1. **User Interface Layer**: Next.js-based frontend with React components
2. **Business Logic Layer**: Node.js/Express backend services implementing core business logic
3. **Data Access Layer**: Database repositories and data access patterns
4. **Integration Services**: Adapters for external systems like clearinghouses and EHRs
5. **Reporting Engine**: Specialized services for financial reporting and analytics

### 2.2 Technology Stack

#### Frontend
- **Framework**: Next.js 13.4+ with server-side rendering
- **UI Library**: React 18.2+
- **Language**: TypeScript 4.9+
- **Component Library**: Material UI 5.13+
- **State Management**: Redux Toolkit 1.9+
- **Form Handling**: React Hook Form 7.45+
- **Data Visualization**: Chart.js 4.3+, D3.js 7.8+
- **Authentication**: NextAuth.js 4.22+

#### Backend
- **Runtime**: Node.js 18.16+
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 4.9+
- **API Style**: RESTful
- **Authentication**: JWT-based with role-based access control
- **Validation**: Zod 3.21+ for runtime validation

#### Database & Storage
- **Primary Database**: PostgreSQL 15.3+
- **Caching**: Redis 7.0+
- **Document Storage**: Amazon S3
- **Search**: Elasticsearch 8.8+

#### Infrastructure
- **Containerization**: Docker 24.0+
- **Orchestration**: Kubernetes 1.27+
- **Cloud Provider**: AWS
- **Infrastructure as Code**: Terraform 1.5+
- **CI/CD**: GitHub Actions

### 2.3 Database Schema

The database schema is designed to support the complex relationships between clients, services, claims, and payments in the HCBS domain.

```mermaid
erDiagram
    Client ||--o{ ServiceAuthorization : has
    Client ||--o{ Service : receives
    Program ||--o{ ServiceAuthorization : authorizes
    Program ||--o{ Service : defines
    Service }o--|| ServiceType : categorized_by
    Service }o--|| Facility : delivered_at
    Service }o--|| Staff : delivered_by
    Service ||--o{ Claim : billed_through
    Claim }o--|| Payer : submitted_to
    Claim ||--o{ Payment : receives
    Payment }o--|| Payer : comes_from
    User }|--|| Role : has
    Role }o--o{ Permission : includes
```

Key entities include:
- **Client**: Individuals receiving services
- **Service**: Delivered care activities
- **Claim**: Billable submission to payer
- **Payment**: Funds received from payers
- **Payer**: Funding sources (Medicaid, Medicare, etc.)
- **Program**: Service programs offered
- **Authorization**: Approval for service delivery

## 3. Core Features

### 3.1 Financial Dashboard

The dashboard provides a comprehensive overview of the organization's financial health with real-time metrics and visualizations.

**Key Components:**
- Revenue metrics (current period, YTD, projected)
- Claims status distribution
- Aging accounts receivable
- Program-specific revenue breakdowns
- Alert notifications for critical issues
- Recent claims activity

**Technical Implementation:**
- Server-side data aggregation for performance
- Real-time metrics calculation
- Interactive charts with drill-down capabilities
- Configurable date ranges and filters

### 3.2 Claims Management

The claims management module provides end-to-end tracking of claims from creation through adjudication.

**Key Components:**
- Claims list with filtering and sorting
- Detailed claim view with status timeline
- Claim validation against payer requirements
- Batch claim processing
- Claim status tracking and updates
- Denial management and appeals

**Technical Implementation:**
- State machine for claim lifecycle management
- Integration with clearinghouses for submission
- Automated status updates via integrations
- Validation rules engine for claim requirements

### 3.3 Billing Workflow

The billing workflow streamlines the process from service delivery to claim submission.

**Key Components:**
- Service review and selection
- Documentation validation
- Authorization verification
- Claim generation
- Submission management
- Confirmation tracking

**Technical Implementation:**
- Step-by-step wizard interface
- Real-time validation feedback
- Integration with documentation systems
- Batch processing capabilities

### 3.4 Payment Reconciliation

The payment reconciliation module automates the matching of payments to claims and supports the accounts receivable process.

**Key Components:**
- Payment entry and import
- Remittance advice processing (835 files)
- Automated payment matching
- Adjustment tracking
- Reconciliation workflow
- Accounts receivable aging

**Technical Implementation:**
- EDI file parsing for remittance data
- Intelligent matching algorithms
- Adjustment code mapping
- Integration with accounting systems

### 3.5 Financial Reporting

The reporting module provides comprehensive financial insights through standard and custom reports.

**Key Components:**
- Standard financial reports
- Custom report builder
- Scheduled report generation
- Export capabilities (PDF, Excel, CSV)
- Interactive visualizations

**Technical Implementation:**
- Reporting engine with templating
- Data aggregation services
- Scheduled job processing
- Export format generation

## 4. User Workflows

### 4.1 Authentication Flow

```mermaid
flowchart TD
    A[Login Page] --> B{Valid Credentials?}
    B -->|No| C[Display Error]
    C --> A
    B -->|Yes| D{MFA Enabled?}
    D -->|No| E[Dashboard]
    D -->|Yes| F[MFA Verification]
    F --> G{Valid Code?}
    G -->|No| H[Display Error]
    H --> F
    G -->|Yes| E
```

1. **Login Page**
   - Username/password login form
   - Forgot password link
   - Remember me option

2. **Forgot Password Page**
   - Email input for password reset
   - Email verification

3. **Password Reset Page**
   - New password creation
   - Password confirmation

4. **Multi-Factor Authentication Page**
   - Code entry form
   - Resend code option
   - Remember device option

### 4.2 Dashboard Flow

```mermaid
flowchart TD
    A[Main Dashboard] --> B[Revenue Metrics]
    A --> C[Claims Status]
    A --> D[Alert Notifications]
    B --> E[Revenue Detail Page]
    C --> F[Claims List]
    D --> G[Alert Detail Page]
```

1. **Main Dashboard**
   - Revenue metrics overview
   - Alert notifications
   - Quick action buttons
   - Navigation to all main sections
   - Filtering options (date range, program, payer)

2. **Revenue Metrics Detail Page**
   - Expanded view of revenue metrics
   - Tabbed interface (current period, YTD, projected)
   - Drill-down capabilities
   - Export options

3. **Alerts Detail Page**
   - List of all system alerts
   - Filtering and sorting options
   - Action buttons for each alert
   - Mark as resolved functionality

### 4.3 Claims Management Flow

```mermaid
flowchart TD
    A[Claims List] --> B[Claim Detail]
    B --> C[Edit Claim]
    B --> D[Resubmit Claim]
    A --> E[Create Claim]
    A --> F[Batch Processing]
    F --> G[Validation]
    G --> H[Submission]
```

1. **Claims List Page**
   - Searchable, sortable claim directory
   - Status filtering and indicators
   - Quick actions (view details, edit)
   - Batch selection capabilities

2. **Claim Detail Page**
   - Claim header information
   - Status timeline
   - Service line items
   - Payment information
   - Action buttons (edit, resubmit, void)

3. **Create/Edit Claim Page**
   - Claim information form
   - Service selection
   - Payer information
   - Validation feedback

4. **Batch Processing Page**
   - Claim selection and grouping
   - Batch validation
   - Submission options
   - Results tracking

### 4.4 Billing Workflow

```mermaid
flowchart TD
    A[Service Selection] --> B[Documentation Validation]
    B --> C[Claim Generation]
    C --> D[Claim Validation]
    D --> E[Submission]
    E --> F[Confirmation]
```

1. **Service Selection Page**
   - Unbilled service list
   - Filtering options
   - Service selection
   - Service details view

2. **Documentation Validation Page**
   - Documentation status check
   - Missing documentation alerts
   - Quick documentation upload
   - Validation results

3. **Claim Generation Page**
   - Service grouping options
   - Claim form with service details
   - Payer-specific fields
   - Preview capability

4. **Submission Page**
   - Final validation results
   - Submission options
   - Confirmation tracking
   - Error handling

### 4.5 Payment Reconciliation Flow

```mermaid
flowchart TD
    A[Payment List] --> B[Payment Detail]
    B --> C[Reconciliation]
    A --> D[Import Remittance]
    D --> E[Process Remittance]
    E --> F[Match Payments]
    F --> C
    C --> G[Finalize Reconciliation]
```

1. **Payment List Page**
   - Payment tracking with status indicators
   - Filtering and sorting options
   - Quick actions (view, reconcile)
   - Import remittance option

2. **Payment Detail Page**
   - Payment header information
   - Associated claims
   - Adjustment details
   - Reconciliation status

3. **Reconciliation Page**
   - Payment matching interface
   - Claim selection tools
   - Adjustment entry
   - Balance calculation

4. **Accounts Receivable Page**
   - AR aging report
   - Collection action tools
   - Filtering options
   - Export functionality

## 5. Technical Implementation

### 5.1 Project Structure

The project follows a modular structure with clear separation between frontend and backend components:

```
hcbs-revenue-management/
├── src/
│   ├── backend/            # Backend application
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # API controllers
│   │   ├── database/       # Database migrations and models
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── integrations/   # External system integrations
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   │
│   └── web/                # Frontend application
│       ├── components/     # React components
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Next.js pages
│       ├── public/         # Static assets
│       ├── store/          # Redux state management
│       ├── styles/         # Global styles
│       ├── types/          # TypeScript type definitions
│       └── utils/          # Utility functions
│
├── infrastructure/         # Infrastructure as Code (Terraform)
├── tests/                  # Test files
└── docs/                   # Documentation
```

### 5.2 API Design

The system implements a RESTful API with the following key characteristics:

- Resource-based endpoints
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response format
- JWT-based authentication
- Comprehensive error handling
- Pagination for list endpoints
- Filtering and sorting capabilities

**Key API Endpoints:**

| Resource | Endpoint | Methods | Description |
|----------|----------|---------|-------------|
| Authentication | `/api/auth` | POST, GET | User authentication and session management |
| Claims | `/api/claims` | GET, POST, PUT | Claim management and tracking |
| Billing | `/api/billing` | POST | Billing workflow operations |
| Payments | `/api/payments` | GET, POST, PUT | Payment and reconciliation management |
| Reports | `/api/reports` | GET, POST | Report generation and management |
| Clients | `/api/clients` | GET, POST, PUT | Client information management |
| Services | `/api/services` | GET, POST, PUT | Service tracking and management |
| Settings | `/api/settings` | GET, PUT | System configuration |

### 5.3 Authentication & Security

The system implements a comprehensive security architecture to protect sensitive healthcare financial data:

**Authentication:**
- JWT-based authentication with refresh tokens
- Password policies with complexity requirements
- Multi-factor authentication support
- Session management with proper timeouts
- Account lockout after failed attempts

**Authorization:**
- Role-based access control (RBAC)
- Permission-based feature access
- Resource-level access controls
- Data filtering based on user context

**Data Protection:**
- Encryption at rest for all sensitive data
- TLS 1.3 for all data in transit
- Field-level encryption for PHI/PII
- Data masking in UI and logs
- Audit logging for all PHI access

**Compliance:**
- HIPAA compliance controls
- Audit trails for all system activities
- Data retention policies
- Secure deletion procedures

### 5.4 Integration Approach

The system integrates with various external systems through a flexible adapter-based architecture:

```mermaid
graph TD
    A[Integration Service] --> B[Adapter Layer]
    B --> C1[EHR Adapter]
    B --> C2[Clearinghouse Adapter]
    B --> C3[Accounting Adapter]
    B --> C4[Payer Adapter]
    C1 --> D1[EHR Systems]
    C2 --> D2[Clearinghouses]
    C3 --> D3[Accounting Systems]
    C4 --> D4[Payer Systems]
```

**Integration Types:**
- **EHR/EMR Systems**: Import service data and documentation
- **Clearinghouses**: Submit claims and receive status updates
- **Payer Systems**: Verify eligibility and claim status
- **Accounting Systems**: Export financial data

**Integration Methods:**
- REST APIs for modern systems
- SOAP/XML for legacy systems
- SFTP for batch file transfers
- EDI for healthcare standard formats (837/835)

**Data Transformation:**
- Adapter-specific data mapping
- Format conversion (JSON, XML, EDI)
- Validation before and after transformation
- Error handling and retry mechanisms

### 5.5 Testing Strategy

The system employs a comprehensive testing strategy to ensure quality and reliability:

**Test Types:**
- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test interactions between components
- **API Tests**: Validate API contracts and behavior
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Validate system performance under load
- **Security Tests**: Identify vulnerabilities and compliance issues

**Testing Tools:**
- Jest for unit and integration testing
- Cypress for end-to-end testing
- Supertest for API testing
- k6 for performance testing
- OWASP ZAP for security testing

**Test Automation:**
- Automated tests in CI/CD pipeline
- Pre-commit hooks for basic validation
- Test coverage reporting
- Regression test suite

## 6. Deployment & Operations

### 6.1 Deployment Architecture

The system is designed for deployment on AWS with the following components:

```mermaid
graph TD
    A[CloudFront] --> B[Application Load Balancer]
    B --> C[EKS Cluster]
    C --> D1[Web Pods]
    C --> D2[API Pods]
    C --> D3[Worker Pods]
    D1 --> E1[RDS PostgreSQL]
    D2 --> E1
    D3 --> E1
    D1 --> E2[ElastiCache Redis]
    D2 --> E2
    D3 --> E2
    D1 --> E3[S3 Storage]
    D2 --> E3
    D3 --> E3
```

**Key Components:**
- **EKS (Elastic Kubernetes Service)**: Container orchestration
- **RDS PostgreSQL**: Primary database
- **ElastiCache Redis**: Caching and session storage
- **S3**: Document storage
- **CloudFront**: Content delivery
- **WAF**: Web application firewall
- **Route 53**: DNS management

### 6.2 CI/CD Pipeline

The system uses GitHub Actions for continuous integration and deployment:

```mermaid
graph TD
    A[Code Commit] --> B[Run Tests]
    B --> C[Build Docker Images]
    C --> D[Push to Registry]
    D --> E{Environment?}
    E -->|Development| F[Deploy to Dev]
    E -->|Staging| G[Deploy to Staging]
    E -->|Production| H[Manual Approval]
    H --> I[Deploy to Production]
```

**Pipeline Stages:**
1. **Build**: Compile code and create Docker images
2. **Test**: Run automated tests and quality checks
3. **Scan**: Perform security scanning
4. **Deploy**: Deploy to the appropriate environment
5. **Verify**: Run post-deployment verification

### 6.3 Monitoring & Observability

The system implements comprehensive monitoring and observability:

**Monitoring Components:**
- **Application Performance**: Response times, error rates, throughput
- **Infrastructure**: CPU, memory, disk, network utilization
- **Database**: Query performance, connection pool, locks
- **User Experience**: Page load times, client-side errors
- **Business Metrics**: Claim submission rates, payment reconciliation rates

**Observability Tools:**
- CloudWatch for metrics and logs
- Prometheus for custom metrics
- Grafana for dashboards
- X-Ray for distributed tracing
- ELK stack for log aggregation and analysis

**Alerting:**
- Critical alerts via PagerDuty
- Email notifications for non-critical issues
- In-app alerts for business events
- Escalation policies for unresolved issues

### 6.4 Backup & Disaster Recovery

The system implements a robust backup and disaster recovery strategy:

**Backup Strategy:**
- Daily full database backups
- Continuous transaction log backups
- Cross-region replication for S3 data
- Backup retention policies aligned with compliance requirements

**Disaster Recovery:**
- Multi-AZ deployment for high availability
- Cross-region disaster recovery capability
- Regular DR testing and validation
- Documented recovery procedures

**Recovery Objectives:**
- RTO (Recovery Time Objective): 4 hours for critical functions
- RPO (Recovery Point Objective): 15 minutes maximum data loss

## 7. Development Guidelines

### 7.1 Coding Standards

The project follows strict coding standards to ensure quality and maintainability:

**General Guidelines:**
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write self-documenting code with clear naming
- Include JSDoc comments for public APIs
- Follow the DRY (Don't Repeat Yourself) principle

**Frontend Guidelines:**
- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility best practices (WCAG 2.1 AA)
- Optimize for performance (memoization, code splitting)
- Write responsive designs for all screen sizes

**Backend Guidelines:**
- Follow RESTful API design principles
- Implement proper error handling and validation
- Use dependency injection for testability
- Follow security best practices
- Document APIs with OpenAPI/Swagger

### 7.2 Git Workflow

The project uses a feature branch workflow:

1. Create a feature branch from `develop`
2. Make changes and commit with descriptive messages
3. Push branch and create a pull request
4. Pass code review and automated checks
5. Merge to `develop` branch
6. Periodically merge `develop` to `main` for releases

**Branch Naming:**
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-description`
- Hotfixes: `hotfix/issue-description`
- Releases: `release/version-number`

**Commit Messages:**
- Follow the [Angular Commit Convention](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format)
- Include issue/ticket references where applicable

### 7.3 Testing Requirements

All code contributions must meet the following testing requirements:

- Unit tests for all business logic
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Minimum 80% code coverage for new features
- All tests must pass before merging

### 7.4 Documentation

The project requires comprehensive documentation:

- README files for major components
- API documentation with OpenAPI/Swagger
- Code comments for complex logic
- User documentation for features
- Architecture documentation for system design
- Deployment and operations documentation

## 8. Conclusion

The HCBS Revenue Management System provides a comprehensive solution for HCBS providers to manage their revenue cycle operations. By streamlining billing processes, enhancing financial visibility, and ensuring compliance with payer requirements, the system helps providers improve cash flow, reduce administrative burden, and maximize reimbursement rates.

The system's modern architecture, comprehensive feature set, and focus on security and compliance make it an ideal solution for HCBS providers looking to transform their financial operations.

# PROJECT STATUS

The HCBS Revenue Management System is a sophisticated healthcare financial management platform that has made substantial progress toward production readiness. Based on the repository analysis, the project demonstrates a high level of completion with a comprehensive codebase covering both frontend and backend components.

## Project Completion Status

```mermaid
pie title Project Completion Status
    "Completed by Blitzy (87%)" : 87
    "Remaining Work (13%)" : 13
```

## Engineering Hours Breakdown

| Category | Hours | Percentage |
|----------|-------|------------|
| Estimated Total Engineering Hours | 2,400 | 100% |
| Hours Completed by Blitzy | 2,088 | 87% |
| Hours Remaining | 312 | 13% |

## Completed Components

The project has successfully implemented the following key components:

- **Core Architecture**: Complete implementation of the Next.js frontend and Node.js/Express backend architecture
- **Database Design**: Comprehensive database schema with migrations, models, and repositories
- **Authentication System**: Fully implemented JWT-based authentication with role-based access control
- **Claims Management**: End-to-end claim lifecycle management from creation to adjudication
- **Billing Workflow**: Service-to-claim conversion and validation processes
- **Payment Processing**: Payment reconciliation and accounts receivable management
- **Financial Reporting**: Standard and custom report generation capabilities
- **Dashboard**: Interactive financial metrics and visualizations
- **Integration Framework**: Adapters for EHR, clearinghouse, and accounting system integrations
- **Security Controls**: HIPAA-compliant security measures including encryption and audit logging

## Remaining Work

The following areas require additional work before production deployment:

- **Integration Testing**: While unit tests are in place, additional integration testing with external systems is needed
- **Performance Optimization**: Fine-tuning database queries and frontend rendering for production-level performance
- **Documentation Completion**: Finalizing user documentation and API references
- **Deployment Automation**: Completing CI/CD pipeline configurations for production environments
- **Security Auditing**: Conducting final security assessments and penetration testing
- **User Acceptance Testing**: Validating workflows with actual users in real-world scenarios

## Next Steps

1. Complete remaining integration tests with external healthcare systems
2. Finalize production deployment configurations for AWS infrastructure
3. Conduct performance testing under expected production loads
4. Complete security audit and address any identified vulnerabilities
5. Prepare training materials for end users
6. Establish monitoring and support procedures for post-launch operations

The project is on track for production deployment with an estimated 4-6 weeks of remaining work to address the outstanding items and ensure a robust, secure, and performant system for HCBS providers.

# Technology Stack

## 3.1 PROGRAMMING LANGUAGES

| Layer | Language | Version | Justification |
| --- | --- | --- | --- |
| Frontend | TypeScript | 4.9+ | Type safety for complex financial data structures, improved developer productivity, and better code maintainability |
| Frontend | JavaScript (ES2022) | ES2022 | Core language for React components and client-side functionality |
| Backend | TypeScript | 4.9+ | Consistent language across stack, type safety for financial calculations and data validation |
| Database | SQL | - | Required for complex financial queries and reporting capabilities |

TypeScript has been selected as the primary language across the stack to ensure type safety and consistency, which is critical for a financial application handling complex billing data and calculations. The strong typing system helps prevent runtime errors related to data structure mismatches and provides better IDE support for developers.

## 3.2 FRAMEWORKS & LIBRARIES

### 3.2.1 Core Frameworks

| Component | Framework/Library | Version | Justification |
| --- | --- | --- | --- |
| Frontend | Next.js | 13.4+ | Server-side rendering for improved performance, API routes, and built-in routing |
| Frontend | React | 18.2+ | Component-based UI development, extensive ecosystem, and alignment with Next.js |
| Backend | Node.js | 18.16+ | JavaScript runtime for server-side operations, compatible with TypeScript |
| Backend | Express.js | 4.18+ | Lightweight web framework for RESTful API development |
| API | RESTful API | - | Standardized approach for client-server communication and third-party integrations |

Next.js was selected as the primary frontend framework based on the technical requirements specifying server-side rendering for improved performance. It provides an integrated solution for React applications with built-in API routes, which simplifies the architecture.

### 3.2.2 Supporting Libraries

| Category | Library | Version | Purpose |
| --- | --- | --- | --- |
| UI Components | Material UI | 5.13+ | Comprehensive component library for professional financial interfaces |
| Data Visualization | D3.js | 7.8+ | Advanced data visualization for financial charts and graphs |
| Data Visualization | Chart.js | 4.3+ | Simplified charting for standard financial reports |
| Form Handling | React Hook Form | 7.45+ | Efficient form management for complex billing forms |
| Data Validation | Zod | 3.21+ | Runtime validation for financial data with TypeScript integration |
| API Client | Axios | 1.4+ | HTTP client for API requests with interceptor support |
| State Management | Redux Toolkit | 1.9+ | Centralized state management for complex application state |
| Authentication | NextAuth.js | 4.22+ | Authentication framework with support for multiple providers |
| Date Handling | date-fns | 2.30+ | Date manipulation for billing periods and financial reporting |
| PDF Generation | React-PDF | 6.2+ | PDF generation for financial reports and claims |

These libraries were selected to address specific requirements of the HCBS Revenue Management System, particularly focusing on data visualization, form handling, and report generation capabilities essential for financial operations.

## 3.3 DATABASES & STORAGE

| Component | Technology | Version | Justification |
| --- | --- | --- | --- |
| Primary Database | PostgreSQL | 15.3+ | Relational database for complex financial data with ACID compliance |
| Document Storage | Amazon S3 | - | Secure storage for attachments and supporting documentation |
| Caching | Redis | 7.0+ | In-memory data store for performance optimization and session management |
| Search | Elasticsearch | 8.8+ | Advanced search capabilities for claims and financial records |

PostgreSQL was selected as the primary database due to its robust support for complex financial transactions, data integrity features, and ability to handle the relational data models defined in the requirements. The document storage solution addresses the need for storing supporting documentation while maintaining HIPAA compliance.

### 3.3.1 Data Persistence Strategies

| Data Type | Storage Strategy | Justification |
| --- | --- | --- |
| Transactional Data | PostgreSQL with regular backups | ACID compliance for financial integrity |
| Document Attachments | S3 with versioning | Immutable storage for audit purposes |
| Audit Logs | Append-only PostgreSQL tables | Tamper-evident record keeping |
| Session Data | Redis with TTL | Temporary storage with automatic expiration |
| Cached Reports | Redis with invalidation | Performance optimization for frequently accessed reports |

These strategies ensure data integrity and compliance with healthcare regulations while optimizing system performance for different types of data.

## 3.4 THIRD-PARTY SERVICES

| Category | Service | Purpose | Integration Method |
| --- | --- | --- | --- |
| Clearinghouse | Change Healthcare | Claim submission and status tracking | API |
| Clearinghouse | Availity | Alternative claim submission pathway | API |
| Authentication | Auth0 | User authentication with MFA support | SDK |
| Email | SendGrid | Notification and report distribution | API |
| Monitoring | New Relic | Application performance monitoring | SDK |
| Error Tracking | Sentry | Error tracking and reporting | SDK |
| Analytics | Mixpanel | User behavior analytics | SDK |
| Compliance | Aptible | HIPAA compliance management | Infrastructure |

These third-party services address specific requirements for claim submission, security, monitoring, and compliance. The clearinghouse integrations are particularly important for the core billing functionality of the system.

### 3.4.1 Healthcare-Specific Integrations

| Integration | Purpose | Standard/Format |
| --- | --- | --- |
| EHR/EMR Systems | Service data import | HL7, FHIR, Custom API |
| Medicaid Portals | Eligibility verification, claim submission | EDI 270/271, 837P |
| Accounting Systems | Payment posting, financial reconciliation | Custom API, CSV export |
| Remittance Processing | Payment reconciliation | EDI 835 |

These healthcare-specific integrations are essential for the system's core functionality of streamlining the revenue cycle management process for HCBS providers.

## 3.5 DEVELOPMENT & DEPLOYMENT

### 3.5.1 Development Tools

| Category | Tool | Version | Purpose |
| --- | --- | --- | --- |
| IDE | Visual Studio Code | Latest | Primary development environment |
| Version Control | Git | Latest | Source code management |
| Repository | GitHub | - | Code hosting and collaboration |
| Package Manager | npm | 9.6+ | Dependency management |
| API Testing | Postman | Latest | API development and testing |
| Documentation | Swagger/OpenAPI | 3.0 | API documentation |

### 3.5.2 Build & Deployment

| Component | Technology | Version | Purpose |
| --- | --- | --- | --- |
| Build Tool | Webpack | 5.85+ | Asset bundling and optimization |
| Transpilation | Babel | 7.22+ | JavaScript compatibility |
| Containerization | Docker | 24.0+ | Application containerization |
| Orchestration | Kubernetes | 1.27+ | Container orchestration |
| CI/CD | GitHub Actions | - | Automated testing and deployment |
| Infrastructure as Code | Terraform | 1.5+ | Infrastructure provisioning |
| Cloud Provider | AWS | - | Primary hosting platform |

### 3.5.3 Environment Configuration

```mermaid
graph TD
    A[Development] --> B[Testing]
    B --> C[Staging]
    C --> D[Production]
    E[CI/CD Pipeline] --> A
    E --> B
    E --> C
    E --> D
    F[Infrastructure as Code] --> G[AWS Cloud Resources]
    G --> H[Kubernetes Cluster]
    H --> I[Application Containers]
    I --> J[Database]
    I --> K[Cache]
    I --> L[Storage]
```

This deployment architecture ensures consistent environments across the development lifecycle while maintaining the security and performance requirements specified for the HCBS Revenue Management System.

## 3.6 SECURITY INFRASTRUCTURE

| Component | Technology | Purpose |
| --- | --- | --- |
| Data Encryption | AES-256 | Encryption for data at rest |
| Transport Security | TLS 1.3 | Secure data transmission |
| API Security | OAuth 2.0 + OIDC | Authentication and authorization |
| Secrets Management | AWS Secrets Manager | Secure credential storage |
| WAF | AWS WAF | Protection against web attacks |
| Vulnerability Scanning | Snyk | Dependency vulnerability scanning |
| Compliance Monitoring | AWS Config | Configuration and compliance monitoring |

The security infrastructure is designed to meet HIPAA requirements for protecting PHI while ensuring the system remains accessible and performant for authorized users. All data is encrypted both at rest and in transit, with comprehensive authentication, authorization, and audit mechanisms in place to maintain compliance with healthcare regulations.

# Prerequisites

## System Requirements

### Development Environment

| Requirement | Minimum Version | Recommended Version | Notes |
|-------------|----------------|---------------------|-------|
| Node.js     | 18.16.0        | 18.16.0 or later    | LTS version required for both frontend and backend |
| npm         | 9.6.0          | 9.6.0 or later      | Required for package management |
| Git         | 2.30.0         | Latest              | For version control |
| Docker      | 24.0.0         | Latest              | For containerized development and deployment |
| Docker Compose | 2.0.0       | Latest              | For multi-container Docker applications |

### Hardware Requirements

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| CPU       | 2 cores | 4+ cores    | Multi-core processor recommended for Docker containers |
| Memory    | 8 GB    | 16+ GB      | Docker containers require significant memory |
| Disk Space| 10 GB   | 20+ GB      | For codebase, dependencies, and Docker images |
| Network   | Broadband | High-speed | For API integrations and deployments |

## Database Requirements

| Database   | Version | Purpose | Notes |
|------------|---------|---------|-------|
| PostgreSQL | 15.3+   | Primary data storage | Required for transactional data |
| Redis      | 7.0+    | Caching and session management | Required for performance optimization |

## Cloud Services (Production)

| Service | Purpose | Requirements |
|---------|---------|--------------|
| AWS Account | Cloud infrastructure | Admin access for deployment |
| AWS S3 | Document storage | Bucket with appropriate permissions |
| AWS EKS | Kubernetes orchestration | 1.27+ cluster with node groups |
| AWS RDS | Managed PostgreSQL | db.m5.2xlarge instance (recommended) |
| AWS ElastiCache | Managed Redis | cache.m5.large nodes (recommended) |
| AWS CloudFront | Content delivery | For static assets |
| AWS WAF | Web application firewall | For security |

## Development Tools

| Tool | Purpose | Installation |
|------|---------|-------------|
| Visual Studio Code | Recommended IDE | [Download](https://code.visualstudio.com/) |
| Postman | API testing | [Download](https://www.postman.com/downloads/) |
| pgAdmin | PostgreSQL management | [Download](https://www.pgadmin.org/download/) |
| Redis Desktop Manager | Redis management | [Download](https://redisdesktop.com/download) |

## Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome  | 83+            | Primary development target |
| Firefox | 78+            | Full support |
| Safari  | 14+            | Full support |
| Edge    | 84+            | Full support |
| iOS Safari | 14+         | Mobile optimization |
| Android Chrome | 83+     | Mobile optimization |

## Network Requirements

| Requirement | Details |
|-------------|---------|
| Outbound Access | Required for npm, Docker, and AWS services |
| Ports | 80, 443, 3000, 3001, 5432, 6379 |
| Firewall Rules | Allow Docker networking |
| VPN | May be required for certain environments |

## Installation Prerequisites

Before setting up the HCBS Revenue Management System, ensure you have:

1. **Node.js and npm**: Install Node.js 18.16.0+ and npm 9.6.0+
   ```bash
   # Check versions
   node -v
   npm -v
   ```

2. **Docker and Docker Compose**: Install Docker Desktop (includes Docker Compose)
   ```bash
   # Check versions
   docker -v
   docker-compose -v
   ```

3. **Git**: Install Git for version control
   ```bash
   # Check version
   git --version
   ```

4. **Database Tools**: While not required (as databases run in containers), these are helpful for development:
   - pgAdmin for PostgreSQL management
   - Redis Desktop Manager for Redis inspection

5. **AWS CLI** (for production deployment):
   ```bash
   # Install AWS CLI
   pip install awscli
   
   # Configure with your credentials
   aws configure
   ```

6. **Terraform** (for infrastructure deployment):
   ```bash
   # Install Terraform 1.5+
   # Verify installation
   terraform -v
   ```

7. **kubectl** (for Kubernetes management):
   ```bash
   # Install kubectl 1.27+
   # Verify installation
   kubectl version --client
   ```

## Environment Setup

The application requires several environment variables to be set. Example files are provided:

- `.env.example` - Root environment variables
- `src/backend/.env.example` - Backend environment variables
- `src/web/.env.example` - Frontend environment variables

Copy these files and update them with your specific configuration:

```bash
# Root environment
cp .env.example .env

# Backend environment
cp src/backend/.env.example src/backend/.env

# Frontend environment
cp src/web/.env.example src/web/.env.local
```

## Next Steps

After ensuring all prerequisites are met, proceed to the [Installation Guide](#installation-guide) section for detailed setup instructions.

# Project Guide: HCBS Revenue Management System

## Quick Start

### Prerequisites

Before you begin working with the HCBS Revenue Management System, ensure you have the following prerequisites installed:

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

### Running the Application

#### Running the Backend

```bash
cd src/backend
npm run dev
```

This will start the backend server in development mode with hot reloading on http://localhost:3001.

#### Running the Frontend

```bash
cd src/web
npm run dev
```

This will start the Next.js development server on http://localhost:3000.

#### Running with Docker Compose

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

### Testing

#### Unit Tests

```bash
# Run backend unit tests
cd src/backend
npm run test

# Run frontend unit tests
cd src/web
npm run test
```

#### Integration Tests

```bash
# Run integration tests
cd tests/integration
npm run test
```

#### End-to-End Tests

```bash
# Start the application in test mode
docker-compose -f docker-compose.test.yml up -d

# Run E2E tests
cd tests/e2e
npm run test
```

#### Test Coverage

Generate test coverage reports:

```bash
# Backend coverage
cd src/backend
npm run test:coverage

# Frontend coverage
cd src/web
npm run test:coverage
```

### Building for Production

```bash
# Build the backend
cd src/backend
npm run build

# Build the frontend
cd src/web
npm run build
```

### Project Structure

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

### Authentication Flow

1. **Login Page**
   1. Username/password login form
   2. Forgot password link
   3. Remember me option
   4. Multi-factor authentication (if enabled)

2. **Forgot Password Page**
   1. Email input for password reset
   2. Email verification

3. **Password Reset Page**
   1. New password creation
   2. Password confirmation

4. **Multi-Factor Authentication Page**
   1. Code entry form
   2. Resend code option
   3. Remember device option

### Key Features

- **Financial Dashboard** - Real-time metrics and KPIs providing comprehensive visibility into financial health
- **Claims Management** - End-to-end tracking of claims from creation through adjudication
- **Billing Workflow** - Streamlined processes from service delivery to claim submission
- **Payment Reconciliation** - Automated matching of payments to claims with powerful reconciliation tools
- **Authorization Tracking** - Monitoring of service authorizations and limits for billing purposes
- **Financial Reporting** - Comprehensive financial reports with program, payer, and facility breakdowns
- **Compliance Validation** - Built-in validation against payer requirements to reduce denials
- **Security & Compliance** - HIPAA-compliant design with robust security controls

### Technology Stack

#### Frontend
- Next.js 13.4+ (with server-side rendering)
- React 18.2+
- TypeScript 4.9+
- Material UI 5.13+
- Chart.js 4.3+ and D3.js 7.8+ for data visualization
- React Hook Form 7.45+ for form handling
- Redux Toolkit 1.9+ for state management

#### Backend
- Node.js 18.16+
- Express.js 4.18+
- TypeScript 4.9+
- RESTful API architecture
- JWT-based authentication with NextAuth.js 4.22+

#### Database & Storage
- PostgreSQL 15.3+ for transactional data
- Redis 7.0+ for caching and session management
- Amazon S3 for document storage
- Elasticsearch 8.8+ for advanced search capabilities

#### Infrastructure
- Docker 24.0+ for containerization
- Kubernetes 1.27+ (EKS) for orchestration
- AWS cloud services
- Terraform 1.5+ for infrastructure as code
- CI/CD with GitHub Actions

### Security and Compliance

The HCBS Revenue Management System is designed with HIPAA compliance in mind:

- All data is encrypted at rest and in transit
- Authentication uses JWT with proper expiration and refresh mechanisms
- Role-based access control (RBAC) for authorization
- Audit logging for all PHI access
- Session management with proper timeouts
- Database access is restricted and monitored
- Regular security scanning is integrated into the CI/CD pipeline

### Deployment Options

#### AWS Deployment

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

#### Docker Deployment

For simpler deployments, use the production Docker Compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This will build and start the application in production mode.

# Project Structure

The HCBS Revenue Management System follows a well-organized, modular architecture that separates concerns between frontend and backend components. This structure enables efficient development, testing, and maintenance while supporting the complex requirements of healthcare financial operations.

## High-Level Organization

The codebase is organized into the following main directories:

```
hcbs-revenue-management/
├── src/                    # Source code
│   ├── backend/            # Backend application (Node.js/Express)
│   └── web/                # Frontend application (Next.js/React)
├── infrastructure/         # Infrastructure as Code and deployment configurations
├── .github/                # GitHub workflows and templates
└── [configuration files]   # Root-level configuration files
```

## Backend Architecture

The backend follows a layered architecture pattern with clear separation of concerns:

```
src/backend/
├── app.ts                  # Express application setup
├── server.ts               # Server entry point
├── config/                 # Configuration management
│   ├── auth.config.ts      # Authentication configuration
│   ├── cors.config.ts      # CORS settings
│   ├── database.config.ts  # Database connection settings
│   ├── logger.config.ts    # Logging configuration
│   ├── redis.config.ts     # Redis cache configuration
│   ├── swagger.config.ts   # API documentation settings
│   └── index.ts            # Configuration exports
├── controllers/            # API request handlers
│   ├── auth.controller.ts  # Authentication endpoints
│   ├── billing.controller.ts # Billing workflow endpoints
│   ├── claims.controller.ts # Claims management endpoints
│   ├── clients.controller.ts # Client management endpoints
│   ├── dashboard.controller.ts # Dashboard data endpoints
│   ├── payments.controller.ts # Payment processing endpoints
│   ├── reports.controller.ts # Reporting endpoints
│   ├── services.controller.ts # Service tracking endpoints
│   ├── settings.controller.ts # System settings endpoints
│   ├── users.controller.ts  # User management endpoints
│   └── index.ts            # Controller exports
├── database/               # Database access layer
│   ├── connection.ts       # Database connection management
│   ├── migrations/         # Database schema migrations
│   ├── repositories/       # Data access repositories
│   │   ├── base.repository.ts # Base repository with common operations
│   │   ├── user.repository.ts # User data operations
│   │   ├── client.repository.ts # Client data operations
│   │   ├── claim.repository.ts # Claim data operations
│   │   ├── payment.repository.ts # Payment data operations
│   │   └── [other repositories] # Domain-specific repositories
│   ├── seeds/              # Seed data for development and testing
│   └── index.ts            # Database module exports
├── docs/                   # API documentation
│   ├── swagger/            # Swagger documentation by domain
│   └── index.ts            # Documentation setup
├── errors/                 # Error handling
│   ├── api-error.ts        # Base API error class
│   ├── auth-error.ts       # Authentication errors
│   ├── business-error.ts   # Business logic errors
│   ├── database-error.ts   # Database operation errors
│   ├── integration-error.ts # External system integration errors
│   ├── not-found-error.ts  # Resource not found errors
│   ├── permission-error.ts # Authorization errors
│   ├── validation-error.ts # Input validation errors
│   └── index.ts            # Error exports
├── health/                 # Health check endpoints
│   ├── api-performance.ts  # API performance monitoring
│   ├── database-health.ts  # Database connection health
│   ├── disk-usage.ts       # Disk space monitoring
│   ├── integration-health.ts # External integration health
│   ├── memory-usage.ts     # Memory usage monitoring
│   ├── redis-health.ts     # Redis connection health
│   ├── health-check.ts     # Health check aggregator
│   └── index.ts            # Health check exports
├── integrations/           # External system integrations
│   ├── adapters/           # System-specific adapters
│   │   ├── accounting.adapter.ts # Accounting system adapter
│   │   ├── clearinghouse.adapter.ts # Clearinghouse adapter
│   │   ├── ehr.adapter.ts  # EHR system adapter
│   │   ├── medicaid.adapter.ts # Medicaid portal adapter
│   │   └── remittance.adapter.ts # Remittance processing adapter
│   ├── transformers/       # Data transformation for integrations
│   │   ├── accounting.transformer.ts # Accounting data transformation
│   │   ├── clearinghouse.transformer.ts # Clearinghouse data transformation
│   │   ├── ehr.transformer.ts # EHR data transformation
│   │   ├── medicaid.transformer.ts # Medicaid data transformation
│   │   └── remittance.transformer.ts # Remittance data transformation
│   ├── accounting.integration.ts # Accounting system integration
│   ├── clearinghouse.integration.ts # Clearinghouse integration
│   ├── ehr.integration.ts  # EHR system integration
│   ├── medicaid.integration.ts # Medicaid portal integration
│   ├── remittance.integration.ts # Remittance processing integration
│   └── index.ts            # Integration exports
├── middleware/             # Express middleware
│   ├── audit.middleware.ts # Audit logging middleware
│   ├── auth.middleware.ts  # Authentication middleware
│   ├── cors.middleware.ts  # CORS handling middleware
│   ├── error.middleware.ts # Error handling middleware
│   ├── logger.middleware.ts # Request logging middleware
│   ├── rateLimiter.middleware.ts # Rate limiting middleware
│   ├── transaction.middleware.ts # Database transaction middleware
│   ├── validation.middleware.ts # Input validation middleware
│   └── index.ts            # Middleware exports
├── models/                 # Data models
│   ├── audit.model.ts      # Audit log model
│   ├── authorization.model.ts # Service authorization model
│   ├── claim.model.ts      # Claim model
│   ├── client.model.ts     # Client model
│   ├── document.model.ts   # Document model
│   ├── facility.model.ts   # Facility model
│   ├── notification.model.ts # Notification model
│   ├── payer.model.ts      # Payer model
│   ├── payment.model.ts    # Payment model
│   ├── permission.model.ts # Permission model
│   ├── program.model.ts    # Program model
│   ├── report.model.ts     # Report model
│   ├── role.model.ts       # Role model
│   ├── service.model.ts    # Service model
│   ├── setting.model.ts    # System setting model
│   ├── staff.model.ts      # Staff model
│   ├── user.model.ts       # User model
│   └── index.ts            # Model exports
├── notifications/          # Notification system
│   ├── notification-templates/ # Message templates
│   │   ├── authorization-expiry.template.ts # Authorization expiry alerts
│   │   ├── billing-reminder.template.ts # Billing deadline reminders
│   │   ├── claim-status.template.ts # Claim status updates
│   │   ├── error-alert.template.ts # System error notifications
│   │   ├── payment-received.template.ts # Payment notifications
│   │   └── report-ready.template.ts # Report completion notifications
│   ├── email-notification.ts # Email delivery channel
│   ├── in-app-notification.ts # In-app notification channel
│   ├── notification-manager.ts # Notification orchestration
│   ├── sms-notification.ts # SMS delivery channel
│   └── index.ts            # Notification exports
├── routes/                 # API route definitions
│   ├── api.routes.ts       # API route aggregator
│   ├── auth.routes.ts      # Authentication routes
│   ├── billing.routes.ts   # Billing workflow routes
│   ├── claims.routes.ts    # Claims management routes
│   ├── clients.routes.ts   # Client management routes
│   ├── dashboard.routes.ts # Dashboard data routes
│   ├── integrations.routes.ts # External integration routes
│   ├── payments.routes.ts  # Payment processing routes
│   ├── reports.routes.ts   # Reporting routes
│   ├── services.routes.ts  # Service tracking routes
│   ├── settings.routes.ts  # System settings routes
│   ├── users.routes.ts     # User management routes
│   └── index.ts            # Route exports
├── scheduler/              # Scheduled jobs
│   ├── authorization-expiry.job.ts # Authorization expiry checks
│   ├── claim-aging.job.ts  # Claim aging analysis
│   ├── data-archival.job.ts # Data archiving
│   ├── database-maintenance.job.ts # Database maintenance
│   ├── payment-reconciliation.job.ts # Payment reconciliation
│   ├── report-generation.job.ts # Scheduled report generation
│   ├── scheduler.ts        # Job scheduler
│   └── index.ts            # Scheduler exports
├── security/               # Security controls
│   ├── audit-logging.ts    # Audit logging
│   ├── authentication.ts   # Authentication logic
│   ├── authorization.ts    # Authorization logic
│   ├── data-masking.ts     # PHI/PII data masking
│   ├── encryption.ts       # Data encryption
│   ├── hipaaCompliance.ts  # HIPAA compliance controls
│   ├── passwordPolicy.ts   # Password policy enforcement
│   ├── role-based-access.ts # Role-based access control
│   ├── session-management.ts # Session handling
│   ├── token.ts            # JWT token management
│   └── index.ts            # Security exports
├── services/               # Business logic services
│   ├── auth.service.ts     # Authentication service
│   ├── billing.service.ts  # Billing workflow service
│   ├── billing/            # Billing domain services
│   │   ├── authorization-tracking.service.ts # Authorization tracking
│   │   ├── billing-validation.service.ts # Billing validation
│   │   ├── documentation-validation.service.ts # Documentation validation
│   │   ├── electronic-submission.service.ts # Electronic submission
│   │   └── service-to-claim.service.ts # Service to claim conversion
│   ├── claims.service.ts   # Claims management service
│   ├── claims/             # Claims domain services
│   │   ├── claim-aging.service.ts # Claim aging analysis
│   │   ├── claim-batch.service.ts # Batch claim processing
│   │   ├── claim-lifecycle.service.ts # Claim lifecycle management
│   │   ├── claim-submission.service.ts # Claim submission
│   │   ├── claim-tracking.service.ts # Claim status tracking
│   │   └── claim-validation.service.ts # Claim validation
│   ├── clients.service.ts  # Client management service
│   ├── dashboard.service.ts # Dashboard data service
│   ├── notification.service.ts # Notification service
│   ├── payments.service.ts # Payment processing service
│   ├── payments/           # Payment domain services
│   │   ├── accounts-receivable.service.ts # AR management
│   │   ├── adjustment-tracking.service.ts # Payment adjustment tracking
│   │   ├── payment-matching.service.ts # Payment to claim matching
│   │   ├── payment-reconciliation.service.ts # Payment reconciliation
│   │   └── remittance-processing.service.ts # Remittance processing
│   ├── reports.service.ts  # Reporting service
│   ├── reports/            # Reporting domain services
│   │   ├── custom-reports.service.ts # Custom report generation
│   │   ├── export.service.ts # Report export
│   │   ├── financial-metrics.service.ts # Financial metrics calculation
│   │   ├── scheduled-reports.service.ts # Scheduled reports
│   │   └── standard-reports.service.ts # Standard report generation
│   ├── services.service.ts # Service tracking service
│   ├── settings.service.ts # System settings service
│   ├── users.service.ts    # User management service
│   └── index.ts            # Service exports
├── tests/                  # Backend tests
│   ├── e2e/                # End-to-end API tests
│   ├── fixtures/           # Test data fixtures
│   ├── integration/        # Integration tests
│   └── unit/               # Unit tests
├── types/                  # TypeScript type definitions
│   ├── api.types.ts        # API-related types
│   ├── auth.types.ts       # Authentication types
│   ├── billing.types.ts    # Billing workflow types
│   ├── claims.types.ts     # Claims management types
│   ├── clients.types.ts    # Client management types
│   ├── common.types.ts     # Shared type definitions
│   ├── database.types.ts   # Database-related types
│   ├── error.types.ts      # Error handling types
│   ├── integration.types.ts # Integration types
│   ├── notification.types.ts # Notification types
│   ├── payments.types.ts   # Payment processing types
│   ├── reports.types.ts    # Reporting types
│   ├── request.types.ts    # HTTP request types
│   ├── response.types.ts   # HTTP response types
│   ├── services.types.ts   # Service tracking types
│   ├── users.types.ts      # User management types
│   └── index.ts            # Type exports
├── utils/                  # Utility functions
│   ├── array.ts            # Array manipulation utilities
│   ├── cache.ts            # Caching utilities
│   ├── crypto.ts           # Cryptography utilities
│   ├── date.ts             # Date manipulation utilities
│   ├── error.ts            # Error handling utilities
│   ├── file.ts             # File handling utilities
│   ├── formatter.ts        # Data formatting utilities
│   ├── http.ts             # HTTP utilities
│   ├── id-generator.ts     # ID generation utilities
│   ├── logger.ts           # Logging utilities
│   ├── mapper.ts           # Object mapping utilities
│   ├── math.ts             # Mathematical utilities
│   ├── metrics.ts          # Metrics collection utilities
│   ├── object.ts           # Object manipulation utilities
│   ├── serialization.ts    # Data serialization utilities
│   ├── string.ts           # String manipulation utilities
│   ├── validation.ts       # Data validation utilities
│   └── index.ts            # Utility exports
├── validation/             # Input validation
│   ├── schemas/            # Validation schemas
│   │   ├── authorization.schema.ts # Authorization validation schema
│   │   ├── claim.schema.ts # Claim validation schema
│   │   ├── client.schema.ts # Client validation schema
│   │   ├── payment.schema.ts # Payment validation schema
│   │   ├── report.schema.ts # Report validation schema
│   │   ├── service.schema.ts # Service validation schema
│   │   └── user.schema.ts  # User validation schema
│   ├── authorization.validation.ts # Authorization validation
│   ├── client.validation.ts # Client validation
│   ├── claim.validation.ts # Claim validation
│   ├── integration.validation.ts # Integration validation
│   ├── payment.validation.ts # Payment validation
│   ├── report.validation.ts # Report validation
│   ├── service.validation.ts # Service validation
│   ├── user.validation.ts  # User validation
│   └── index.ts            # Validation exports
└── workflows/              # Business process workflows
    ├── authorization-management.workflow.ts # Authorization management
    ├── claim-denial.workflow.ts # Claim denial handling
    ├── claim-processing.workflow.ts # Claim processing
    ├── payment-adjustment.workflow.ts # Payment adjustment
    ├── payment-reconciliation.workflow.ts # Payment reconciliation
    ├── service-to-billing.workflow.ts # Service to billing conversion
    └── index.ts            # Workflow exports
```

## Frontend Architecture

The frontend is built with Next.js and follows a component-based architecture with Redux for state management:

```
src/web/
├── next.config.js          # Next.js configuration
├── package.json            # Frontend dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── public/                 # Static assets
│   ├── assets/             # Images, icons, and other assets
│   │   ├── icons/          # UI icons
│   │   └── images/         # Images and graphics
│   ├── favicon.ico         # Site favicon
│   ├── logo.svg            # Application logo
│   ├── manifest.json       # PWA manifest
│   └── robots.txt          # Search engine directives
├── src/                    # Application source code
│   ├── api/                # API client services
│   │   ├── auth.api.ts     # Authentication API client
│   │   ├── billing.api.ts  # Billing API client
│   │   ├── claims.api.ts   # Claims API client
│   │   ├── clients.api.ts  # Clients API client
│   │   ├── dashboard.api.ts # Dashboard API client
│   │   ├── interceptors.ts # API request/response interceptors
│   │   ├── payments.api.ts # Payments API client
│   │   ├── reports.api.ts  # Reports API client
│   │   ├── services.api.ts # Services API client
│   │   ├── settings.api.ts # Settings API client
│   │   ├── users.api.ts    # Users API client
│   │   └── client.ts       # Base API client
│   ├── components/         # React components
│   │   ├── auth/           # Authentication components
│   │   │   ├── ForgotPasswordForm.tsx # Password recovery form
│   │   │   ├── LoginForm.tsx # Login form
│   │   │   ├── MfaForm.tsx # Multi-factor authentication form
│   │   │   └── ResetPasswordForm.tsx # Password reset form
│   │   ├── billing/        # Billing workflow components
│   │   │   ├── BillingDashboard.tsx # Billing dashboard
│   │   │   ├── BillingFilter.tsx # Billing list filters
│   │   │   ├── BillingQueue.tsx # Billing queue
│   │   │   ├── ClaimCreationWizard.tsx # Claim creation wizard
│   │   │   ├── SubmissionConfirmation.tsx # Submission confirmation
│   │   │   └── ValidationForm.tsx # Billing validation form
│   │   ├── charts/         # Data visualization components
│   │   │   ├── AgingChart.tsx # AR aging chart
│   │   │   ├── AreaChart.tsx # Area chart component
│   │   │   ├── BarChart.tsx # Bar chart component
│   │   │   ├── LineChart.tsx # Line chart component
│   │   │   ├── MetricsChart.tsx # Metrics chart component
│   │   │   ├── PieChart.tsx # Pie chart component
│   │   │   ├── RevenueByPayerChart.tsx # Revenue by payer chart
│   │   │   ├── RevenueByProgramChart.tsx # Revenue by program chart
│   │   │   ├── RevenueTrendChart.tsx # Revenue trend chart
│   │   │   └── StatusDistributionChart.tsx # Status distribution chart
│   │   ├── claims/         # Claims management components
│   │   │   ├── BatchClaimProcess.tsx # Batch claim processing
│   │   │   ├── ClaimActions.tsx # Claim action buttons
│   │   │   ├── ClaimDetail.tsx # Claim detail view
│   │   │   ├── ClaimFilter.tsx # Claims list filters
│   │   │   ├── ClaimForm.tsx # Claim form
│   │   │   ├── ClaimList.tsx # Claims list
│   │   │   ├── ClaimServiceList.tsx # Claim services list
│   │   │   ├── ClaimSummary.tsx # Claim summary
│   │   │   ├── ClaimTimeline.tsx # Claim status timeline
│   │   │   ├── StatusBadge.tsx # Claim status badge
│   │   │   └── StatusTracking.tsx # Claim status tracking
│   │   ├── clients/        # Client management components
│   │   │   ├── AuthorizationForm.tsx # Authorization form
│   │   │   ├── AuthorizationList.tsx # Authorizations list
│   │   │   ├── ClientDetail.tsx # Client detail view
│   │   │   ├── ClientFilter.tsx # Clients list filters
│   │   │   ├── ClientForm.tsx # Client form
│   │   │   └── ClientList.tsx # Clients list
│   │   ├── dashboard/      # Dashboard components
│   │   │   ├── AgingReceivables.tsx # Aging receivables widget
│   │   │   ├── AlertNotifications.tsx # Alert notifications widget
│   │   │   ├── ClaimsStatus.tsx # Claims status widget
│   │   │   ├── FinancialOverview.tsx # Financial overview widget
│   │   │   ├── QuickActions.tsx # Quick actions widget
│   │   │   ├── RecentClaims.tsx # Recent claims widget
│   │   │   ├── RevenueByProgram.tsx # Revenue by program widget
│   │   │   └── RevenueMetrics.tsx # Revenue metrics widget
│   │   ├── forms/          # Form components
│   │   │   ├── ClientInfoForm.tsx # Client information form
│   │   │   ├── ClaimEntryForm.tsx # Claim entry form
│   │   │   ├── IntegrationConfigForm.tsx # Integration configuration form
│   │   │   ├── OrganizationSettingsForm.tsx # Organization settings form
│   │   │   ├── PasswordChangeForm.tsx # Password change form
│   │   │   ├── PayerConfigForm.tsx # Payer configuration form
│   │   │   ├── PaymentEntryForm.tsx # Payment entry form
│   │   │   ├── ProgramConfigForm.tsx # Program configuration form
│   │   │   ├── ReconciliationForm.tsx # Payment reconciliation form
│   │   │   ├── ReportParametersForm.tsx # Report parameters form
│   │   │   ├── ServiceCodeForm.tsx # Service code form
│   │   │   ├── ServiceEntryForm.tsx # Service entry form
│   │   │   └── UserProfileForm.tsx # User profile form
│   │   ├── layout/         # Layout components
│   │   │   ├── AuthLayout.tsx # Authentication layout
│   │   │   ├── HelpLayout.tsx # Help center layout
│   │   │   ├── MainLayout.tsx # Main application layout
│   │   │   ├── ProfileLayout.tsx # User profile layout
│   │   │   └── SettingsLayout.tsx # Settings layout
│   │   ├── navigation/     # Navigation components
│   │   │   ├── Breadcrumbs.tsx # Breadcrumb navigation
│   │   │   ├── MobileNavigation.tsx # Mobile navigation
│   │   │   ├── Sidebar.tsx # Sidebar navigation
│   │   │   ├── TabNavigation.tsx # Tab navigation
│   │   │   └── Topbar.tsx # Top navigation bar
│   │   ├── payments/       # Payment components
│   │   │   ├── ARAgingReport.tsx # Accounts receivable aging report
│   │   │   ├── PaymentActions.tsx # Payment action buttons
│   │   │   ├── PaymentDashboard.tsx # Payment dashboard
│   │   │   ├── PaymentDetail.tsx # Payment detail view
│   │   │   ├── PaymentFilter.tsx # Payments list filters
│   │   │   ├── PaymentForm.tsx # Payment form
│   │   │   ├── PaymentList.tsx # Payments list
│   │   │   ├── ReconciliationForm.tsx # Reconciliation form
│   │   │   └── RemittanceImport.tsx # Remittance import
│   │   ├── reports/        # Reporting components
│   │   │   ├── CustomReportBuilder.tsx # Custom report builder
│   │   │   ├── ReportDashboard.tsx # Reports dashboard
│   │   │   ├── ReportExport.tsx # Report export options
│   │   │   ├── ReportList.tsx # Reports list
│   │   │   ├── ReportParameters.tsx # Report parameters
│   │   │   ├── ReportSelector.tsx # Report type selector
│   │   │   ├── ReportViewer.tsx # Report viewer
│   │   │   └── ScheduleForm.tsx # Report scheduling form
│   │   ├── services/       # Service components
│   │   │   ├── ServiceDashboard.tsx # Services dashboard
│   │   │   ├── ServiceDetail.tsx # Service detail view
│   │   │   ├── ServiceFilter.tsx # Services list filters
│   │   │   ├── ServiceForm.tsx # Service form
│   │   │   ├── ServiceList.tsx # Services list
│   │   │   └── ValidationResults.tsx # Service validation results
│   │   ├── settings/       # Settings components
│   │   │   ├── AuditLogViewer.tsx # Audit log viewer
│   │   │   ├── IntegrationForm.tsx # Integration form
│   │   │   ├── IntegrationList.tsx # Integrations list
│   │   │   ├── NotificationSettings.tsx # Notification settings
│   │   │   ├── OrganizationForm.tsx # Organization form
│   │   │   ├── PayerForm.tsx # Payer form
│   │   │   ├── PayerList.tsx # Payers list
│   │   │   ├── ProgramForm.tsx # Program form
│   │   │   ├── ProgramList.tsx # Programs list
│   │   │   ├── RoleForm.tsx # Role form
│   │   │   ├── RoleManagement.tsx # Role management
│   │   │   ├── ServiceCodeForm.tsx # Service code form
│   │   │   ├── ServiceCodeList.tsx # Service codes list
│   │   │   ├── UserForm.tsx # User form
│   │   │   └── UserManagement.tsx # User management
│   │   └── ui/             # Shared UI components
│   │       ├── ActionButton.tsx # Action button
│   │       ├── AlertNotification.tsx # Alert notification
│   │       ├── Card.tsx # Card container
│   │       ├── ConfirmDialog.tsx # Confirmation dialog
│   │       ├── DataTable.tsx # Data table
│   │       ├── DateRangePicker.tsx # Date range picker
│   │       ├── EmptyState.tsx # Empty state placeholder
│   │       ├── ErrorBoundary.tsx # Error boundary
│   │       ├── FileUploader.tsx # File uploader
│   │       ├── FilterPanel.tsx # Filter panel
│   │       ├── MetricCard.tsx # Metric card
│   │       ├── Pagination.tsx # Pagination control
│   │       ├── SearchInput.tsx # Search input
│   │       ├── Skeleton.tsx # Loading skeleton
│   │       ├── StatusBadge.tsx # Status badge
│   │       ├── Stepper.tsx # Step wizard
│   │       └── Tabs.tsx # Tab container
│   ├── config/             # Frontend configuration
│   │   ├── api.config.ts   # API configuration
│   │   ├── auth.config.ts  # Authentication configuration
│   │   ├── chart.config.ts # Chart configuration
│   │   ├── dashboard.config.ts # Dashboard configuration
│   │   ├── date.config.ts  # Date formatting configuration
│   │   ├── navigation.config.ts # Navigation configuration
│   │   ├── report.config.ts # Report configuration
│   │   ├── seo.config.ts   # SEO configuration
│   │   ├── table.config.ts # Table configuration
│   │   ├── theme.config.ts # Theme configuration
│   │   ├── validation.config.ts # Validation configuration
│   │   └── index.ts        # Configuration exports
│   ├── constants/          # Application constants
│   │   ├── api.constants.ts # API constants
│   │   ├── auth.constants.ts # Authentication constants
│   │   ├── claims.constants.ts # Claims constants
│   │   ├── dashboard.constants.ts # Dashboard constants
│   │   ├── navigation.constants.ts # Navigation constants
│   │   ├── payments.constants.ts # Payments constants
│   │   ├── reports.constants.ts # Reports constants
│   │   ├── routes.constants.ts # Route constants
│   │   ├── services.constants.ts # Services constants
│   │   ├── ui.constants.ts # UI constants
│   │   └── index.ts        # Constants exports
│   ├── context/            # React context providers
│   │   ├── AuthContext.tsx # Authentication context
│   │   ├── FilterContext.tsx # Filter context
│   │   ├── NotificationContext.tsx # Notification context
│   │   ├── SettingsContext.tsx # Settings context
│   │   ├── ThemeContext.tsx # Theme context
│   │   └── ToastContext.tsx # Toast notification context
│   ├── hooks/              # Custom React hooks
│   │   ├── useApiRequest.ts # API request hook
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useClaims.ts    # Claims data hook
│   │   ├── useClients.ts   # Clients data hook
│   │   ├── useDashboard.ts # Dashboard data hook
│   │   ├── useFilter.ts    # Data filtering hook
│   │   ├── useForm.ts      # Form handling hook
│   │   ├── useLocalStorage.ts # Local storage hook
│   │   ├── usePagination.ts # Pagination hook
│   │   ├── usePayments.ts  # Payments data hook
│   │   ├── useQueryParams.ts # URL query parameters hook
│   │   ├── useReports.ts   # Reports data hook
│   │   ├── useResponsive.ts # Responsive design hook
│   │   ├── useServices.ts  # Services data hook
│   │   ├── useSettings.ts  # Settings data hook
│   │   ├── useSort.ts      # Data sorting hook
│   │   └── useToast.ts     # Toast notification hook
│   ├── mocks/              # Mock data for development and testing
│   │   ├── data/           # Mock data by domain
│   │   │   ├── auth.ts     # Authentication mock data
│   │   │   ├── claims.ts   # Claims mock data
│   │   │   ├── clients.ts  # Clients mock data
│   │   │   ├── dashboard.ts # Dashboard mock data
│   │   │   ├── payments.ts # Payments mock data
│   │   │   ├── reports.ts  # Reports mock data
│   │   │   ├── services.ts # Services mock data
│   │   │   └── settings.ts # Settings mock data
│   │   ├── browser.ts      # Browser mock setup
│   │   ├── handlers.ts     # API mock handlers
│   │   └── server.ts       # Mock server setup
│   ├── pages/              # Next.js pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── billing/        # Billing workflow pages
│   │   ├── claims/         # Claims management pages
│   │   ├── clients/        # Client management pages
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── help/           # Help center pages
│   │   ├── payments/       # Payment processing pages
│   │   ├── profile/        # User profile pages
│   │   ├── reports/        # Reporting pages
│   │   ├── services/       # Service tracking pages
│   │   ├── settings/       # Settings pages
│   │   ├── _app.tsx        # Application wrapper
│   │   ├── _document.tsx   # Document wrapper
│   │   ├── 404.tsx         # Not found page
│   │   ├── 500.tsx         # Error page
│   │   ├── forgot-password.tsx # Password recovery page
│   │   ├── index.tsx       # Home page
│   │   ├── login.tsx       # Login page
│   │   ├── mfa.tsx         # Multi-factor authentication page
│   │   └── reset-password.tsx # Password reset page
│   ├── store/              # Redux state management
│   │   ├── auth/           # Authentication state
│   │   │   ├── authSelectors.ts # Authentication selectors
│   │   │   ├── authSlice.ts # Authentication reducer
│   │   │   └── authThunks.ts # Authentication actions
│   │   ├── claims/         # Claims state
│   │   │   ├── claimsSelectors.ts # Claims selectors
│   │   │   ├── claimsSlice.ts # Claims reducer
│   │   │   └── claimsThunks.ts # Claims actions
│   │   ├── clients/        # Clients state
│   │   │   ├── clientsSelectors.ts # Clients selectors
│   │   │   ├── clientsSlice.ts # Clients reducer
│   │   │   └── clientsThunks.ts # Clients actions
│   │   ├── dashboard/      # Dashboard state
│   │   │   ├── dashboardSelectors.ts # Dashboard selectors
│   │   │   ├── dashboardSlice.ts # Dashboard reducer
│   │   │   └── dashboardThunks.ts # Dashboard actions
│   │   ├── payments/       # Payments state
│   │   │   ├── paymentsSelectors.ts # Payments selectors
│   │   │   ├── paymentsSlice.ts # Payments reducer
│   │   │   └── paymentsThunks.ts # Payments actions
│   │   ├── reports/        # Reports state
│   │   │   ├── reportsSelectors.ts # Reports selectors
│   │   │   ├── reportsSlice.ts # Reports reducer
│   │   │   └── reportsThunks.ts # Reports actions
│   │   ├── services/       # Services state
│   │   │   ├── servicesSelectors.ts # Services selectors
│   │   │   ├── servicesSlice.ts # Services reducer
│   │   │   └── servicesThunks.ts # Services actions
│   │   ├── settings/       # Settings state
│   │   │   ├── settingsSelectors.ts # Settings selectors
│   │   │   ├── settingsSlice.ts # Settings reducer
│   │   │   └── settingsThunks.ts # Settings actions
│   │   ├── ui/             # UI state
│   │   │   ├── uiSelectors.ts # UI selectors
│   │   │   └── uiSlice.ts  # UI reducer
│   │   ├── index.ts        # Store configuration
│   │   └── rootReducer.ts  # Root reducer
│   ├── styles/             # CSS styles
│   │   ├── components.css  # Component-specific styles
│   │   ├── globals.css     # Global styles
│   │   ├── nprogress.css   # Progress bar styles
│   │   ├── print.css       # Print styles
│   │   └── theme.ts        # Theme definition
│   ├── tests/              # Frontend tests
│   │   ├── e2e/            # End-to-end tests
│   │   ├── integration/    # Integration tests
│   │   ├── unit/           # Unit tests
│   │   └── utils/          # Test utilities
│   ├── types/              # TypeScript type definitions
│   │   ├── api.types.ts    # API-related types
│   │   ├── auth.types.ts   # Authentication types
│   │   ├── billing.types.ts # Billing workflow types
│   │   ├── chart.types.ts  # Chart types
│   │   ├── claims.types.ts # Claims management types
│   │   ├── clients.types.ts # Client management types
│   │   ├── common.types.ts # Shared type definitions
│   │   ├── dashboard.types.ts # Dashboard types
│   │   ├── form.types.ts   # Form types
│   │   ├── notification.types.ts # Notification types
│   │   ├── payments.types.ts # Payment processing types
│   │   ├── reports.types.ts # Reporting types
│   │   ├── services.types.ts # Service tracking types
│   │   ├── settings.types.ts # Settings types
│   │   ├── theme.types.ts  # Theme types
│   │   ├── ui.types.ts     # UI component types
│   │   ├── users.types.ts  # User management types
│   │   └── index.ts        # Type exports
│   └── utils/              # Utility functions
│       ├── api.ts          # API utilities
│       ├── array.ts        # Array manipulation utilities
│       ├── auth.ts         # Authentication utilities
│       ├── currency.ts     # Currency formatting utilities
│       ├── date.ts         # Date manipulation utilities
│       ├── export.ts       # Export utilities
│       ├── file.ts         # File handling utilities
│       ├── format.ts       # Data formatting utilities
│       ├── number.ts       # Number formatting utilities
│       ├── object.ts       # Object manipulation utilities
│       ├── print.ts        # Printing utilities
│       ├── responsive.ts   # Responsive design utilities
│       ├── route.ts        # Routing utilities
│       ├── storage.ts      # Storage utilities
│       ├── string.ts       # String manipulation utilities
│       ├── test-utils.ts   # Testing utilities
│       └── validation.ts   # Validation utilities
└── cypress/               # Cypress E2E testing
    ├── fixtures/          # Test data fixtures
    ├── integration/       # Test specifications
    ├── plugins/           # Cypress plugins
    └── support/           # Test support files
```

## Infrastructure

The infrastructure code is organized to support deployment to various environments:

```
infrastructure/
├── docker/                # Docker configuration
│   ├── backend/           # Backend Docker setup
│   │   └── Dockerfile     # Backend container definition
│   ├── proxy/             # Nginx proxy configuration
│   │   ├── Dockerfile     # Proxy container definition
│   │   └── nginx.conf     # Nginx configuration
│   ├── web/               # Frontend Docker setup
│   │   └── Dockerfile     # Frontend container definition
│   └── .dockerignore      # Docker ignore file
├── kubernetes/            # Kubernetes manifests
│   ├── manifests/         # Kubernetes resource definitions
│   │   ├── backend/       # Backend service manifests
│   │   ├── common/        # Shared resources
│   │   ├── monitoring/    # Monitoring stack
│   │   ├── redis/         # Redis cache
│   │   └── web/           # Frontend service manifests
├── scripts/               # Infrastructure scripts
│   ├── backup-database.sh # Database backup script
│   ├── database-backup.sh # Database backup script
│   ├── database-restore.sh # Database restore script
│   ├── deploy.sh          # Deployment script
│   └── generate-secrets.sh # Secret generation script
└── terraform/             # Terraform IaC
    ├── environments/      # Environment-specific configurations
    │   ├── dev/           # Development environment
    │   ├── production/    # Production environment
    │   └── staging/       # Staging environment
    ├── modules/           # Terraform modules
    │   ├── eks/           # EKS cluster module
    │   ├── elasticache/   # Redis module
    │   ├── networking/    # VPC and networking module
    │   ├── rds/           # PostgreSQL module
    │   └── s3/            # S3 storage module
    ├── main.tf            # Main Terraform configuration
    ├── outputs.tf         # Terraform outputs
    └── variables.tf       # Terraform variables
```

## CI/CD Configuration

Continuous integration and deployment is managed through GitHub Actions:

```
.github/
├── CODEOWNERS             # Code ownership definitions
├── ISSUE_TEMPLATE/        # Issue templates
│   ├── bug_report.md      # Bug report template
│   └── feature_request.md # Feature request template
├── PULL_REQUEST_TEMPLATE.md # Pull request template
├── dependabot.yml         # Dependabot configuration
└── workflows/             # GitHub Actions workflows
    ├── backend-ci.yml     # Backend CI workflow
    ├── deploy.yml         # Deployment workflow
    └── web-ci.yml         # Frontend CI workflow
```

## Key Design Patterns

The HCBS Revenue Management System implements several architectural and design patterns:

1. **Repository Pattern**: Abstracts data access logic in the backend repositories
2. **Service Layer Pattern**: Encapsulates business logic in service classes
3. **Adapter Pattern**: Used for external system integrations
4. **Factory Pattern**: Creates complex objects in a consistent way
5. **Observer Pattern**: Implemented through the event system for notifications
6. **Strategy Pattern**: Used for different validation and processing strategies
7. **Command Pattern**: Implemented in workflow processes
8. **Decorator Pattern**: Used for middleware functionality
9. **Facade Pattern**: Simplifies complex subsystems through service interfaces
10. **Singleton Pattern**: Used for configuration and connection management

## Module Dependencies

The system is designed with clear module boundaries and dependencies:

1. **Frontend Dependencies**:
   - Pages depend on components, hooks, and store
   - Components depend on hooks, utils, and context
   - Store depends on API clients and utils
   - Hooks depend on API clients, utils, and store

2. **Backend Dependencies**:
   - Controllers depend on services and middleware
   - Services depend on repositories, integrations, and utils
   - Repositories depend on models and database connection
   - Middleware depends on utils and configuration
   - Integrations depend on adapters, transformers, and utils

This modular architecture enables independent development, testing, and maintenance of different system components while ensuring clear separation of concerns.

# CODE GUIDE

## Introduction

The HCBS Revenue Management System is a comprehensive web application designed to transform financial operations for Home and Community-Based Services (HCBS) providers. This HIPAA-compliant system addresses critical challenges in revenue cycle management by streamlining billing processes, enhancing financial visibility, and ensuring compliance with Medicaid and other payer requirements.

This guide provides a detailed explanation of the codebase structure, key components, and how they work together to create a robust healthcare financial management system.

## Project Architecture

The project follows a modern full-stack architecture with:

1. **Frontend**: Next.js application with React, TypeScript, and Material UI
2. **Backend**: Node.js/Express API server with TypeScript
3. **Database**: PostgreSQL for data persistence
4. **Caching**: Redis for performance optimization
5. **Infrastructure**: Docker and Kubernetes for containerization and orchestration

The application is designed with a clear separation of concerns, following best practices for maintainability, scalability, and security.

## Directory Structure Overview

```
hcbs-revenue-management/
├── src/                    # Source code
│   ├── backend/            # Backend application
│   └── web/                # Frontend application
├── infrastructure/         # Infrastructure as Code (Terraform, Kubernetes)
├── scripts/                # Utility scripts
└── docs/                   # Documentation
```

## Backend Code Structure (`src/backend/`)

The backend is a Node.js/Express application written in TypeScript that provides RESTful APIs for the frontend.

### Key Backend Directories

#### `src/backend/app.ts` and `src/backend/server.ts`

These are the entry points for the backend application:

- `server.ts`: Initializes the HTTP server, sets up graceful shutdown, and handles uncaught errors
- `app.ts`: Configures the Express application with middleware, routes, and error handling

#### `src/backend/config/`

Contains configuration files for different aspects of the application:

- `database.config.ts`: Database connection configuration for different environments
- `auth.config.ts`: Authentication settings including JWT configuration
- `cors.config.ts`: CORS settings for API security
- `logger.config.ts`: Logging configuration
- `redis.config.ts`: Redis cache configuration
- `swagger.config.ts`: API documentation configuration
- `index.ts`: Exports all configurations with environment-specific settings

#### `src/backend/controllers/`

Contains Express route handlers that process HTTP requests and return responses:

- `auth.controller.ts`: Handles authentication requests (login, logout, refresh token)
- `users.controller.ts`: User management endpoints
- `clients.controller.ts`: Client data management
- `services.controller.ts`: Service record management
- `claims.controller.ts`: Claims processing endpoints
- `billing.controller.ts`: Billing workflow endpoints
- `payments.controller.ts`: Payment processing and reconciliation
- `reports.controller.ts`: Financial reporting endpoints
- `dashboard.controller.ts`: Dashboard data endpoints
- `settings.controller.ts`: System settings management

#### `src/backend/database/`

Manages database connections, migrations, and repositories:

- `connection.ts`: Database connection management
- `migrations/`: Database schema migrations
- `seeds/`: Seed data for development and testing
- `repositories/`: Data access layer with repository pattern implementation

#### `src/backend/errors/`

Custom error classes for consistent error handling:

- `api-error.ts`: Base API error class
- `auth-error.ts`: Authentication and authorization errors
- `validation-error.ts`: Input validation errors
- `database-error.ts`: Database operation errors
- `not-found-error.ts`: Resource not found errors
- `business-error.ts`: Business logic errors
- `integration-error.ts`: External integration errors
- `permission-error.ts`: Permission-related errors
- `index.ts`: Exports all error types

#### `src/backend/health/`

Health check endpoints and monitoring:

- `health-check.ts`: Health check endpoint implementation
- `api-performance.ts`: API performance monitoring
- `database-health.ts`: Database connection health checks
- `redis-health.ts`: Redis connection health checks
- `integration-health.ts`: External integration health checks
- `disk-usage.ts`: Disk space monitoring
- `memory-usage.ts`: Memory usage monitoring
- `index.ts`: Exports health check middleware

#### `src/backend/integrations/`

External system integrations:

- `medicaid.integration.ts`: Integration with Medicaid systems
- `clearinghouse.integration.ts`: Integration with claims clearinghouses
- `ehr.integration.ts`: Integration with Electronic Health Record systems
- `accounting.integration.ts`: Integration with accounting systems
- `remittance.integration.ts`: Processing of electronic remittance advice
- `adapters/`: Adapter pattern implementations for different external systems
- `transformers/`: Data transformation utilities for integration
- `index.ts`: Exports integration initialization functions

#### `src/backend/middleware/`

Express middleware components:

- `auth.middleware.ts`: Authentication and authorization middleware
- `validation.middleware.ts`: Request validation middleware
- `error.middleware.ts`: Global error handling middleware
- `logger.middleware.ts`: Request logging middleware
- `cors.middleware.ts`: CORS handling middleware
- `transaction.middleware.ts`: Database transaction middleware
- `audit.middleware.ts`: Audit logging middleware
- `rateLimiter.middleware.ts`: Rate limiting for API protection
- `index.ts`: Exports all middleware components

#### `src/backend/models/`

Database models representing the application's data structures:

- `user.model.ts`: User account data
- `client.model.ts`: Client/patient information
- `service.model.ts`: Service delivery records
- `claim.model.ts`: Healthcare claims
- `payment.model.ts`: Payment records
- `authorization.model.ts`: Service authorizations
- `program.model.ts`: Program definitions
- `payer.model.ts`: Payer information
- `facility.model.ts`: Facility/location data
- `document.model.ts`: Document storage metadata
- `role.model.ts`: User roles
- `permission.model.ts`: Permissions for access control
- `audit.model.ts`: Audit log entries
- `notification.model.ts`: System notifications
- `report.model.ts`: Report definitions
- `setting.model.ts`: System settings
- `staff.model.ts`: Staff information
- `index.ts`: Exports all models

#### `src/backend/notifications/`

Notification system implementation:

- `notification-manager.ts`: Central notification handling
- `email-notification.ts`: Email notification implementation
- `sms-notification.ts`: SMS notification implementation
- `in-app-notification.ts`: In-app notification implementation
- `notification-templates/`: Templates for different notification types
- `index.ts`: Exports notification functionality

#### `src/backend/routes/`

API route definitions:

- `api.routes.ts`: Main API router that combines all routes
- `auth.routes.ts`: Authentication endpoints
- `users.routes.ts`: User management endpoints
- `clients.routes.ts`: Client data endpoints
- `services.routes.ts`: Service record endpoints
- `claims.routes.ts`: Claims processing endpoints
- `billing.routes.ts`: Billing workflow endpoints
- `payments.routes.ts`: Payment processing endpoints
- `reports.routes.ts`: Reporting endpoints
- `dashboard.routes.ts`: Dashboard data endpoints
- `settings.routes.ts`: System settings endpoints
- `integrations.routes.ts`: Integration management endpoints
- `index.ts`: Exports all routes and middleware

#### `src/backend/scheduler/`

Background job scheduling:

- `scheduler.ts`: Job scheduler configuration
- `authorization-expiry.job.ts`: Authorization expiration notifications
- `claim-aging.job.ts`: Claim aging analysis
- `payment-reconciliation.job.ts`: Automated payment reconciliation
- `report-generation.job.ts`: Scheduled report generation
- `database-maintenance.job.ts`: Database maintenance tasks
- `data-archival.job.ts`: Data archiving for compliance
- `index.ts`: Exports scheduler initialization

#### `src/backend/security/`

Security-related functionality:

- `authentication.ts`: Authentication logic
- `authorization.ts`: Authorization logic
- `role-based-access.ts`: Role-based access control
- `token.ts`: JWT token management
- `session-management.ts`: User session handling
- `passwordPolicy.ts`: Password requirements and validation
- `data-masking.ts`: PHI/PII data masking
- `encryption.ts`: Data encryption utilities
- `audit-logging.ts`: Security audit logging
- `hipaaCompliance.ts`: HIPAA compliance utilities
- `index.ts`: Exports security components

#### `src/backend/services/`

Business logic implementation:

- `auth.service.ts`: Authentication business logic
- `users.service.ts`: User management logic
- `clients.service.ts`: Client data management
- `services.service.ts`: Service record management
- `claims.service.ts`: Claims processing logic
- `billing.service.ts`: Billing workflow logic
- `payments.service.ts`: Payment processing logic
- `reports.service.ts`: Reporting logic
- `dashboard.service.ts`: Dashboard data aggregation
- `settings.service.ts`: System settings management
- `notification.service.ts`: Notification delivery logic
- `claims/`: Specialized claim processing services
- `billing/`: Specialized billing services
- `payments/`: Specialized payment services
- `reports/`: Specialized reporting services
- `index.ts`: Exports all services

#### `src/backend/types/`

TypeScript type definitions:

- `common.types.ts`: Shared type definitions
- `auth.types.ts`: Authentication-related types
- `users.types.ts`: User-related types
- `clients.types.ts`: Client-related types
- `services.types.ts`: Service-related types
- `claims.types.ts`: Claim-related types
- `billing.types.ts`: Billing-related types
- `payments.types.ts`: Payment-related types
- `reports.types.ts`: Reporting-related types
- `notification.types.ts`: Notification-related types
- `integration.types.ts`: Integration-related types
- `database.types.ts`: Database-related types
- `request.types.ts`: HTTP request types
- `response.types.ts`: HTTP response types
- `error.types.ts`: Error-related types
- `api.types.ts`: API-related types
- `index.ts`: Exports all types

#### `src/backend/utils/`

Utility functions:

- `logger.ts`: Logging utility
- `date.ts`: Date manipulation utilities
- `string.ts`: String manipulation utilities
- `math.ts`: Mathematical utilities
- `formatter.ts`: Data formatting utilities
- `validation.ts`: Data validation utilities
- `crypto.ts`: Cryptographic utilities
- `file.ts`: File handling utilities
- `id-generator.ts`: Unique ID generation
- `cache.ts`: Caching utilities
- `error.ts`: Error handling utilities
- `metrics.ts`: Performance metrics utilities
- `http.ts`: HTTP request utilities
- `object.ts`: Object manipulation utilities
- `array.ts`: Array manipulation utilities
- `mapper.ts`: Data mapping utilities
- `serialization.ts`: Data serialization utilities
- `index.ts`: Exports all utilities

#### `src/backend/validation/`

Request validation:

- `schemas/`: Joi validation schemas for different entity types
- `service.validation.ts`: Service data validation
- `client.validation.ts`: Client data validation
- `claim.validation.ts`: Claim data validation
- `payment.validation.ts`: Payment data validation
- `report.validation.ts`: Report data validation
- `user.validation.ts`: User data validation
- `integration.validation.ts`: Integration data validation
- `authorization.validation.ts`: Authorization data validation
- `index.ts`: Exports all validation utilities

#### `src/backend/workflows/`

Business process workflows:

- `claim-processing.workflow.ts`: End-to-end claim processing
- `payment-reconciliation.workflow.ts`: Payment reconciliation process
- `service-to-billing.workflow.ts`: Service to billing conversion
- `claim-denial.workflow.ts`: Claim denial handling
- `payment-adjustment.workflow.ts`: Payment adjustment processing
- `authorization-management.workflow.ts`: Authorization lifecycle management
- `index.ts`: Exports all workflow definitions

## Frontend Code Structure (`src/web/`)

The frontend is a Next.js application written in TypeScript with React components and Redux for state management.

### Key Frontend Directories

#### `src/web/src/pages/`

Next.js pages that define the application routes:

- `_app.tsx`: Main application wrapper with providers
- `_document.tsx`: Custom document for HTML structure
- `index.tsx`: Home/dashboard page
- `login.tsx`: Login page
- `forgot-password.tsx`: Password recovery
- `reset-password.tsx`: Password reset
- `mfa.tsx`: Multi-factor authentication
- `dashboard/`: Dashboard pages
- `claims/`: Claims management pages
- `billing/`: Billing workflow pages
- `payments/`: Payment processing pages
- `reports/`: Reporting pages
- `clients/`: Client management pages
- `services/`: Service management pages
- `settings/`: System settings pages
- `profile/`: User profile pages
- `help/`: Help and support pages
- `api/`: API routes for Next.js API functionality

#### `src/web/src/components/`

React components organized by feature:

- `ui/`: Reusable UI components
  - `Card.tsx`: Card container component
  - `DataTable.tsx`: Data table with sorting and pagination
  - `FilterPanel.tsx`: Filter controls for lists
  - `SearchInput.tsx`: Search input component
  - `DateRangePicker.tsx`: Date range selection
  - `StatusBadge.tsx`: Status indicator component
  - `ActionButton.tsx`: Button with confirmation
  - `MetricCard.tsx`: Metric display component
  - `Pagination.tsx`: Pagination controls
  - `Tabs.tsx`: Tabbed interface component
  - `FileUploader.tsx`: File upload component
  - `Stepper.tsx`: Multi-step process component
  - `ConfirmDialog.tsx`: Confirmation dialog
  - `EmptyState.tsx`: Empty state display
  - `Skeleton.tsx`: Loading skeleton
  - `ErrorBoundary.tsx`: Error boundary component
  - `AlertNotification.tsx`: Alert notification component

- `layout/`: Layout components
  - `MainLayout.tsx`: Main application layout
  - `AuthLayout.tsx`: Authentication pages layout
  - `ProfileLayout.tsx`: User profile layout
  - `SettingsLayout.tsx`: Settings pages layout
  - `HelpLayout.tsx`: Help pages layout

- `navigation/`: Navigation components
  - `Sidebar.tsx`: Main navigation sidebar
  - `Topbar.tsx`: Top navigation bar
  - `MobileNavigation.tsx`: Mobile navigation menu
  - `Breadcrumbs.tsx`: Breadcrumb navigation
  - `TabNavigation.tsx`: Tab-based navigation

- `auth/`: Authentication components
  - `LoginForm.tsx`: Login form
  - `ForgotPasswordForm.tsx`: Password recovery form
  - `ResetPasswordForm.tsx`: Password reset form
  - `MfaForm.tsx`: Multi-factor authentication form

- `dashboard/`: Dashboard components
  - `FinancialOverview.tsx`: Financial metrics overview
  - `RevenueMetrics.tsx`: Revenue metrics display
  - `ClaimsStatus.tsx`: Claims status summary
  - `AlertNotifications.tsx`: Alert notifications
  - `RecentClaims.tsx`: Recent claims list
  - `QuickActions.tsx`: Quick action buttons
  - `AgingReceivables.tsx`: Aging receivables chart
  - `RevenueByProgram.tsx`: Revenue by program chart

- `claims/`: Claims management components
  - `ClaimList.tsx`: Claims list view
  - `ClaimDetail.tsx`: Claim detail view
  - `ClaimForm.tsx`: Claim creation/editing form
  - `ClaimActions.tsx`: Claim action buttons
  - `ClaimFilter.tsx`: Claims filtering controls
  - `ClaimSummary.tsx`: Claim summary display
  - `ClaimTimeline.tsx`: Claim status timeline
  - `ClaimServiceList.tsx`: Services in claim
  - `StatusBadge.tsx`: Claim status indicator
  - `BatchClaimProcess.tsx`: Batch claim processing
  - `StatusTracking.tsx`: Claim status tracking

- `billing/`: Billing workflow components
  - `BillingDashboard.tsx`: Billing dashboard
  - `BillingQueue.tsx`: Billing queue management
  - `BillingFilter.tsx`: Billing filtering controls
  - `ValidationForm.tsx`: Service validation form
  - `ClaimCreationWizard.tsx`: Claim creation wizard
  - `SubmissionConfirmation.tsx`: Submission confirmation

- `payments/`: Payment components
  - `PaymentDashboard.tsx`: Payments dashboard
  - `PaymentList.tsx`: Payments list view
  - `PaymentDetail.tsx`: Payment detail view
  - `PaymentForm.tsx`: Payment entry form
  - `PaymentFilter.tsx`: Payment filtering controls
  - `PaymentActions.tsx`: Payment action buttons
  - `ReconciliationForm.tsx`: Payment reconciliation
  - `RemittanceImport.tsx`: Remittance file import
  - `ARAgingReport.tsx`: Accounts receivable aging

- `reports/`: Reporting components
  - `ReportDashboard.tsx`: Reports dashboard
  - `ReportList.tsx`: Reports list view
  - `ReportViewer.tsx`: Report viewer
  - `ReportSelector.tsx`: Report type selection
  - `ReportParameters.tsx`: Report parameter form
  - `ReportExport.tsx`: Report export controls
  - `ScheduleForm.tsx`: Report scheduling form
  - `CustomReportBuilder.tsx`: Custom report builder

- `clients/`: Client management components
  - `ClientList.tsx`: Clients list view
  - `ClientDetail.tsx`: Client detail view
  - `ClientForm.tsx`: Client creation/editing form
  - `ClientFilter.tsx`: Client filtering controls
  - `AuthorizationList.tsx`: Client authorizations
  - `AuthorizationForm.tsx`: Authorization form

- `services/`: Service management components
  - `ServiceList.tsx`: Services list view
  - `ServiceDetail.tsx`: Service detail view
  - `ServiceForm.tsx`: Service entry form
  - `ServiceFilter.tsx`: Service filtering controls
  - `ValidationResults.tsx`: Service validation results
  - `ServiceDashboard.tsx`: Services dashboard

- `settings/`: Settings components
  - `UserManagement.tsx`: User management
  - `UserForm.tsx`: User creation/editing form
  - `RoleManagement.tsx`: Role management
  - `RoleForm.tsx`: Role creation/editing form
  - `ProgramList.tsx`: Programs list
  - `ProgramForm.tsx`: Program configuration
  - `PayerList.tsx`: Payers list
  - `PayerForm.tsx`: Payer configuration
  - `ServiceCodeList.tsx`: Service codes list
  - `ServiceCodeForm.tsx`: Service code configuration
  - `IntegrationList.tsx`: Integrations list
  - `IntegrationForm.tsx`: Integration configuration
  - `OrganizationForm.tsx`: Organization settings
  - `NotificationSettings.tsx`: Notification settings
  - `AuditLogViewer.tsx`: Audit log viewer

- `forms/`: Reusable form components
  - `UserProfileForm.tsx`: User profile form
  - `PasswordChangeForm.tsx`: Password change form
  - `ClaimEntryForm.tsx`: Claim entry form
  - `ServiceEntryForm.tsx`: Service entry form
  - `ClientInfoForm.tsx`: Client information form
  - `ReportParametersForm.tsx`: Report parameters form
  - `IntegrationConfigForm.tsx`: Integration config form
  - `PayerConfigForm.tsx`: Payer configuration form
  - `ProgramConfigForm.tsx`: Program configuration form
  - `ServiceCodeForm.tsx`: Service code form
  - `OrganizationSettingsForm.tsx`: Organization settings form
  - `ReconciliationForm.tsx`: Reconciliation form
  - `PaymentEntryForm.tsx`: Payment entry form

- `charts/`: Data visualization components
  - `BarChart.tsx`: Bar chart component
  - `LineChart.tsx`: Line chart component
  - `PieChart.tsx`: Pie chart component
  - `AreaChart.tsx`: Area chart component
  - `StatusDistributionChart.tsx`: Status distribution chart
  - `RevenueTrendChart.tsx`: Revenue trend chart
  - `RevenueByProgramChart.tsx`: Revenue by program chart
  - `RevenueByPayerChart.tsx`: Revenue by payer chart
  - `AgingChart.tsx`: Aging receivables chart
  - `MetricsChart.tsx`: Metrics visualization

#### `src/web/src/api/`

API client for backend communication:

- `client.ts`: Base API client configuration
- `interceptors.ts`: Request/response interceptors
- `auth.api.ts`: Authentication API client
- `users.api.ts`: User management API client
- `clients.api.ts`: Client data API client
- `services.api.ts`: Service records API client
- `claims.api.ts`: Claims API client
- `billing.api.ts`: Billing API client
- `payments.api.ts`: Payments API client
- `reports.api.ts`: Reports API client
- `dashboard.api.ts`: Dashboard data API client
- `settings.api.ts`: Settings API client
- `notifications.api.ts`: Notifications API client

#### `src/web/src/context/`

React context providers:

- `AuthContext.tsx`: Authentication context
- `ThemeContext.tsx`: Theme management context
- `ToastContext.tsx`: Toast notification context
- `NotificationContext.tsx`: System notification context
- `SettingsContext.tsx`: Application settings context
- `FilterContext.tsx`: Data filtering context

#### `src/web/src/hooks/`

Custom React hooks:

- `useAuth.ts`: Authentication hooks
- `useApiRequest.ts`: API request hooks
- `usePagination.ts`: Pagination hooks
- `useSort.ts`: Sorting hooks
- `useFilter.ts`: Filtering hooks
- `useForm.ts`: Form handling hooks
- `useToast.ts`: Toast notification hooks
- `useDashboard.ts`: Dashboard data hooks
- `useClaims.ts`: Claims data hooks
- `usePayments.ts`: Payments data hooks
- `useReports.ts`: Reports data hooks
- `useServices.ts`: Services data hooks
- `useClients.ts`: Clients data hooks
- `useSettings.ts`: Settings data hooks
- `useResponsive.ts`: Responsive design hooks
- `useLocalStorage.ts`: Local storage hooks
- `useQueryParams.ts`: URL query parameter hooks

#### `src/web/src/store/`

Redux state management:

- `index.ts`: Redux store configuration
- `rootReducer.ts`: Root reducer combining all slices
- `auth/`: Authentication state
  - `authSlice.ts`: Auth reducer and actions
  - `authThunks.ts`: Auth async thunks
  - `authSelectors.ts`: Auth state selectors
- `claims/`: Claims state
  - `claimsSlice.ts`: Claims reducer and actions
  - `claimsThunks.ts`: Claims async thunks
  - `claimsSelectors.ts`: Claims state selectors
- `payments/`: Payments state
  - `paymentsSlice.ts`: Payments reducer and actions
  - `paymentsThunks.ts`: Payments async thunks
  - `paymentsSelectors.ts`: Payments state selectors
- `reports/`: Reports state
  - `reportsSlice.ts`: Reports reducer and actions
  - `reportsThunks.ts`: Reports async thunks
  - `reportsSelectors.ts`: Reports state selectors
- `dashboard/`: Dashboard state
  - `dashboardSlice.ts`: Dashboard reducer and actions
  - `dashboardThunks.ts`: Dashboard async thunks
  - `dashboardSelectors.ts`: Dashboard state selectors
- `clients/`: Clients state
  - `clientsSlice.ts`: Clients reducer and actions
  - `clientsThunks.ts`: Clients async thunks
  - `clientsSelectors.ts`: Clients state selectors
- `services/`: Services state
  - `servicesSlice.ts`: Services reducer and actions
  - `servicesThunks.ts`: Services async thunks
  - `servicesSelectors.ts`: Services state selectors
- `settings/`: Settings state
  - `settingsSlice.ts`: Settings reducer and actions
  - `settingsThunks.ts`: Settings async thunks
  - `settingsSelectors.ts`: Settings state selectors
- `ui/`: UI state
  - `uiSlice.ts`: UI reducer and actions
  - `uiSelectors.ts`: UI state selectors

#### `src/web/src/types/`

TypeScript type definitions:

- `common.types.ts`: Shared type definitions
- `auth.types.ts`: Authentication-related types
- `users.types.ts`: User-related types
- `clients.types.ts`: Client-related types
- `services.types.ts`: Service-related types
- `claims.types.ts`: Claim-related types
- `billing.types.ts`: Billing-related types
- `payments.types.ts`: Payment-related types
- `reports.types.ts`: Reporting-related types
- `dashboard.types.ts`: Dashboard-related types
- `settings.types.ts`: Settings-related types
- `notification.types.ts`: Notification-related types
- `api.types.ts`: API-related types
- `ui.types.ts`: UI-related types
- `form.types.ts`: Form-related types
- `chart.types.ts`: Chart-related types
- `theme.types.ts`: Theme-related types
- `index.ts`: Exports all types

#### `src/web/src/utils/`

Utility functions:

- `api.ts`: API utility functions
- `auth.ts`: Authentication utilities
- `date.ts`: Date manipulation utilities
- `string.ts`: String manipulation utilities
- `number.ts`: Number formatting utilities
- `currency.ts`: Currency formatting utilities
- `format.ts`: Data formatting utilities
- `validation.ts`: Form validation utilities
- `file.ts`: File handling utilities
- `print.ts`: Printing utilities
- `export.ts`: Data export utilities
- `storage.ts`: Local storage utilities
- `object.ts`: Object manipulation utilities
- `array.ts`: Array manipulation utilities
- `route.ts`: Routing utilities
- `responsive.ts`: Responsive design utilities
- `test-utils.ts`: Testing utilities

#### `src/web/src/config/`

Configuration settings:

- `api.config.ts`: API client configuration
- `auth.config.ts`: Authentication configuration
- `theme.config.ts`: Theme configuration
- `chart.config.ts`: Chart configuration
- `date.config.ts`: Date formatting configuration
- `navigation.config.ts`: Navigation configuration
- `validation.config.ts`: Validation configuration
- `report.config.ts`: Report configuration
- `dashboard.config.ts`: Dashboard configuration
- `table.config.ts`: Data table configuration
- `seo.config.ts`: SEO configuration
- `index.ts`: Exports all configurations

#### `src/web/src/constants/`

Constant values:

- `api.constants.ts`: API-related constants
- `auth.constants.ts`: Authentication constants
- `claims.constants.ts`: Claims-related constants
- `payments.constants.ts`: Payments-related constants
- `services.constants.ts`: Services-related constants
- `reports.constants.ts`: Reports-related constants
- `dashboard.constants.ts`: Dashboard constants
- `routes.constants.ts`: Route path constants
- `ui.constants.ts`: UI-related constants
- `navigation.constants.ts`: Navigation constants
- `index.ts`: Exports all constants

#### `src/web/src/styles/`

CSS and styling:

- `globals.css`: Global CSS styles
- `components.css`: Component-specific styles
- `nprogress.css`: Progress bar styles
- `print.css`: Print-specific styles
- `theme.ts`: Theme definition

#### `src/web/src/mocks/`

Mock data for development and testing:

- `browser.ts`: Mock service worker for browser
- `server.ts`: Mock service worker for tests
- `handlers.ts`: API mock handlers
- `data/`: Mock data by entity type
  - `auth.ts`: Authentication mock data
  - `claims.ts`: Claims mock data
  - `clients.ts`: Clients mock data
  - `dashboard.ts`: Dashboard mock data
  - `payments.ts`: Payments mock data
  - `reports.ts`: Reports mock data
  - `services.ts`: Services mock data
  - `settings.ts`: Settings mock data

#### `src/web/src/tests/`

Test files:

- `e2e/`: End-to-end tests
- `integration/`: Integration tests
- `unit/`: Unit tests
  - `components/`: Component tests
  - `hooks/`: Hook tests
  - `store/`: Redux store tests
  - `utils/`: Utility function tests
- `utils/`: Test utilities
  - `mock-api.ts`: API mocking utilities
  - `mock-data.ts`: Test data
  - `render-hook.ts`: Hook testing utilities
  - `test-utils.tsx`: Testing utilities

## Infrastructure Code Structure (`infrastructure/`)

Infrastructure as Code (IaC) and deployment configuration.

### Key Infrastructure Directories

#### `infrastructure/docker/`

Docker configuration:

- `docker-compose.yml`: Docker Compose configuration
- `web/`: Frontend Docker configuration
  - `Dockerfile`: Frontend container definition
- `backend/`: Backend Docker configuration
  - `Dockerfile`: Backend container definition
- `proxy/`: Nginx proxy configuration
  - `Dockerfile`: Nginx container definition
  - `nginx.conf`: Nginx configuration

#### `infrastructure/kubernetes/`

Kubernetes manifests:

- `manifests/`: Kubernetes resource definitions
  - `common/`: Shared resources
    - `namespace.yaml`: Namespace definition
  - `web/`: Frontend resources
    - `deployment.yaml`: Frontend deployment
    - `service.yaml`: Frontend service
    - `configmap.yaml`: Frontend configuration
    - `ingress.yaml`: Frontend ingress
  - `backend/`: Backend resources
    - `deployment.yaml`: Backend deployment
    - `service.yaml`: Backend service
    - `configmap.yaml`: Backend configuration
    - `secret.yaml`: Backend secrets
    - `ingress.yaml`: Backend ingress
  - `redis/`: Redis resources
    - `statefulset.yaml`: Redis StatefulSet
    - `service.yaml`: Redis service
  - `monitoring/`: Monitoring resources
    - `prometheus.yaml`: Prometheus configuration
    - `grafana.yaml`: Grafana configuration
    - `alertmanager.yaml`: Alert Manager configuration
    - `loki.yaml`: Loki log aggregation

#### `infrastructure/terraform/`

Terraform IaC:

- `main.tf`: Main Terraform configuration
- `variables.tf`: Variable definitions
- `outputs.tf`: Output definitions
- `modules/`: Terraform modules
  - `networking/`: VPC and networking
  - `eks/`: Kubernetes cluster
  - `rds/`: PostgreSQL database
  - `elasticache/`: Redis cache
  - `s3/`: S3 storage
- `environments/`: Environment-specific configurations
  - `dev/`: Development environment
  - `staging/`: Staging environment
  - `production/`: Production environment

#### `infrastructure/scripts/`

Deployment and maintenance scripts:

- `deploy.sh`: Deployment script
- `database-backup.sh`: Database backup script
- `database-restore.sh`: Database restore script
- `generate-secrets.sh`: Secret generation script

## Key Workflows

### Authentication Flow

1. User enters credentials on the login page (`src/web/src/pages/login.tsx`)
2. Login form submits to auth API (`src/web/src/api/auth.api.ts`)
3. Backend validates credentials (`src/backend/services/auth.service.ts`)
4. JWT token is generated and returned (`src/backend/security/token.ts`)
5. Token is stored in browser and user is redirected to dashboard

### Claims Processing Flow

1. User creates a new claim (`src/web/src/components/claims/ClaimForm.tsx`)
2. Claim data is validated (`src/web/src/utils/validation.ts`)
3. Claim is submitted to API (`src/web/src/api/claims.api.ts`)
4. Backend validates claim data (`src/backend/validation/claim.validation.ts`)
5. Claim is processed by claim service (`src/backend/services/claims.service.ts`)
6. Claim is stored in database (`src/backend/database/repositories/claim.repository.ts`)
7. Claim is submitted to clearinghouse (`src/backend/integrations/clearinghouse.integration.ts`)
8. Claim status is updated and tracked (`src/backend/services/claims/claim-tracking.service.ts`)

### Payment Reconciliation Flow

1. User imports remittance file (`src/web/src/components/payments/RemittanceImport.tsx`)
2. File is uploaded to API (`src/web/src/api/payments.api.ts`)
3. Backend processes remittance file (`src/backend/services/payments/remittance-processing.service.ts`)
4. Payments are matched to claims (`src/backend/services/payments/payment-matching.service.ts`)
5. User reviews and confirms reconciliation (`src/web/src/components/payments/ReconciliationForm.tsx`)
6. Reconciliation is submitted to API (`src/web/src/api/payments.api.ts`)
7. Backend finalizes reconciliation (`src/backend/services/payments/payment-reconciliation.service.ts`)
8. Accounts receivable is updated (`src/backend/services/payments/accounts-receivable.service.ts`)

## Database Schema

The application uses PostgreSQL with the following key tables:

1. `users`: User accounts and authentication
2. `clients`: Client/patient information
3. `services`: Service delivery records
4. `claims`: Healthcare claims
5. `payments`: Payment records
6. `authorizations`: Service authorizations
7. `programs`: Program definitions
8. `payers`: Payer information
9. `facilities`: Facility/location data
10. `documents`: Document storage metadata
11. `roles`: User roles
12. `permissions`: Permissions for access control
13. `audit_logs`: Audit trail entries
14. `notifications`: System notifications
15. `reports`: Report definitions
16. `settings`: System settings

## Security Implementation

The application implements comprehensive security measures:

1. **Authentication**: JWT-based authentication with refresh tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Data Protection**: Encryption at rest and in transit
4. **Input Validation**: Thorough validation of all inputs
5. **HIPAA Compliance**: PHI protection measures
6. **Audit Logging**: Comprehensive audit trail
7. **Session Management**: Secure session handling
8. **Rate Limiting**: Protection against abuse
9. **CORS**: Controlled cross-origin resource sharing
10. **Security Headers**: Helmet for HTTP security headers

## Testing Strategy

The application includes comprehensive testing:

1. **Unit Tests**: Testing individual components and functions
2. **Integration Tests**: Testing interactions between components
3. **End-to-End Tests**: Testing complete user workflows
4. **API Tests**: Testing API endpoints
5. **Performance Tests**: Testing system performance
6. **Security Tests**: Testing for vulnerabilities

## Deployment Process

The application can be deployed using:

1. **Docker Compose**: For simple deployments
2. **Kubernetes**: For production-grade deployments
3. **CI/CD Pipeline**: Automated testing and deployment with GitHub Actions

## Conclusion

The HCBS Revenue Management System is a comprehensive, well-structured application that follows modern best practices for web development. The clear separation of concerns, modular architecture, and comprehensive testing make it maintainable and extensible.

This guide provides a detailed overview of the codebase structure and key components. For more specific implementation details, refer to the individual files and their documentation.

# Development Guidelines

## Development Environment Setup

### Prerequisites

Before starting development on the HCBS Revenue Management System, ensure you have the following tools installed:

- **Node.js 18.16+** - JavaScript runtime environment
- **npm 9.6+** - Node package manager
- **Docker 24.0+** and **Docker Compose** - For containerization and local environment setup
- **PostgreSQL 15.3+** - Primary database
- **Redis 7.0+** - For caching and session management
- **Git** - Version control system
- **Visual Studio Code** (recommended) - Code editor with TypeScript support
- **AWS CLI** - For interacting with AWS services (required for production deployment)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-organization/hcbs-revenue-management.git
   cd hcbs-revenue-management
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd src/backend
   npm install

   # Install frontend dependencies
   cd ../web
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp .env.example .env
   cp src/web/.env.example src/web/.env.local
   ```
   
   Update the environment variables in `.env` and `src/web/.env.local` with your configuration.

4. **Set up the database**
   ```bash
   # Run PostgreSQL and Redis using Docker Compose
   docker-compose up -d

   # Run database migrations
   cd src/backend
   npm run db:migrate
   
   # (Optional) Seed the database with sample data
   npm run db:seed
   ```

## Running the Application

### Backend Development

```bash
cd src/backend
npm run dev
```

This will start the backend server in development mode with hot reloading on http://localhost:3001.

### Frontend Development

```bash
cd src/web
npm run dev
```

This will start the Next.js development server on http://localhost:3000.

### Full Stack Development with Docker

For a complete development environment including all services:

```bash
docker-compose -f docker-compose.dev.yml up
```

This will start the backend, frontend, PostgreSQL, and Redis services in development mode with hot reloading.

## Project Structure

The project follows a modular architecture with clear separation of concerns:

### Backend Structure

```
src/backend/
├── app.ts                  # Express application setup
├── server.ts               # Server entry point
├── config/                 # Configuration files
│   ├── auth.config.ts      # Authentication configuration
│   ├── cors.config.ts      # CORS configuration
│   ├── database.config.ts  # Database configuration
│   ├── logger.config.ts    # Logging configuration
│   ├── redis.config.ts     # Redis configuration
│   └── swagger.config.ts   # API documentation configuration
├── controllers/            # API controllers
├── database/               # Database related code
│   ├── connection.ts       # Database connection setup
│   ├── migrations/         # Database migrations
│   ├── repositories/       # Data access repositories
│   └── seeds/              # Seed data
├── errors/                 # Custom error classes
├── health/                 # Health check endpoints
├── integrations/           # External system integrations
│   ├── adapters/           # Integration adapters
│   └── transformers/       # Data transformers
├── middleware/             # Express middleware
├── models/                 # Database models
├── notifications/          # Notification system
│   └── notification-templates/ # Email and notification templates
├── routes/                 # API routes
├── security/               # Security related code
├── services/               # Business logic services
│   ├── billing/            # Billing related services
│   ├── claims/             # Claims related services
│   └── payments/           # Payment related services
├── tests/                  # Test files
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
├── validation/             # Input validation
│   └── schemas/            # Validation schemas
└── workflows/              # Business process workflows
```

### Frontend Structure

```
src/web/
├── components/             # React components
│   ├── auth/               # Authentication components
│   ├── billing/            # Billing workflow components
│   ├── charts/             # Data visualization components
│   ├── claims/             # Claims management components
│   ├── clients/            # Client management components
│   ├── dashboard/          # Dashboard components
│   ├── forms/              # Form components
│   ├── layout/             # Layout components
│   ├── navigation/         # Navigation components
│   ├── payments/           # Payment components
│   ├── reports/            # Reporting components
│   ├── services/           # Service components
│   ├── settings/           # Settings components
│   └── ui/                 # Reusable UI components
├── config/                 # Frontend configuration
├── constants/              # Application constants
├── context/                # React context providers
├── hooks/                  # Custom React hooks
├── mocks/                  # Mock data for development
├── pages/                  # Next.js pages
│   ├── api/                # API routes
│   ├── auth/               # Authentication pages
│   ├── billing/            # Billing workflow pages
│   ├── claims/             # Claims management pages
│   ├── clients/            # Client management pages
│   ├── dashboard/          # Dashboard pages
│   ├── payments/           # Payment pages
│   ├── reports/            # Reporting pages
│   ├── services/           # Service pages
│   └── settings/           # Settings pages
├── public/                 # Static assets
├── store/                  # Redux state management
│   ├── auth/               # Authentication state
│   ├── claims/             # Claims state
│   ├── clients/            # Clients state
│   ├── dashboard/          # Dashboard state
│   ├── payments/           # Payments state
│   ├── reports/            # Reports state
│   ├── services/           # Services state
│   ├── settings/           # Settings state
│   └── ui/                 # UI state
├── styles/                 # Global styles
├── tests/                  # Test files
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

## Coding Standards

### TypeScript Guidelines

- Use TypeScript for all code to ensure type safety
- Define interfaces and types in dedicated files under the `types/` directory
- Use proper type annotations for function parameters and return values
- Avoid using `any` type unless absolutely necessary
- Use TypeScript's utility types (e.g., `Partial<T>`, `Pick<T>`, `Omit<T>`) when appropriate

### React Guidelines

- Use functional components with hooks instead of class components
- Implement proper component composition to avoid prop drilling
- Use React context for state that needs to be accessed by many components
- Implement proper error boundaries to prevent UI crashes
- Follow the container/presentational pattern where appropriate
- Use React.memo for performance optimization when necessary

### State Management

- Use Redux Toolkit for global state management
- Organize Redux code by feature (slices, selectors, thunks)
- Use React Query for server state management
- Use local state (useState) for component-specific state
- Use React context for theme, authentication, and other cross-cutting concerns

### API Integration

- Use Axios for API requests with proper interceptors for error handling
- Implement proper loading, error, and success states for all API calls
- Use React Query for data fetching, caching, and synchronization
- Implement proper retry logic for failed requests
- Use TypeScript interfaces to define API request and response types

### Styling Approach

- Use Material UI as the component library
- Implement a consistent theme with design tokens
- Use CSS-in-JS with Emotion for component styling
- Implement responsive design using breakpoints
- Follow accessibility guidelines for all UI components

## Testing Strategy

### Unit Testing

```bash
# Run backend unit tests
cd src/backend
npm run test

# Run frontend unit tests
cd src/web
npm run test
```

- Write unit tests for all business logic and utility functions
- Use Jest as the testing framework
- Use React Testing Library for testing React components
- Aim for at least 80% code coverage for critical modules
- Mock external dependencies and API calls

### Integration Testing

```bash
# Run integration tests
cd src/backend
npm run test:integration
```

- Test API endpoints with supertest
- Test database operations with a test database
- Test integration with external systems using mocks
- Verify proper error handling and edge cases

### End-to-End Testing

```bash
# Run E2E tests
cd src/web
npm run test:e2e
```

- Use Cypress for end-to-end testing
- Test critical user flows (authentication, claims submission, payment reconciliation)
- Test across different viewport sizes
- Verify proper error handling and user feedback

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

## Git Workflow

### Branch Naming Convention

- `feature/[feature-name]` - For new features
- `bugfix/[bug-description]` - For bug fixes
- `hotfix/[hotfix-description]` - For critical production fixes
- `refactor/[refactor-description]` - For code refactoring
- `docs/[docs-description]` - For documentation updates

### Commit Message Format

Follow the [Angular Commit Convention](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format):

```
<type>(<scope>): <short summary>
```

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- build: Changes that affect the build system or external dependencies
- ci: Changes to our CI configuration files and scripts

### Pull Request Process

1. Create a feature branch from `develop`
2. Implement your changes with appropriate tests
3. Ensure all tests pass and code meets quality standards
4. Submit a pull request to `develop`
5. Address any review comments
6. Once approved, merge your pull request

## Debugging

### Backend Debugging

- Use the built-in Node.js debugger
- Configure VS Code launch.json for debugging
- Use proper logging with different log levels
- Implement request ID tracking for tracing requests

### Frontend Debugging

- Use React Developer Tools browser extension
- Use Redux DevTools for state debugging
- Implement proper error boundaries and logging
- Use browser developer tools for network and performance debugging

## Performance Optimization

### Backend Performance

- Implement proper database indexing
- Use connection pooling for database connections
- Implement caching for frequently accessed data
- Use streaming for large data transfers
- Implement proper error handling and timeouts

### Frontend Performance

- Implement code splitting and lazy loading
- Optimize bundle size with proper tree shaking
- Use memoization for expensive calculations
- Implement virtualization for long lists
- Use proper image optimization

## Security Best Practices

- Implement proper input validation for all API endpoints
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Use HTTPS for all communications
- Implement proper CORS configuration
- Use Content Security Policy (CSP) headers
- Implement rate limiting for API endpoints
- Regularly update dependencies to address security vulnerabilities

## Deployment Process

### Development Environment

- Automatic deployment from the `develop` branch
- CI/CD pipeline runs tests and builds the application
- Deployed to development environment for testing

### Staging Environment

- Manual promotion from development to staging
- Full integration testing in staging environment
- User acceptance testing (UAT) in staging

### Production Environment

- Manual promotion from staging to production
- Scheduled deployment during off-peak hours
- Proper monitoring and alerting in place
- Rollback plan in case of issues

## Monitoring and Observability

- Use CloudWatch for infrastructure monitoring
- Implement application performance monitoring with New Relic
- Use structured logging with correlation IDs
- Implement proper error tracking with Sentry
- Set up alerts for critical issues
- Implement health checks for all services

## Documentation

- Keep code documentation up to date
- Document API endpoints with Swagger/OpenAPI
- Maintain architecture and design documentation
- Document deployment and operations procedures
- Create user guides and training materials

## Continuous Integration

The project uses GitHub Actions for CI/CD:

- Automated testing on pull requests
- Code quality checks with ESLint and SonarQube
- Security scanning with Snyk and OWASP Dependency Check
- Automated builds and deployments
- Performance testing for critical changes

## Environment Configuration

### Backend Environment Variables

```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/hcbs_revenue
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION=7d
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-document-bucket
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

### Frontend Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=HCBS Revenue Management
NEXT_PUBLIC_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_ENVIRONMENT=development
```

## Troubleshooting Common Issues

### Database Connection Issues

- Verify database credentials in environment variables
- Check database server is running and accessible
- Verify network connectivity and firewall settings
- Check database logs for errors

### API Connection Issues

- Verify API URL in frontend environment variables
- Check CORS configuration in backend
- Verify network connectivity
- Check API logs for errors

### Authentication Issues

- Verify JWT secret and expiration settings
- Check authentication middleware configuration
- Verify user credentials and permissions
- Check authentication service logs

### Build Issues

- Clear node_modules and reinstall dependencies
- Verify Node.js and npm versions
- Check for TypeScript errors
- Verify build configuration

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Next.js Documentation](https://nextjs.org/docs)
- [Material UI Documentation](https://mui.com/material-ui/getting-started/overview/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/introduction/getting-started)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)

# HUMAN INPUTS NEEDED

| Task | Description | Priority | Estimated Hours |
|------|-------------|----------|----------------|
| QA/Bug Fixes | Review generated code for compilation errors, fix package dependency issues, and ensure proper imports across the codebase | High | 40 |
| Environment Configuration | Set up environment variables for development, staging, and production environments including database credentials, API keys, and security settings | High | 8 |
| AWS Infrastructure Setup | Configure AWS resources including EKS, RDS, ElastiCache, S3, CloudFront, and WAF according to the infrastructure code | High | 16 |
| Database Migration Scripts Validation | Review and test database migration scripts to ensure proper schema creation and data integrity | High | 10 |
| Authentication Integration | Configure and test OAuth/OIDC integration with Auth0 or other identity providers | High | 12 |
| HIPAA Compliance Validation | Review and validate all security measures for HIPAA compliance including encryption, access controls, and audit logging | High | 20 |
| Clearinghouse Integration | Set up and configure integration with healthcare clearinghouses for claim submission and status tracking | High | 24 |
| Payment Gateway Integration | Configure payment processing integrations and test end-to-end payment workflows | Medium | 16 |
| EHR/EMR Integration | Set up connections to external Electronic Health Record systems for service data import | Medium | 20 |
| Accounting System Integration | Configure integration with accounting systems for financial data synchronization | Medium | 16 |
| CI/CD Pipeline Setup | Configure GitHub Actions workflows for continuous integration and deployment | Medium | 8 |
| Monitoring and Alerting | Set up CloudWatch, Prometheus, and other monitoring tools with appropriate alerting thresholds | Medium | 12 |
| Performance Testing | Conduct load testing and optimize performance bottlenecks | Medium | 16 |
| Documentation Completion | Complete missing documentation including API docs, deployment guides, and user manuals | Medium | 24 |
| Accessibility Compliance | Test and fix accessibility issues to ensure WCAG 2.1 AA compliance | Medium | 16 |
| Data Seeding | Create realistic test data for development and demo environments | Low | 8 |
| Localization Setup | Configure internationalization support if needed for multi-language deployment | Low | 12 |
| Browser Compatibility Testing | Test application across all required browsers and fix compatibility issues | Low | 8 |
| Mobile Responsiveness | Test and optimize mobile experience across different device sizes | Low | 12 |
| Security Penetration Testing | Conduct security testing to identify and fix vulnerabilities | High | 24 |
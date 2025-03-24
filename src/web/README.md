# HCBS Revenue Management System - Web Frontend

The web frontend for the HCBS Revenue Management System, a comprehensive web application designed to transform financial operations for Home and Community-Based Services (HCBS) providers. This Next.js application provides an intuitive interface for managing revenue cycles, claims, billing, payments, and financial reporting.

## Technology Stack

- **Framework**: Next.js 13.4+ with React 18.2+
- **Language**: TypeScript 4.9+
- **UI Library**: Material UI 5.13+
- **State Management**: Redux Toolkit 1.9+
- **Form Handling**: React Hook Form 7.45+
- **Data Visualization**: Chart.js 4.3+
- **API Client**: Axios 1.4+
- **Authentication**: NextAuth.js 4.22+
- **Testing**: Jest, React Testing Library, Cypress

## Project Structure

```
src/
  ├── api/            # API client and service integrations
  ├── components/     # Reusable UI components
  │   ├── auth/       # Authentication-related components
  │   ├── billing/    # Billing workflow components
  │   ├── charts/     # Data visualization components
  │   ├── claims/     # Claims management components
  │   ├── clients/    # Client management components
  │   ├── dashboard/  # Dashboard components
  │   ├── forms/      # Form components
  │   ├── layout/     # Layout components
  │   ├── navigation/ # Navigation components
  │   ├── payments/   # Payment reconciliation components
  │   ├── reports/    # Reporting components
  │   ├── settings/   # Settings components
  │   └── ui/         # Generic UI components
  ├── config/         # Application configuration
  ├── constants/      # Application constants
  ├── context/        # React context providers
  ├── hooks/          # Custom React hooks
  ├── mocks/          # Mock data and API handlers
  ├── pages/          # Next.js pages
  ├── store/          # Redux store configuration
  ├── styles/         # Global styles
  ├── tests/          # Test utilities and configurations
  ├── types/          # TypeScript type definitions
  └── utils/          # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18.16.0 or higher
- npm 9.6.0 or higher

### Installation

1. Clone the repository
2. Navigate to the web directory: `cd src/web`
3. Install dependencies: `npm install`
4. Copy the environment file: `cp .env.example .env.local`
5. Update the environment variables in `.env.local`

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code using Prettier
- `npm run typecheck` - Check TypeScript types
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run Cypress end-to-end tests
- `npm run test:e2e:open` - Open Cypress test runner
- `npm run analyze` - Analyze bundle size
- `npm run validate` - Run linting, type checking, and tests

## Environment Variables

The application uses the following environment variables:

- `NEXT_PUBLIC_API_BASE_URL` - Base URL for API requests
- `NEXT_PUBLIC_ENVIRONMENT` - Environment name (development, staging, production)
- `NEXT_PUBLIC_ENABLE_MOCK_API` - Enable mock API responses
- `NEXT_PUBLIC_ENABLE_ANALYTICS` - Enable analytics tracking
- `NEXT_PUBLIC_ENABLE_FEATURE_FLAGS` - Enable feature flags
- `NEXTAUTH_URL` - URL for NextAuth.js
- `NEXTAUTH_SECRET` - Secret for NextAuth.js

See `.env.example` for a complete list of environment variables.

## Code Organization

### Component Structure

Components follow a consistent structure:

```tsx
// Import statements
import React from 'react';
import { ComponentProps } from '../../types/component.types';

// Component definition
const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic
  return (
    // JSX markup
  );
};

// Export statement
export default Component;
```

### State Management

The application uses Redux Toolkit for global state management, with slices organized by feature:

- `auth` - Authentication state
- `claims` - Claims management state
- `payments` - Payment reconciliation state
- `reports` - Reporting state
- `dashboard` - Dashboard state
- `settings` - Application settings state
- `ui` - UI state (modals, notifications, etc.)

## Testing

### Unit Testing

Unit tests are written using Jest and React Testing Library. Test files are located next to the components they test, with a `.test.tsx` extension.

```tsx
import { render, screen } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### End-to-End Testing

End-to-end tests are written using Cypress. Test files are located in the `cypress/integration` directory.

```tsx
describe('Feature', () => {
  beforeEach(() => {
    cy.visit('/feature-page');
  });

  it('works as expected', () => {
    cy.get('[data-testid=element]').click();
    cy.get('[data-testid=result]').should('contain', 'Expected Result');
  });
});
```

## Accessibility

The application is designed to meet WCAG 2.1 AA compliance standards. Key accessibility features include:

- Semantic HTML structure
- Keyboard navigation support
- ARIA attributes for interactive elements
- Color contrast compliance
- Screen reader compatibility
- Focus management

Accessibility is tested using:

- axe-core for automated testing
- Manual testing with screen readers
- Keyboard navigation testing

## Performance Optimization

The application implements several performance optimizations:

- Server-side rendering for initial page load
- Code splitting for reduced bundle sizes
- Image optimization
- Lazy loading of off-screen components
- Memoization of expensive calculations
- Virtualized lists for large data sets
- Efficient state management with Redux Toolkit
- API response caching

## Deployment

The application is deployed using a CI/CD pipeline configured with GitHub Actions. The deployment process includes:

1. Code linting and type checking
2. Running unit and integration tests
3. Building the application
4. Running end-to-end tests against the build
5. Deploying to the appropriate environment

Deployment environments:

- Development: Automatic deployment on merge to develop branch
- Staging: Automatic deployment on merge to staging branch
- Production: Manual approval required after merge to main branch

## Browser Compatibility

The application supports the following browsers:

- Chrome 83+
- Firefox 78+
- Safari 14+
- Edge 84+
- iOS Safari 14+
- Android Chrome 83+

## Contributing

### Development Workflow

1. Create a feature branch from `develop`
2. Implement changes with tests
3. Submit a pull request to `develop`
4. Address review feedback
5. Merge after approval

### Code Style

The codebase follows a consistent code style enforced by ESLint and Prettier. Key conventions include:

- TypeScript for all code
- Functional components with hooks
- Named exports for utilities and types
- Default exports for components
- Comprehensive test coverage

### Pull Request Guidelines

- Keep PRs focused on a single feature or bug fix
- Include tests for new functionality
- Update documentation as needed
- Ensure all checks pass before requesting review

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Material UI Documentation](https://mui.com/material-ui/getting-started/overview/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/introduction/getting-started)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
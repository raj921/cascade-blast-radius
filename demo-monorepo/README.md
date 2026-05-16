# Cascade Demo Monorepo

This is a sample microservices monorepo used to demonstrate Cascade's blast-radius analysis capabilities.

## Services

- **Auth Service** (`services/auth/`) - Authentication and token management
- **Billing Service** (`services/billing/`) - Payment processing and invoicing
- **Notifications Service** (`services/notifications/`) - Email notifications

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start services with Docker:
   ```bash
   docker-compose up
   ```

## Testing

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Demo Scenarios

### Demo 1: Signature Change
The `verifyToken` function in `services/auth/index.ts` changes from returning a boolean to returning an object. This breaks multiple callers across services.

### Demo 2: Environment Variable Change
The `SMTP_SERVER` environment variable is renamed to `MAIL_HOST` in `services/notifications/config.ts`, but configuration files still reference the old name.

### Demo 3: Safe Refactor
The `calculateTax` function in `services/billing/utils.ts` is refactored internally without changing its signature or behavior (except for rounding).

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│   Billing   │────▶│     Auth     │
│   Service   │     │   Service    │
└──────┬──────┘     └──────────────┘
       │
       ▼
┌─────────────┐
│Notifications│
│   Service   │
└─────────────┘
```

## License

MIT
# Complete Import and Call Graph

## Repository: Cascade Demo Monorepo

**Generated**: 2026-05-16  
**Purpose**: Power blast-radius analysis for Cascade

---

## Import Graph (JSON)

```json
[
  {
    "from": "services/auth/index.ts",
    "to": "services/auth/validator.ts",
    "imported": ["validate", "extractUserId"],
    "type": "TYPED",
    "line": 1
  },
  {
    "from": "services/billing/checkout.ts",
    "to": "services/auth/index.ts",
    "imported": ["verifyToken"],
    "type": "TYPED",
    "line": 1,
    "cross_service": true
  },
  {
    "from": "services/billing/checkout.ts",
    "to": "services/billing/utils.ts",
    "imported": ["calculateTax", "formatCurrency"],
    "type": "TYPED",
    "line": 2
  },
  {
    "from": "services/billing/invoice.ts",
    "to": "services/auth/index.ts",
    "imported": ["verifyToken"],
    "type": "TYPED",
    "line": 1,
    "cross_service": true
  },
  {
    "from": "services/billing/invoice.ts",
    "to": "services/billing/utils.ts",
    "imported": ["calculateTax"],
    "type": "TYPED",
    "line": 2
  },
  {
    "from": "services/notifications/email.ts",
    "to": "services/notifications/config.ts",
    "imported": ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"],
    "type": "TYPED",
    "line": 1
  }
]
```

---

## Implicit Edges (UNTYPED)

### Environment Variable Dependencies

```json
[
  {
    "from": "services/notifications/config.ts",
    "to": ".env",
    "symbol": "SMTP_SERVER",
    "type": "UNTYPED",
    "mechanism": "process.env",
    "line": 5,
    "risk": "CRITICAL",
    "reason": "Runtime configuration, no compile-time validation"
  },
  {
    "from": "services/notifications/config.ts",
    "to": ".env",
    "symbol": "SMTP_PORT",
    "type": "UNTYPED",
    "mechanism": "process.env",
    "line": 6,
    "risk": "MEDIUM",
    "reason": "Has default value"
  },
  {
    "from": "services/notifications/config.ts",
    "to": ".env",
    "symbol": "SMTP_USER",
    "type": "UNTYPED",
    "mechanism": "process.env",
    "line": 7,
    "risk": "CRITICAL",
    "reason": "Required for email functionality"
  },
  {
    "from": "services/notifications/config.ts",
    "to": ".env",
    "symbol": "SMTP_PASS",
    "type": "UNTYPED",
    "mechanism": "process.env",
    "line": 8,
    "risk": "CRITICAL",
    "reason": "Required for email functionality"
  },
  {
    "from": "services/auth/index.ts",
    "to": ".env",
    "symbol": "JWT_SECRET",
    "type": "UNTYPED",
    "mechanism": "process.env",
    "implicit": true,
    "risk": "CRITICAL",
    "reason": "Required for token validation"
  },
  {
    "from": "services/auth/index.ts",
    "to": ".env",
    "symbol": "JWT_EXPIRY",
    "type": "UNTYPED",
    "mechanism": "process.env",
    "implicit": true,
    "risk": "MEDIUM",
    "reason": "Affects token lifetime"
  }
]
```

### Docker Compose Dependencies

```json
[
  {
    "from": "docker-compose.yml",
    "to": ".env",
    "symbols": ["JWT_SECRET", "JWT_EXPIRY", "SMTP_SERVER", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "DB_NAME", "DB_USER", "DB_PASS"],
    "type": "UNTYPED",
    "mechanism": "environment variable substitution",
    "risk": "HIGH",
    "reason": "Deployment configuration depends on .env values"
  },
  {
    "from": "services/billing",
    "to": "services/auth",
    "symbol": "AUTH_SERVICE_URL",
    "type": "UNTYPED",
    "mechanism": "docker network hostname",
    "value": "http://auth:3000",
    "risk": "HIGH",
    "reason": "Service discovery via docker network"
  }
]
```

### Configuration File Dependencies

```json
[
  {
    "from": "services/auth",
    "to": "tsconfig.json",
    "type": "UNTYPED",
    "mechanism": "TypeScript compilation",
    "risk": "LOW",
    "reason": "Build configuration"
  },
  {
    "from": "services/billing",
    "to": "tsconfig.json",
    "type": "UNTYPED",
    "mechanism": "TypeScript compilation",
    "risk": "LOW",
    "reason": "Build configuration"
  },
  {
    "from": "services/notifications",
    "to": "tsconfig.json",
    "type": "UNTYPED",
    "mechanism": "TypeScript compilation",
    "risk": "LOW",
    "reason": "Build configuration"
  },
  {
    "from": "tests/regression",
    "to": "jest.config.js",
    "type": "UNTYPED",
    "mechanism": "Test configuration",
    "risk": "LOW",
    "reason": "Test runner configuration"
  }
]
```

---

## Cross-Service Edge Analysis

### Typed Cross-Service Edges

1. **Billing → Auth (verifyToken)**
   - **Type**: TYPED (TypeScript function import)
   - **Files**: 
     - `services/billing/checkout.ts:1` → `services/auth/index.ts`
     - `services/billing/invoice.ts:1` → `services/auth/index.ts`
   - **Contract**: `function verifyToken(token: string): boolean`
   - **Risk**: Changes to signature break billing service
   - **Test Coverage**: Unknown (no tests in repo yet)

### Untyped Cross-Service Edges

1. **Docker Network Communication**
   - **From**: Billing service
   - **To**: Auth service
   - **Mechanism**: HTTP over docker network
   - **URL**: `http://auth:3000`
   - **Risk**: Service name or port changes break communication
   - **No compile-time validation**

2. **Environment Variable Propagation**
   - **From**: `.env` file
   - **To**: All services via docker-compose
   - **Mechanism**: Environment variable substitution
   - **Risk**: Missing or renamed variables cause runtime failures
   - **No compile-time validation**

---

## Function Call Graph

### verifyToken() Call Sites

```json
{
  "function": "verifyToken",
  "defined_in": "services/auth/index.ts:7",
  "signature": "function verifyToken(token: string): boolean",
  "callers": [
    {
      "file": "services/billing/checkout.ts",
      "line": 13,
      "function": "processCheckout",
      "usage": "const isValid = verifyToken(token);",
      "cross_service": true
    },
    {
      "file": "services/billing/checkout.ts",
      "line": 30,
      "function": "validatePayment",
      "usage": "if (!verifyToken(token))",
      "cross_service": true
    },
    {
      "file": "services/billing/invoice.ts",
      "line": 11,
      "function": "generateInvoice",
      "usage": "if (!verifyToken(token))",
      "cross_service": true
    },
    {
      "file": "services/auth/index.ts",
      "line": 23,
      "function": "refreshToken",
      "usage": "if (verifyToken(oldToken))",
      "cross_service": false
    }
  ],
  "total_callers": 4,
  "cross_service_callers": 3
}
```

### calculateTax() Call Sites

```json
{
  "function": "calculateTax",
  "defined_in": "services/billing/utils.ts:5",
  "signature": "function calculateTax(amount: number): number",
  "callers": [
    {
      "file": "services/billing/checkout.ts",
      "line": 18,
      "function": "processCheckout",
      "usage": "const tax = calculateTax(amount);",
      "cross_service": false
    },
    {
      "file": "services/billing/invoice.ts",
      "line": 16,
      "function": "generateInvoice",
      "usage": "const tax = calculateTax(subtotal);",
      "cross_service": false
    }
  ],
  "total_callers": 2,
  "cross_service_callers": 0
}
```

### sendEmail() Call Sites

```json
{
  "function": "sendEmail",
  "defined_in": "services/notifications/email.ts:6",
  "signature": "async function sendEmail(to: string, subject: string, body: string): Promise<boolean>",
  "callers": [
    {
      "file": "services/notifications/email.ts",
      "line": 24,
      "function": "sendWelcomeEmail",
      "usage": "await sendEmail(email, 'Welcome!', 'Thank you for signing up.');",
      "cross_service": false
    }
  ],
  "total_callers": 1,
  "cross_service_callers": 0
}
```

---

## Dependency Matrix

| Service | Depends On | Dependency Type | Risk Level |
|---------|-----------|-----------------|------------|
| Auth | validator.ts | TYPED import | LOW |
| Auth | .env (JWT_SECRET) | UNTYPED env var | CRITICAL |
| Billing | auth/index.ts | TYPED import | HIGH |
| Billing | utils.ts | TYPED import | LOW |
| Billing | .env (via docker) | UNTYPED env var | MEDIUM |
| Notifications | config.ts | TYPED import | LOW |
| Notifications | .env (SMTP_*) | UNTYPED env var | CRITICAL |
| All Services | tsconfig.json | Build config | LOW |
| All Services | docker-compose.yml | Deployment | HIGH |

---

## Blast Radius Prediction

### If `verifyToken` signature changes:
- **Direct Impact**: 4 call sites
- **Cross-Service Impact**: 3 call sites in billing service
- **Indirect Impact**: All billing operations fail
- **Risk Level**: 🔴 CRITICAL

### If `SMTP_SERVER` env var renamed:
- **Direct Impact**: 1 code reference
- **Indirect Impact**: docker-compose.yml, .env file
- **Silent Failure**: Email service fails at runtime
- **Risk Level**: 🔴 CRITICAL

### If `calculateTax` implementation changes:
- **Direct Impact**: 2 call sites
- **Cross-Service Impact**: None (internal to billing)
- **Risk Level**: 🟡 MEDIUM (if signature unchanged)

---

## Summary Statistics

- **Total Typed Imports**: 6
- **Total Untyped Dependencies**: 15+
- **Cross-Service Typed Dependencies**: 2 (both Billing → Auth)
- **Cross-Service Untyped Dependencies**: 3+ (docker network, env vars)
- **Critical Functions**: 1 (verifyToken)
- **Environment Variables**: 10+
- **Configuration Files**: 5

---

## Recommendations for Cascade

1. **Monitor `verifyToken` closely** - highest blast radius
2. **Track all env var renames** - no static type checking
3. **Watch docker-compose changes** - affects all services
4. **Flag cross-service imports** - breaking changes cascade
5. **Validate .env completeness** - missing vars cause runtime failures

---

**Graph Complete**  
**Nodes**: 13 source files, 5 config files  
**Typed Edges**: 6  
**Untyped Edges**: 15+  
**Critical Paths**: 2 (verifyToken, SMTP config)
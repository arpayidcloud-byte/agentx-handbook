# Security Standards — agentx Platform

> **Version:** 1.0 | **Status:** Active | **Last Updated:** 2025-07-10  
> **Owner:** Security Working Group  
> **References:** RFC-0021, ADR-0004, ADR-0011, Volume 02, Volume 04, Volume 07, THREAT_MODEL.md

---

## 1. Encryption Standards

### 1.1 Data at Rest
| Standard | Requirement | Scope |
|----------|------------|-------|
| Algorithm | AES-256-GCM | All persisted sensitive data |
| Key Management | Environment variable (v0.1), Vault/KMS (v1.0) | Encryption keys |
| Database Encryption | PostgreSQL TDE or filesystem-level encryption | All database storage |
| File Encryption | Optional for agent workspace artifacts | Tool-generated files |

### 1.2 Data in Transit
| Standard | Requirement | Scope |
|----------|------------|-------|
| Protocol | TLS 1.3 minimum, TLS 1.2 acceptable for local dev | All external and internal HTTP/WS |
| Certificate | Let's Encrypt for public endpoints, self-signed for dev | All services |
| HSTS | Enabled on all public endpoints with 1-year max-age | HTTP responses |
| Internal mTLS | Required for service-to-service communication (v1.0) | Microservice mesh |

### 1.3 Prompt & Response Handling
- LLM provider API calls **must** use HTTPS with certificate verification enabled.
- Sensitive code snippets in prompts should be redacted before sending to external providers (v1.0).
- LLM responses **must** be validated against JSON Schema before processing (04-Schemas).

---

## 2. Secret Management Standards

### 2.1 Prohibited Practices
- **No secrets in source code** — ever. This includes API keys, tokens, passwords, and connection strings.
- **No secrets in git history** — use `git-secrets` or equivalent pre-commit hook.
- **No secrets in logs** — all logging must go through the structured logger with secret masking.

### 2.2 Secret Storage by Version

| Version | Mechanism | Details |
|---------|-----------|---------|
| v0.1 | Environment variables | `AGENTX_OPENAI_API_KEY`, etc. Loaded via `.env` file (gitignored). |
| v1.0 | HashiCorp Vault / AWS Secrets Manager | Dynamic secrets, automatic rotation, audit logging. |

### 2.3 Credential Resolution (Provider Platform)
- Provider credentials follow the `CredentialResolverConfig` schema (04-Schemas/volume-04).
- Strategies: `env-var` (v0.1), `vault` (v1.0), `file` (local dev only), `inline` (tests only).
- Credentials are **never** serialized to the event bus or task graph.

### 2.4 Secret Rotation
- v0.1: Manual rotation via environment variable update + service restart.
- v1.0: Automated rotation via Vault TTL with zero-downtime credential swap.

---

## 3. Authentication Standards

### 3.1 Password Hashing
| Property | Standard |
|----------|----------|
| Algorithm | argon2id (preferred) or bcrypt |
| Argon2 Parameters | memory: 65536 KiB, iterations: 3, parallelism: 4 |
| Bcrypt Cost Factor | 12 minimum |
| Deprecated | MD5, SHA-1, SHA-256 (unsalted) — **never** use |

### 3.2 JSON Web Tokens (JWT)
| Property | Standard |
|----------|----------|
| Algorithm | RS256 (RSA + SHA-256) |
| Key Size | 2048-bit minimum, 4096-bit recommended |
| Token TTL | Access: 15 minutes, Refresh: 24 hours |
| Claims | `sub`, `iat`, `exp`, `roles`, `tenantId` (v1.0) |
| Storage | HttpOnly, Secure, SameSite=Strict cookie (browser); memory (CLI) |

### 3.3 Session Management
| Property | Standard |
|----------|----------|
| Session TTL | 24 hours absolute, 2 hours idle |
| Session Storage | Redis (BullMQ shared instance) |
| Revocation | Token blacklist in Redis with TTL matching token expiry |
| Binding | Session bound to IP range + user-agent hash |

---

## 4. Authorization Standards

### 4.1 Role-Based Access Control (RBAC)
- **Roles:** `operator`, `admin`, `viewer`, `agent` (system role).
- **Principle:** Deny by default. Every endpoint and tool category requires an explicit permission grant.
- **Enforcement:** NestJS guards on every controller route. Tool SDK permission guard on every tool call.

### 4.2 Least Privilege
- Agents receive the minimum tool category permissions for their assigned role.
- Read-only roles (`viewer`) cannot submit tasks or approve actions.
- Service accounts have scoped permissions, never `admin`.

### 4.3 Permission Matrix (Tool Categories)
| Role | fs.read | fs.write | shell.build | shell.exec | git.read | git.write |
|------|---------|----------|-------------|------------|----------|-----------|
| operator | ✅ | ✅ (approval) | ✅ | ✅ (approval) | ✅ | ✅ (approval) |
| agent | ✅ | ✅ (approval) | ✅ | ✅ (approval) | ✅ | ✅ (approval) |
| viewer | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

> `✅ (approval)` means the action requires explicit operator approval per Volume 07.

---

## 5. Input Validation Standards

### 5.1 General Rules
- All external input must be validated at the API boundary using NestJS DTOs with `class-validator`.
- JSON Schema validation (04-Schemas) must be used for event payloads on the bus.
- Reject unknown properties (`forbidNonWhitelisted: true` in NestJS validation pipe).

### 5.2 Specific Constraints
| Field Type | Validation |
|------------|-----------|
| Task goal | 1–10,000 characters, no control characters |
| Agent role | Pattern: `^[a-z][a-z0-9-]*$` |
| Provider ID | Pattern: `^[a-z][a-z0-9-]*$` |
| Tool name | Pattern: `^[a-zA-Z][a-zA-Z0-9_.-]*$` |
| UUIDs | RFC 4122 format validation |
| Pagination cursor | Base64-encoded, validated on decode |

### 5.3 Prompt Input Sanitization
- Strip zero-width characters and control sequences from task goals.
- Limit total prompt length to provider model's context window (minus safety margin).
- Flag task goals containing patterns matching known injection attacks (logged, not blocked in v0.1).

---

## 6. Dependency Vulnerability Management

### 6.1 Scanning
- `npm audit` must pass with zero high/critical vulnerabilities before merge.
- GitHub Dependabot enabled for all direct dependencies.
- Snyk or equivalent SCA tool integrated in CI pipeline (v1.0).

### 6.2 Response SLA
| Severity | SLA | Action |
|----------|-----|--------|
| Critical (CVSS ≥ 9.0) | 24 hours | Emergency patch or pin + workaround |
| High (CVSS 7.0–8.9) | 7 days | Patch in next sprint |
| Medium (CVSS 4.0–6.9) | 30 days | Address in normal backlog |
| Low (CVSS < 4.0) | 90 days | Best-effort |

### 6.3 Lockfile Integrity
- `package-lock.json` must be committed and validated via `npm ci`.
- Integrity hashes verified on every install.
- No `npm install <package>` without version pin in production.

---

## 7. Security Review Checklist

Every PR touching security-sensitive code must pass:

- [ ] No secrets in code, config, or logs
- [ ] Input validation on all new endpoints/parameters
- [ ] Authentication and authorization guards present
- [ ] SQL queries use parameterized binding (Prisma default)
- [ ] No `eval()`, `Function()`, or `child_process.exec()` without sandboxing
- [ ] Error messages do not leak stack traces or internal details
- [ ] New dependencies scanned for known vulnerabilities
- [ ] Tool category permissions updated if new tools added
- [ ] Audit events emitted for state-changing operations
- [ ] Rate limiting configured for new public endpoints

---

## 8. Incident Classification

| Severity | Definition | Response Time | Examples |
|----------|-----------|---------------|---------|
| **SEV1** | Active breach, data exfiltration, or full service outage | 15 minutes | Prompt injection exploited, credentials leaked, production DB compromised |
| **SEV2** | Security vulnerability exploited with limited impact, partial outage | 1 hour | Sandbox escape attempted, unauthorized task submission, provider API key exposed in logs |
| **SEV3** | Potential vulnerability discovered, no active exploitation | 4 hours | CVE found in dependency, misconfigured CORS, missing auth on internal endpoint |
| **SEV4** | Policy violation or minor security finding | 24 hours | Missing security headers, verbose error in non-sensitive endpoint |

**Escalation:** See `09-Runbooks/incident-response.md` and `09-Runbooks/security-incident-response.md`.

---

## 9. References

| Document | Section Relevance |
|----------|------------------|
| RFC-0021 | Security Architecture — overarching design |
| ADR-0004 | Tool Sandboxing — tool zone encryption/isolation |
| ADR-0011 | Append-Only Audit — repudiation controls |
| THREAT_MODEL.md | Full threat catalog and STRIDE analysis |
| Volume 02 Ch. 4 | Event system security (EventEnvelope validation) |
| Volume 04 Ch. 2 | Provider credential management |
| Volume 07 Ch. 3 | Permission guard and destructive classification |
| 04-Schemas/ | Machine-validatable input/output contracts |
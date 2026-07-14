# Security Incident Response Runbook

> **Version:** 1.0 | **Owner:** Security Working Group  
> **Related:** SECURITY_STANDARDS, THREAT_MODEL.md, incident-response.md

---

## 1. Security Incident Types

| Type | Description | Initial Severity |
|------|-------------|-----------------|
| **Prompt Injection Exploited** | Malicious instructions in task goal caused unauthorized actions | SEV1 |
| **Credential Exposure** | API key, token, or password leaked in logs, responses, or repos | SEV1 |
| **Sandbox Escape** | Tool execution bypassed sandbox controls | SEV1 |
| **Unauthorized Access** | Unauthenticated user accessed protected endpoints | SEV1 |
| **Data Exfiltration** | Agent data or audit logs accessed by unauthorized party | SEV1 |
| **Dependency Vulnerability** | CVE in direct/transitive dependency | SEV2–SEV3 |
| **Misconfiguration** | Security setting disabled or misconfigured (CORS, auth, RBAC) | SEV2–SEV3 |
| **Supply Chain** | Compromised npm package or plugin | SEV1–SEV2 |

---

## 2. Containment Procedures

### 2.1 Immediate Actions (First 15 Minutes)

```
1. ISOLATE
   - Block external access: disable ingress or change DNS
   - Pause task scheduler: POST /api/v1/scheduler/pause
   - Stop all agent execution

2. PRESERVE
   - Do NOT restart services or clear logs
   - Snapshot PostgreSQL: pg_dump -Fc agentx_db > /evidence/pg-snapshot.dump
   - Snapshot Redis: cp /var/lib/redis/dump.rdb /evidence/redis-snapshot.rdb
   - Export relevant audit logs:
     psql -c "SELECT * FROM audit_events WHERE created_at > NOW() - INTERVAL '24h'" \
       -o /evidence/audit-24h.csv

3. CREDENTIALS
   - Rotate any potentially exposed credentials immediately
   - If provider API key leaked: regenerate in provider console, update env/vault
   - If JWT secret leaked: regenerate, invalidate all active sessions
```

### 2.2 Scope Assessment

```
1. Query audit logs for the attacker's traceId
2. List all tasks created/executed during the window
3. Identify all tool calls made (especially shell.exec, fs.write, git.write)
4. Check for file modifications outside expected working directories
5. Verify no data was written to external services
```

---

## 3. Forensic Data Collection

### 3.1 Logs to Collect

| Source | Location | Retention |
|--------|----------|-----------|
| Application logs | PM2/structured logs | 30 days |
| PostgreSQL audit_events | Database table | Indefinite |
| Redis command log | /var/log/redis/ | 7 days |
| Provider API logs | Cloud provider console | Variable |
| Filesystem changes | `git status`, `find -mtime -1` | N/A |
| Network logs | Firewall / proxy logs | 7 days |

### 3.2 Evidence Chain

1. Copy all evidence to `/evidence/` directory (not on the affected machine if possible).
2. Generate SHA-256 checksums: `sha256sum /evidence/* > /evidence/checksums.sha256`
3. Document collection timestamp, collector identity, and method.
4. Do NOT modify evidence after collection.

---

## 4. Communication

### 4.1 Internal Communication

| Audience | Timing | Channel | Content |
|----------|--------|---------|---------|
| Engineering Team | Immediate | #security-incidents (private) | Incident type, scope, containment status |
| Leadership | Within 1 hour | Direct message + email | Executive summary, business impact, ETA |
| All Company | Within 4 hours | #announcements | High-level summary, what to expect |

### 4.2 External Communication

| Audience | Timing | Channel | Approver |
|----------|--------|---------|----------|
| Affected Users | As needed | Email / status page | Engineering Director |
| Public (if required) | After legal review | Blog / press | Legal + Executive |
| Provider Vendors | As needed | Support ticket | Platform Team |

**Important:** Do NOT commit details to public repositories during an active incident.

---

## 5. Post-Incident Security Review

Conducted within 72 hours of incident resolution:

### 5.1 Review Checklist

- [ ] Root cause identified (5-Whys)
- [ ] Attack vector fully understood
- [ ] All affected systems identified
- [ ] No lingering attacker access confirmed
- [ ] All exposed credentials rotated
- [ ] Security control gaps documented
- [ ] Threat catalog updated (THREAT_MODEL.md) with new entries
- [ ] ADR drafted if architectural change needed
- [ ] Detection rule added for recurrence
- [ ] Runbook updated with lessons learned
- [ ] PIR published to `09-Reviews/`

### 5.2 Follow-Up Actions

| Action | Owner | Deadline |
|--------|-------|----------|
| Update THREAT_MODEL.md with new threat | Security WG | 1 week |
| Add regression test for exploit vector | Engineering | 1 sprint |
| Implement missing security control | Engineering | Per ADR |
| Schedule security training if human error | Team Lead | 1 month |
| Update this runbook | Security WG | 1 week |
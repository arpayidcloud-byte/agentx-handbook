# Incident Response Runbook

> **Version:** 1.0 | **Owner:** On-Call Team  
> **Related:** SECURITY_STANDARDS §8, security-incident-response.md

---

## 1. Incident Classification

| Severity | Criteria | Response SLA | Comms SLA |
|----------|----------|-------------|-----------|
| **SEV1** | Active breach, data exfiltration, full platform outage | 15 min acknowledge, 1 hour mitigate | Immediate — all stakeholders |
| **SEV2** | Partial outage, single module down, security vuln exploited | 1 hour acknowledge, 4 hours mitigate | Within 1 hour — affected teams |
| **SEV3** | Degraded performance, potential vulnerability found | 4 hours acknowledge, 24 hours mitigate | Next business day |
| **SEV4** | Minor issue, policy violation, non-critical bug | 24 hours acknowledge | Weekly digest |

---

## 2. Response Workflow

### 2.1 SEV1 — Critical

```
1. ALERT  → On-call receives page (PagerDuty / equivalent)
2. ACK    → Acknowledge within 15 minutes
3. ASSESS → Determine blast radius:
            - Is it a security incident? → engage security-incident-response.md
            - Is it an infrastructure issue? → continue below
4. TRIAGE → Identify affected module (use traceId from alerts)
5. CONTAIN → Immediate containment:
            - Scale up affected service if resource exhaustion
            - Enable circuit breaker on failing provider
            - Pause task scheduler (POST /api/v1/scheduler/pause)
6. MITIGATE → Apply fix:
            - Restart failed service
            - Failover to secondary provider
            - Rollback deployment (see rollback-procedures.md)
7. VERIFY  → Confirm service health:
            - Check /api/v1/health endpoints
            - Verify task processing resumes
            - Monitor error rates for 30 minutes
8. RESOLVE → Close incident, update status page
```

### 2.2 SEV2 — High

```
1. ALERT  → Slack notification + on-call page
2. ACK    → Acknowledge within 1 hour
3. ASSESS → Determine impact scope
4. MITIGATE → Apply targeted fix
5. VERIFY  → Confirm fix
6. RESOLVE → Close incident
```

### 2.3 SEV3/SEV4

```
1. Create issue in backlog with severity label
2. Assess in next sprint planning
3. Resolve per normal development workflow
```

---

## 3. Escalation Path

```
Level 1: On-Call Engineer (15 min response)
  ↓ 30 min unresolved or SEV1
Level 2: Tech Lead + Platform Team (15 min response)
  ↓ 1 hour unresolved or active breach
Level 3: Engineering Director + Security WG (immediate)
  ↓ Data exfiltration confirmed
Level 4: Executive Team + Legal (immediate)
```

---

## 4. Communication Template

### Internal Slack (SEV1/SEV2)

```
🔴 **SEV{N} Incident: {short description}**

**Status:** {Investigating | Mitigating | Monitoring | Resolved}
**Started:** {timestamp} UTC
**Duration:** {elapsed}
**Affected:** {modules/services}
**Impact:** {what users experience}
**traceId:** {if available}
**Next Update:** {time}
**Incident Channel:** #incidents-{id}
```

### Status Page Update

```
**[Monitoring] {Service Name} — {Issue Summary}**
We are investigating reports of {symptom}. Updates will be posted every 30 minutes.
Started: {timestamp} UTC
```

---

## 5. Post-Incident Review

Conducted within 48 hours for SEV1/SEV2, 1 week for SEV3:

1. **Timeline:** Reconstruct incident timeline from audit logs (traceId-based).
2. **Root Cause:** 5-Whys analysis.
3. **Action Items:** Assign owners and deadlines for each corrective action.
4. **Blameless:** Focus on system improvements, not individual blame.
5. **Document:** Publish PIR to `09-Reviews/` directory.
6. **Track:** Add action items to engineering backlog with `security` or `reliability` label.

### PIR Template

| Field | Content |
|-------|---------|
| Incident ID | INC-{YYYY}-{NNN} |
| Date | |
| Severity | |
| Duration | |
| Summary | |
| Root Cause | |
| Impact | |
| Action Items | [{owner, action, deadline}] |
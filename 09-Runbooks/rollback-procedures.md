# Rollback Procedures Runbook

> **Version:** 1.0 | **Owner:** Platform Team  
> **Related:** disaster-recovery.md, incident-response.md

---

## 1. Task Graph Rollback

### Scenario: Corrupted task graph after failed decomposition or state bug.

```bash
# 1. Identify affected tasks (via traceId or time range)
psql -d agentx_db -c "
  SELECT id, goal, state, created_at
  FROM tasks
  WHERE trace_id = 'YOUR_TRACE_ID'
  ORDER BY created_at;
"

# 2. Cancel all subtasks of a parent task
psql -d agentx_db -c "
  UPDATE tasks
  SET state = 'Cancelled', updated_at = NOW()
  WHERE id IN (
    SELECT id FROM tasks WHERE parent_task_id = 'PARENT_TASK_ID'
  ) AND state NOT IN ('Completed', 'Cancelled');
"

# 3. Reset parent task to Queued for re-processing
psql -d agentx_db -c "
  UPDATE tasks
  SET state = 'Queued', updated_at = NOW()
  WHERE id = 'PARENT_TASK_ID';
"

# 4. Publish task state change events for audit
# (Application-level: emit TaskStateChangedEvent for each affected task)
```

### Safety: Always take a backup before modifying task state directly.

---

## 2. Database Migration Rollback

### Scenario: Prisma migration caused data loss or schema incompatibility.

```bash
# 1. Stop application
pm2 stop all

# 2. Rollback last N migrations
npx prisma migrate rollback   # rolls back 1 migration
# Repeat for each migration to undo, or:
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# 3. Verify schema
npx prisma migrate status
psql -d agentx_db -c "\dt"   # list tables

# 4. Restart application
pm2 start all

# 5. Verify health
curl -s http://localhost:3000/api/v1/health | jq .
```

### If rollback fails:
1. Restore from last known-good backup (see disaster-recovery.md §3.1).
2. Do NOT attempt manual schema edits in production.

---

## 3. Configuration Rollback

### Scenario: Bad configuration change causes service failure.

```bash
# 1. Identify last known-good commit
git log --oneline -10 -- config/

# 2. Revert configuration files
git checkout PREVIOUS_COMMIT -- .env.production
git checkout PREVIOUS_COMMIT -- agentx.config.json

# 3. If using vault (v1.0), restore secret versions
# vault kv metadata get -version=2 secret/agentx/config

# 4. Restart services with restored config
pm2 restart all

# 5. Verify
pm2 logs --lines 50
curl -s http://localhost:3000/api/v1/health | jq .
```

### Environment variable changes:
1. `.env` files are not version-controlled directly.
2. Restore from encrypted backup: `gpg --decrypt .env.production.gpg > .env.production`
3. Restart services.

---

## 4. Provider Failback Procedures

### Scenario: Primary provider (e.g. OpenAI) was down, system failed over to secondary (e.g. Anthropic). Primary is now healthy.

```bash
# 1. Verify primary provider health
curl -s https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | jq '.data[0].id'

# 2. Reset provider health status via API
curl -X POST http://localhost:3000/api/v1/providers/openai/health \
  -H "Content-Type: application/json" \
  -d '{"status": "healthy"}'

# 3. New tasks will route to primary provider automatically.
#    In-flight tasks on secondary will complete naturally.

# 4. Monitor provider routing
curl -s http://localhost:3000/api/v1/providers | jq '.[] | {id, healthStatus}'

# 5. Verify cost tracking is using correct ProviderCostEntry
psql -d agentx_db -c "
  SELECT provider_id, COUNT(*), SUM(latency_ms) as total_latency
  FROM provider_call_events
  WHERE created_at > NOW() - INTERVAL '1 hour'
  GROUP BY provider_id;
"
```

### Note: There is no forced migration of in-flight tasks between providers. Tasks complete on whichever provider they started on. New tasks use the primary once marked healthy.
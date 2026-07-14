# Disaster Recovery Runbook

> **Version:** 1.0 | **Owner:** Platform Team  
> **Related:** incident-response.md, rollback-procedures.md

---

## 1. RPO/RTO Targets

| Component | RPO | RTO | Notes |
|-----------|-----|-----|-------|
| PostgreSQL | 1 minute | 15 minutes | Streaming replication |
| Redis (BullMQ) | 0 (replicated) | 5 minutes | Redis Sentinel / Cluster |
| Task State (in PG) | 1 minute | 15 minutes | Part of PostgreSQL |
| Audit Log (in PG) | 0 (append-only) | 15 minutes | No data loss tolerance |
| Configuration Files | 0 (git) | 5 minutes | Version-controlled |
| Provider Credentials | 0 (vault/env) | 10 minutes | Re-resolve from source |
| Agent Workspace Files | 1 hour | 1 hour | Best-effort, user data |

---

## 2. Backup Procedures

### 2.1 PostgreSQL

```bash
# Full daily backup (cron: 02:00 UTC)
pg_dump -Fc -f /backups/pg/agentx-$(date +%Y%m%d).dump agentx_db

# Retain: 30 daily, 12 weekly, 6 monthly
find /backups/pg/ -name "*.dump" -mtime +30 -delete
```

### 2.2 Redis

```bash
# Redis RDB snapshots (configured in redis.conf)
# save 900 1     — snapshot after 1 write in 15 min
# save 300 10    — snapshot after 10 writes in 5 min
# save 60 10000  — snapshot after 10k writes in 1 min
# Copy RDB to backup location hourly
cp /var/lib/redis/dump.rdb /backups/redis/dump-$(date +%Y%m%d-%H%M).rdb
```

### 2.3 Configuration

```bash
# Configuration is version-controlled in the agentx repository
# Backup .env files separately (encrypted)
gpg --encrypt --recipient ops@agentx.dev .env.production
cp .env.production.gpg /backups/config/
```

---

## 3. Restore Procedures

### 3.1 PostgreSQL Restore

```bash
# 1. Stop application services
pm2 stop all

# 2. Drop and recreate database
dropdb agentx_db
createdb agentx_db

# 3. Restore from backup
pg_restore -d agentx_db /backups/pg/agentx-YYYYMMDD.dump

# 4. Verify data integrity
psql -d agentx_db -c "SELECT COUNT(*) FROM tasks;"
psql -d agentx_db -c "SELECT COUNT(*) FROM audit_events;"
psql -d agentx_db -c "SELECT MAX(created_at) FROM audit_events;"

# 5. Run pending migrations
npx prisma migrate deploy

# 6. Restart services
pm2 start all
```

### 3.2 Redis Restore

```bash
# 1. Stop Redis
systemctl stop redis

# 2. Replace RDB file
cp /backups/redis/dump-YYYYMMDD-HHMM.rdb /var/lib/redis/dump.rdb
chown redis:redis /var/lib/redis/dump.rdb

# 3. Start Redis
systemctl start redis

# 4. Verify queue recovery
redis-cli LLEN bull:agentx:tasks
```

---

## 4. DR Drill Schedule

| Drill Type | Frequency | Scope |
|-----------|-----------|-------|
| Backup Verification | Weekly (automated) | Verify backup files exist, non-zero size, can be decrypted |
| PostgreSQL Restore Test | Monthly | Restore to staging, run smoke tests |
| Redis Restore Test | Monthly | Restore RDB, verify queue contents |
| Full DR Simulation | Quarterly | Simulate total primary failure, failover to DR site |
| Tabletop Exercise | Quarterly | Walk through SEV1 scenarios with team |

---

## 5. Failover Procedures

### Single-Node Failure

1. Monitoring detects node unresponsive (health check fails 3x).
2. If Redis Sentinel: automatic failover to replica.
3. If PostgreSQL: promote streaming replica (if configured).
4. Verify application connectivity.
5. Replace failed node and rejoin cluster.

### Total Primary Failure (DR Site)

1. Activate DR site DNS (update `api.agentx.dev` TTL to 60s, then point to DR).
2. DR site PostgreSQL replica promoted to primary.
3. DR site Redis becomes active.
4. Verify all services healthy at DR site.
5. Communicate failover to stakeholders.
6. Post-failover: investigate root cause, prepare to failback.
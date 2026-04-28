# Database Backup Strategy

## Current Setup

Vibe Check uses **Supabase** (hosted PostgreSQL) for all persistent data.

### Supabase Backup Cadence

| Supabase Plan | Backup Frequency | Retention | Point-in-Time Recovery |
|---------------|-----------------|-----------|----------------------|
| Free          | Daily           | 7 days    | No                   |
| Pro ($25/mo)  | Daily           | 7 days    | Yes (up to 7 days)   |
| Team ($599/mo)| Daily           | 14 days   | Yes (up to 14 days)  |

### Recovery Targets

- **RPO (Recovery Point Objective):** 24 hours (free plan) / minutes (Pro with PITR)
- **RTO (Recovery Time Objective):** < 1 hour

## Restoration Procedure

### From Supabase Dashboard (Free/Pro)

1. Go to **Database > Backups** in the Supabase dashboard
2. Select the backup you want to restore from
3. Click **Restore** — this replaces the current database entirely
4. Verify via the app that sessions and reports are accessible

### Point-in-Time Recovery (Pro plan only)

1. Go to **Database > Backups > Point in Time**
2. Select the exact timestamp to restore to
3. Confirm — database is restored to that state
4. Verify user data integrity

## Mitigation (Free Tier)

If running on the Supabase free tier:

1. **Weekly manual export**: Run `pg_dump` via the Supabase CLI:
   ```bash
   pnpm dlx supabase db dump --linked > backups/$(date +%Y%m%d).sql
   ```
2. Store exports in a secure location (encrypted cloud storage)
3. Test restoration quarterly by importing into a fresh Supabase project

## Data Classification

| Table | Criticality | Notes |
|-------|-------------|-------|
| users | HIGH | Billing state, subscription tier |
| sessions | HIGH | User's validated ideas + reports |
| messages | MEDIUM | Interview chat history |
| reports | HIGH | Generated analysis (expensive to regenerate) |
| red_team_reports | LOW | Can be regenerated |
| competitors | LOW | Can be re-fetched from Tavily |
| tavily_cache | LOW | Ephemeral cache, 7-day TTL |
| stripe_events | LOW | Idempotency table, 7-day TTL |

## Monitoring

- Check Supabase dashboard weekly for backup status
- Set up Supabase email alerts for backup failures (available on Pro)
- Monitor database size to ensure it stays within plan limits

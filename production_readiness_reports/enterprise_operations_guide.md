# Denti-Choice SaaS Platform - Enterprise Operations & Disaster Recovery Guide

This operations guide outlines the production topology, query indexing updates, backup scripts, restore routines, and failure mitigation runbooks for the Denti-Choice B2B SaaS Platform.

---

## 🏗️ 1. Platform Folder Architecture

```
Dentist-App/
├── client/                      # Frontend SPA React Application
│   ├── src/
│   │   ├── components/          # Reusable layouts and widgets
│   │   ├── hooks/               # Custom context hooks (auth, theme, settings)
│   │   ├── pages/               # Views (Dashboard, Super Admin, settings)
│   │   └── services/            # Axios API wrappers
├── server/                      # Express REST API Backend Node Application
│   ├── ai/                      # AI foundations (receptionist prompts, logs)
│   ├── config/                  # DB connection pool, swagger configurations
│   ├── controllers/             # Request handlers (auth, clinic, billing, super-admin)
│   ├── database/                # Schema definitions, seeders, SQL migrations
│   ├── middlewares/             # Error handlers, tenant context verification
│   ├── models/                  # Active records models mapping MySQL tables
│   ├── routes/                  # API routing maps
│   ├── scheduler/               # Cron jobs (notifications queue processor)
│   ├── services/                # Feature access gating, auditing logs, billing
│   └── whatsapp/                # Reusable WhatsApp platform module
```

---

## 💾 2. MySQL Query Optimization & Indexing

To support high concurrent tenants queries without lookup locks, the following indexes are configured:

```sql
-- Fast appointment calendar loading
ALTER TABLE appointments ADD INDEX idx_appt_clinic_date (clinic_id, appointment_date);

-- Fast billing invoice query lookup
ALTER TABLE invoices ADD INDEX idx_inv_clinic_date (clinic_id, created_at);

-- Tenant WhatsApp campaigns query lookup
ALTER TABLE whatsapp_messages ADD INDEX idx_wa_clinic_status (clinic_id, status);

-- Audit trails query speedup
ALTER TABLE audit_logs ADD INDEX idx_audit_clinic_action (clinic_id, action_type);
```

---

## 🛡️ 3. Backup Runbook

To back up tenant database records and uploaded media folders to a secure remote storage bucket, run the backup utility script.

### Database Export Command
```bash
mysqldump -h mysql-203d5dd6-vedantsathawane2503-denti-choice.i.aivencloud.com \
  -u avnadmin -p --single-transaction --quick --lock-tables=false \
  denti_choice_db > backups/db_backup_$(date +%F).sql
```

### Media Uploads Directory Sync
```bash
tar -czf backups/media_backup_$(date +%F).tar.gz server/uploads/
```

---

## 🔄 4. Disaster Recovery Restore Runbook

In the event of database corruption or primary infrastructure outages, proceed with the recovery runbook.

### Step 1: Clean and Reinitialize Target Database Schema
```bash
# Run the platform boot migrator script to build schemas
node server/database/migrate.js
```

### Step 2: Restore Database Records
```bash
mysql -h mysql-203d5dd6-vedantsathawane2503-denti-choice.i.aivencloud.com \
  -u avnadmin -p denti_choice_db < backups/db_backup_YYYY-MM-DD.sql
```

### Step 3: Unpack Tenant Media Folders
```bash
tar -xzf backups/media_backup_YYYY-MM-DD.tar.gz -C /
```

---

## 🚨 5. Troubleshooting Common Outages

| Outage Scenario | Diagnostic Check | Remediation Command |
| :--- | :--- | :--- |
| **MySQL Pool Exhaustion** | Check logs: `Connection limit reached` | Increase `connectionLimit` in `server/config/db.js` |
| **WhatsApp Queue Backlog** | Check queue status: `SELECT COUNT(*) FROM whatsapp_queue WHERE status = 'queued'` | Restart background cron scheduler service: `npm run start` |
| **Vercel Frontend CORS** | Check headers: `Origin not allowed` | Verify `FRONTEND_URL` matches in backend `.env` configuration |
| **Gemini AI Call Failures** | Check AI logs: `API key quota exceeded` | Rotate Gemini API token credentials key |

# Database Migration Report

## Overview
This migration updates the Dentist-Choice single-tenant database into a multi-tenant enterprise SaaS schema supporting multiple clinic spaces, pricing tiers, payment billing logs, central notification dispatches, and token usage limits.

## Executed Scripts
- `server/database/saas_extended.sql`: Upgrades schema tables and columns.
- `server/database/migrate.js`: Auto-execution script mapping existing records to the default clinic (ID = 1).

## Schema Modifications

### 1. Staged Reminder Auditing
Adds three interval reminder states directly to the `appointments` table to prevent sending duplicate notifications:
```sql
ALTER TABLE appointments
  ADD COLUMN reminder_24h_sent TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN reminder_24h_sent_at DATETIME DEFAULT NULL,
  ADD COLUMN reminder_2h_sent TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN reminder_2h_sent_at DATETIME DEFAULT NULL,
  ADD COLUMN reminder_30m_sent TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN reminder_30m_sent_at DATETIME DEFAULT NULL;
```

### 2. Coupon Discounts (`coupons` Table)
Stores pricing discount percentages applicable to plans:
- `id` (INT Auto-Increment PK)
- `code` (VARCHAR, Unique index)
- `discount_percent` (DECIMAL)
- `is_active` (TINYINT)
- `expires_at` (DATETIME)

### 3. GST Invoice Logs (`invoices` Table)
Maintains tax invoice logs for clinic subscription purchases:
- `id` (INT Auto-Increment PK)
- `clinic_id` (INT, FK referencing `clinics.id` ON DELETE CASCADE)
- `invoice_number` (VARCHAR, Unique index)
- `amount` (DECIMAL, pre-tax amount)
- `gst_amount` (DECIMAL, computed tax)
- `gst_percent` (DECIMAL, standard 18.00%)
- `status` (VARCHAR, payment state)
- `payment_method` (VARCHAR)

### 4. Notification Log History (`notification_history` Table)
Maintains central history of dispatches across channels with status auditing:
- `id` (INT Auto-Increment PK)
- `clinic_id` (INT, FK referencing `clinics.id` ON DELETE CASCADE)
- `recipient` (VARCHAR, destination address)
- `channel` (VARCHAR, email/whatsapp/sms/push/socket)
- `title` (VARCHAR)
- `message` (TEXT)
- `status` (VARCHAR, pending/delivered/failed/read)
- `error_message` (TEXT, captures API connection failures)

## Execution Status
- **Status**: Completed successfully.
- **Verification**: Local TiDB/Aiven MySQL table mapping executed without failure.

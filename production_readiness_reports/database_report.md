# Database Integrity & Audit Report

## 1. Engine & Configuration
- **Database Service**: Aiven MySQL 8.0 Cloud Instance.
- **Connection Pools**: Configured dynamically in `server/config/db.js` using `mysql2/promise`:
  *   `waitForConnections: true`
  *   `connectionLimit: 10`
  *   `queueLimit: 0`

## 2. Table Integrity Checks

### Indexes
Primary indexes are defined on all query query columns to optimize performance:
- `appointments` table has foreign key indexes on `clinic_id`, `patient_id`, `doctor_id`, and `service_id`.
- `clinic_settings` uses a unique key constraint `uk_clinic_setting (clinic_id, setting_key)` to prevent duplicate settings rows.
- `invoices` table uses `clinic_id` indexes to prevent leaks when listing payment histories.

### Constraints & Actions
- **Cascade Deletes**: Tables (like `invoices`, `notification_history`, `appointments`) use `ON DELETE CASCADE` actions. Removing a clinic tenant safely deletes associated database records automatically, maintaining data integrity.
- **Null Safety**: Unique constraints on emails are defined on the `doctors` and `patients` tables.

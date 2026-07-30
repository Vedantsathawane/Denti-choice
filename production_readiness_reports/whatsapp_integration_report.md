# WhatsApp Integration Report

## 1. Overview
We have upgraded the multi-tenant notification system to utilize **Meta's Official WhatsApp Cloud API** (running on version `v18.0` or higher). All transactional notifications (confirmations, reschedules, cancellations, payment receipts, and reminders) map directly to structured Meta templates.

---

## 2. Dynamic Configurations Setup
Integrations are fully configurable via the SaaS settings table or fallback environment variables:
- `WHATSAPP_ACCESS_TOKEN`: Secure authentication token.
- `WHATSAPP_PHONE_NUMBER_ID`: Unique ID matching the clinic sender number.
- `WHATSAPP_VERIFY_TOKEN`: Verification token matching incoming Webhook challenges.
- `WHATSAPP_API_VERSION`: Graph API endpoint version (default: `v18.0`).
- `WHATSAPP_WEBHOOK_SECRET`: Secure secret to verify SHA256 HMAC payload signatures.

---

## 3. Webhook Routing Specification
Incoming patient actions (such as replying `1 Confirm` or `2 Reschedule`) are handled at `POST /api/notifications/whatsapp/webhook`:
1.  **Verification challenge**: Challenges are verified dynamically using the verification token.
2.  **Payload Signature Auditing**: Decodes webhook headers to verify signatures using the webhook secret.
3.  **Inbound Log Processing**: Saves client conversation flows directly to `whatsapp_conversations`.
4.  **AI Receptionist Hook**: Pre-integrated webhook triggers auto-responses, updating database states based on user confirmations/cancellations.

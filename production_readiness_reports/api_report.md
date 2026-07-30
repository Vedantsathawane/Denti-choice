# Notification API Specification Report

## 1. Public WhatsApp Webhook

### GET `/api/notifications/whatsapp/webhook`
Challenge token verification route matching Meta Cloud API requirements.
- **Request Parameters**:
  - `hub.mode`: `subscribe`
  - `hub.verify_token`: Match check variable
  - `hub.challenge`: Verification code string
- **Response**: String verification code (Status: 200)

### POST `/api/notifications/whatsapp/webhook`
Processes inbound user messages and logs conversation flows.
- **Request Payload**: WhatsApp Webhook JSON message schema.
- **Response**: `{ status: "processed", from: "phone_number", body: "message_body" }` (Status: 200)

---

## 2. Authenticated Management Endpoints

### GET `/api/notifications/history`
Loads multi-tenant notification history logs filtered by clinic ID.
- **Query Parameters**:
  - `page`: Page index (default: `1`)
  - `limit`: Logs count per page (default: `50`)
- **Response**: `{ success: true, data: [LogRecords], pagination: { total: Number } }`

### POST `/api/notifications/retry`
Retries failed notification logs and updates statuses.
- **Request Payload**: `{ id: Number }`
- **Response**: `{ success: true, message: "Notification retried successfully" }`

### POST `/api/notifications/test-whatsapp`
Sends a test WhatsApp message to verify template configuration settings.
- **Request Payload**: `{ phone: String, template: String, parameters: Array }`
- **Response**: `{ success: true, response: MetaResponseObj }`

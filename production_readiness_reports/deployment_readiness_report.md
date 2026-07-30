# Deployment Readiness Report

This report documents the verification of Docker setup files, environment variables, and build integrity checks.

## 1. Docker Audits
-   **Server Container**: `server/Dockerfile` uses `node:20-alpine`, runs production dependency installs, and exposes port `5000`.
-   **Client Container**: `client/Dockerfile` builds static files with Node, copies them to an Nginx stage, and configures route redirects for React Router.
-   **Docker Compose**: Configures environment links and ports bridging backend (5000) and frontend (80) services.

## 2. Environment Variables Checklist
The platform expects the following environment variables:
-   `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Database details.
-   `JWT_SECRET`: Secret key for JWT encryption.
-   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Mail server credentials.
-   `OPENAI_API_KEY`, `GEMINI_API_KEY`: API keys for AI models (fallback options).
-   `BILLING_USE_SANDBOX`, `WHATSAPP_USE_SANDBOX`: Toggles for sandbox mode.

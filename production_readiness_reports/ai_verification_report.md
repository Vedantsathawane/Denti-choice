# AI Verification Report

This report documents the audit of OpenAI/Gemini services, token tracking, limit blocks, and fallback mechanisms.

## 1. Integrated AI Features
-   **AI Receptionist Booking**: Handles patient slot inquiries and automatically schedules bookings.
-   **AI Doctor Assistant**: Automates clinical diagnostics, SOAP chart logs, and treatment planning.
-   **Usage Management**: Logs token counts and prompt/response details in the database.

## 2. API Key Resolution & Fallback Logic
The system loads model integrations dynamically in `openAiService.js`:
-   **Stripe/OpenAI Settings**: The system first checks for clinic-specific OpenAI API keys in `clinic_settings`.
-   **Gemini Settings**: If OpenAI keys are not configured, it checks for clinic-specific Gemini API keys.
-   **Environment Fallback**: If no clinic-specific keys are set, it falls back to environment variables (`OPENAI_API_KEY` or `GEMINI_API_KEY`).
-   **Mock Sandbox Driver**: If all API keys are empty, it switches to a mock streaming simulator. This allows the system to continue running without crashes or key dependencies.

## 3. Usage Audits & Token Limits
-   **Audit logs**: Tokens used are tracked inside `ai_logs` via `saasLogger.js`.
-   **Usage Blocks**: Enforced using `planLimitsMiddleware.js`. If a clinic's monthly AI requests exceed their plan limit, requests are rejected with a `403` error.

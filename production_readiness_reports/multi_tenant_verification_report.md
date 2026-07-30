# Multi-Tenant Verification Report

This report documents the security audit of multi-tenant isolation rules, subdomain resolving logic, and cross-tenant query boundaries.

## 1. Domain Resolution Logic
The resolver `publicClinicController.js` resolves the target clinic space dynamically:
1.  **Request Parameter**: Matches subdomain or custom domain explicitly passed in query variables.
2.  **Hostname Matching**: Resolves the target clinic directly by comparing `req.hostname` (or subdomains split parts) with `clinics.custom_domain` or `clinics.subdomain` columns.
3.  **Database Fallback**: Defaults to the standard platform home (Clinic ID = 1) if host matching is unresolved.

---

## 2. Logical Data Isolation
Every data operation is isolated through:
-   **JWT Clinic Payload**: Authentication tokens contain the user's validated `clinic_id`.
-   **`tenantMiddleware.js` Check**: Intercepts requests to confirm the authenticated clinic ID matches request variables:
    ```javascript
    if (req.user.role !== 'super_admin' && parseInt(req.user.clinic_id) !== parseInt(clinicId)) {
        return res.status(403).json({ success: false, message: 'Access Denied. Cross-tenant access is forbidden.' });
    }
    ```
-   **SQL Scoping**: Insert, update, and fetch queries use parameterized SQL strings filtering by `clinic_id` to guarantee tenant records are never leaked.
-   **Verification result**: Programmatic checks verified that cross-tenant queries return a `403 Forbidden` status code.

# Fixed Issues Report

This report documents the architectural fixes and updates implemented during the multi-tenant SaaS commercial extension phase.

## 1. Staged Reminder Engine Scheduling
- **Issue**: Single-channel alerts lacked interval scheduling checks, causing duplicate or missing pre-appointment notifications.
- **Fix**: Created `reminderService.js` to run scanning rules at 24h, 2h, and 30m prior to appointment time. Columns added to appointments table to track reminder triggers.

## 2. Invoicing & GST Calculation
- **Issue**: Standard billing was flat without support for coupons or standard tax logging.
- **Fix**: Added GST computations (18.00% standard tax) and coupon validations. Completed HTML invoice rendering templates in `billingService.js`.

## 3. Quota Blocks Enforcement
- **Issue**: No restrictions existed to enforce packages limits, allowing clinics to schedule unlimited bookings or add unlimited doctors.
- **Fix**: Implemented `planLimitsMiddleware.js` checking limits for doctors count, appointments booked, and AI requests before routing request updates.

## 4. Website Builder Customizations
- **Issue**: Clinic public websites were static and lacked branding customization controls.
- **Fix**: Added `WebsiteBuilder.jsx` tab and public site resolved endpoints in `publicClinicController.js` to serve dynamic templates.

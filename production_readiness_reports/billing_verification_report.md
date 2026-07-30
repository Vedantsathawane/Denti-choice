# Billing Verification Report

This report documents the verification of Stripe/Razorpay payment sessions, discount codes, tax computations, and custom invoice creation.

## 1. Checkout Session Creation
The `billingService.js` creates checkout objects programmatically:
-   **Plan Prices**: Fetches prices dynamically from `subscription_plans`.
-   **GST Computations**: Automatically adds standard 18.00% GST.
-   **Coupon Application**: Applies discount percentages to pre-tax prices before computing GST.
-   **Mock Simulator**: Triggers `/api/billing/mock-checkout-portal` when credentials are empty, allowing full flow testing.

---

## 2. Invoice Generation & Payments Logging
-   **Payment Success Updates**: Upgrades subscriptions and logs invoice records to the database on payment completion.
-   **Printable Invoice View**: Renders HTML invoices with billing details and GST breakdowns.
-   **Verification result**: Verification runs confirmed correct calculations and invoice insertions.

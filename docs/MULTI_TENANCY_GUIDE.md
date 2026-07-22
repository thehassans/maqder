# Multi-Tenancy Guide

This document explains the multi-tenant architecture used in this project. Maqder is designed as a SaaS (Software as a Service) platform where multiple businesses (Tenants) share the same application instance and database while their data remains completely isolated.

## Core Concepts

### What is a Tenant?
A `Tenant` represents a single business or merchant using the platform (e.g., a Restaurant, a Saloon, a Retail Store, or a Tailor).
Each tenant has:
- A unique `tenantId` (MongoDB ObjectId).
- Specific business settings (name, VAT number, legal name).
- Specific branding (logo, primary colors, typography).
- Modular feature flags (e.g., POS enabled, E-commerce enabled, WhatsApp enabled).
- Hardware configurations (receipt printers, barcode scanners).

## Database Isolation (Tenant-Wise Data)

In MongoDB, we do not use separate databases per tenant. Instead, we use a **Shared Database, Shared Schema** approach with row-level isolation.

**Rule of Thumb**: Almost every collection in the database MUST have a `tenantId` field.

When querying the database, the backend **always** filters by `tenantId`.
Example:
```javascript
// Correct: Finding orders for the current tenant
const orders = await Order.find({ tenantId: req.user.tenantId });

// INCORECT: Never query without tenantId, otherwise data leaks across businesses!
const orders = await Order.find({}); 
```

### Authentication and Middleware

When a user logs in, the backend verifies their JWT token. The token contains the user's `tenantId`.
The `authorize` middleware in `backend/middleware/auth.js` attaches the user object (including `tenantId`) to the `req` object.

```javascript
// Any route protected by authorize() has access to req.user.tenantId
router.get('/products', authorize('employee'), async (req, res) => {
  const products = await Product.find({ tenantId: req.user.tenantId });
  res.json(products);
});
```

## Frontend State Management

On the frontend, Redux is used to store the current tenant's data.
When the user logs in, the backend sends the complete `Tenant` object. It is stored in the `authSlice`:
```javascript
// Accessing tenant data anywhere in the React app
const { tenant } = useSelector((state) => state.auth);
```

### Branding & UI

The frontend dynamically applies the tenant's brand colors to the UI via CSS Variables.
When the app loads (or the tenant logs in), a utility function `applyTenantBranding(tenant)` injects CSS variables into the `:root` element.

Example:
```css
:root {
  --color-primary: #D97706; /* Changes dynamically based on tenant settings */
}
```
Tailwind CSS is configured to use these variables, meaning components using `bg-amber-600` can be overridden by the tenant's custom primary color dynamically without rebuilding the app!

## Business Types & Modules

Since a single tenant might run a Restaurant, a Car Rental, or a Tailoring shop, the platform checks the `businessTypes` array in the `Tenant` model to determine what sidebar menus and features are accessible.

Example:
```javascript
// In frontend/src/lib/sidebarConfig.js
if (tenant.businessTypes.includes('restaurant')) {
  // Show Restaurant POS, Kitchen Display System (KDS), QR Menu
}
if (tenant.businessTypes.includes('khayyat')) {
  // Show Tailoring Measurements, Workers, Stitching
}
```

## Public/Customer Facing Pages

For public pages (like E-commerce stores or QR Menus), the customer is not logged in.
Instead, the `tenantId` or a `subdomain` is passed in the URL.

Example QR Menu URL: `https://maqder.com/public/menu?tenant=64a1b2c3d4e5f6...`

The public route fetches the tenant's public settings (like Hero Image, Menu Mode, and active products) using that ID, ensuring the customer only sees that specific restaurant's menu.

# Developer Onboarding Guide

Welcome to the Maqder engineering team! This guide will help you understand how to navigate the codebase, find where things are located, and follow the project's coding standards.

## Where to Find Things?

### 1. Modifying the UI or Adding a Page
If you are asked to "add a button", "change the POS layout", or "add a new screen":
- Head to `frontend/src/pages/`.
- Locate the specific module folder (e.g., `restaurant`, `khayyat`, `hr`, `inventory`).
- You will find React components (`.jsx`) for each screen.
- **Tip:** If it's a reusable UI component like a generic button, modal, or input field, look in `frontend/src/components/ui/` or `frontend/src/components/common/`.

### 2. Modifying the Database Structure (Adding Fields)
If you need to add a new field (e.g., "discount amount" to a product):
- Head to `backend/models/`.
- Open the relevant Mongoose schema file (e.g., `Product.js`).
- Add your field.
- **Important:** Don't forget that if the frontend needs to send or display this new field, you must update the React forms (`frontend/src/pages/...`) to send it!

### 3. Adding a New API Endpoint
If you need a new route (e.g., `GET /api/reports/sales`):
- Head to `backend/routes/`.
- Find or create the relevant route file.
- Register the route using `router.get()` or `router.post()`.
- Use the `authorize` middleware to ensure only logged-in users with the right roles can access it.
- **Remember:** Always filter your MongoDB queries by `tenantId: req.user.tenantId`!

## Code Style & Best Practices

1. **Translations (i18n):**
   - The platform supports English and Arabic.
   - Do NOT hardcode text in the UI like this: `<h1>Dashboard</h1>`.
   - Instead, use the language toggle logic: `{isRtl ? 'لوحة القيادة' : 'Dashboard'}`.
   - This ensures the UI flips seamlessly for Arabic users.

2. **Styling:**
   - We use Tailwind CSS.
   - For primary brand colors, use the `amber` palette (e.g., `text-amber-600`, `bg-amber-500`) or standard Bootstrap-like classes (e.g., `btn-primary`) because these are dynamically overridden in CSS by the tenant's brand colors.

3. **Routing:**
   - All routes are registered in `frontend/src/App.jsx`.
   - New pages must be lazy-loaded in `App.jsx` to keep the initial bundle size small and performance fast.

## Working with Redux (State)
- Redux is only used for global state (User Auth, Tenant Settings, Theme, Language).
- For local component state (like a form input or a temporary modal toggle), use React's `useState`.
- Do NOT put API responses into Redux unless they need to be accessed globally across many different unrelated components. Use local state for standard data fetching.

If you ever feel lost, refer to `ARCHITECTURE.md` and `MULTI_TENANCY_GUIDE.md` for a deeper dive into the system's core design!

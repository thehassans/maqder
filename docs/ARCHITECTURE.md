# Project Architecture

Maqder is a comprehensive, multi-tenant SaaS Enterprise Resource Planning (ERP) and Point of Sale (POS) system.

## High-Level Architecture

The system operates on a standard MERN-like stack but uses Vite instead of Webpack for the frontend, and a highly modular architecture for the backend.

### 1. Frontend (React + Vite)
- **Framework:** React 18
- **Build Tool:** Vite (Extremely fast HMR and optimized builds)
- **State Management:** Redux Toolkit (`frontend/src/store/`)
  - `authSlice.js`: Manages the current logged-in user, JWT token, and the `tenant` configuration.
  - `uiSlice.js`: Manages theme (dark/light), language (en/ar), and sidebar state.
- **Styling:** Tailwind CSS
  - Custom colors are injected into Tailwind configuration using CSS variables so that every tenant can have their own brand colors.
- **Routing:** React Router v6
  - Protected routes ensure only authenticated users can access the dashboard.
  - Role-based route guards ensure employees can only access modules they have permission for.
- **API Communication:** Axios (`frontend/src/lib/api.js`)
  - All Axios requests are intercepted to automatically attach the `Authorization: Bearer <token>` header.

### 2. Backend (Node.js + Express)
- **Framework:** Express.js
- **Architecture:** MVC (Model, Route, Controller pattern)
  - `models/`: Mongoose schemas defining the database structure.
  - `routes/`: Express routers that map HTTP methods and URLs to controller logic.
  - `middleware/`: Reusable functions that run before the route logic (e.g., `auth.js` for checking JWTs, `upload.js` for handling files).
- **Authentication:** JSON Web Tokens (JWT)
  - Issued upon login. The token payload contains the `userId`, `role`, and `tenantId`.

### 3. Database (MongoDB)
- **Database:** MongoDB
- **ODM:** Mongoose
- **Multi-Tenancy:** Shared database, shared schema. (Read `MULTI_TENANCY_GUIDE.md` for deep details on how isolation works).

## Directory Structure Overview

### Frontend (`frontend/src/`)
- `assets/`: Static files like icons and SVGs.
- `components/`: Reusable UI elements (buttons, inputs, modals).
- `layouts/`: Master layouts (e.g., `MainLayout.jsx` contains the sidebar and header).
- `pages/`: The actual views/screens for the application. Grouped by module:
  - `restaurant/`: POS, Kitchen, Menus.
  - `hr/`: Employees, Payroll, Attendance.
  - `inventory/`: Products, Warehouses.
  - `finance/`: Vouchers, Invoices.
- `lib/`: Helper functions, constants, formatting tools.
- `store/`: Redux configuration and slices.

### Backend (`backend/`)
- `models/`: Database schemas.
- `routes/`: API endpoints.
- `middleware/`: Authentication and error handling.
- `utils/`: ZATCA integration, email services, PDF generation.
- `public/uploads/`: Directory where user-uploaded files are stored before being served by Nginx or Express.

## Desktop App Wrapper (Electron)
The `desktop/` directory contains an Electron wrapper that allows the web application to run as a native Windows/macOS desktop application.
- It loads the hosted web app (or a local build).
- It provides native capabilities like raw printing to USB/network thermal receipt printers.

# ZATCA ERP System

A comprehensive Saudi-compliant SaaS ERP system built with the MERN Stack (MongoDB, Express.js, React.js, Node.js). Features ZATCA Phase 2 E-invoicing, HR & Payroll with Saudi Labor Law compliance, and Multi-warehouse Inventory Management.

## 🌟 Features

### Module A: HR & Payroll (Saudi Labor Law)
- **Iqama Management**: Document tracking with 60-day expiry alerts via cron jobs
- **GOSI Calculation**: Automatic social insurance calculation for Saudi & Non-Saudi employees
- **WPS File Generation**: Saudi Central Bank format `.sif` file generator
- **EOSB Calculator**: End of Service Benefits calculation per Saudi Labor Law
- **Hijri Date Support**: Dual Gregorian/Hijri date handling with `moment-hijri`

### Module B: ZATCA Phase 2 E-Invoicing
- **UBL 2.1 XML Generation**: Compliant invoice XML using Handlebars templates
- **Blockchain-style Hashing**: SHA-256 chained invoice hashing
- **ECDSA Digital Signatures**: secp256k1 signing with `node-forge`
- **TLV QR Code Generation**: Base64 encoded QR codes with all required fields
- **B2B Clearance**: Real-time ZATCA API integration for standard invoices
- **B2C Reporting**: Batch reporting within 24-hour window for simplified invoices

### Module C: Inventory & Supply Chain
- **Multi-Warehouse**: Product stocks across multiple locations
- **Landed Cost Calculation**: Purchase + Customs + Freight averaging
- **Barcode/QR Scanning**: API support for scan-based lookups
- **Stock Transfers**: Inter-warehouse inventory movements

### Additional Features
- **Multi-Tenant Architecture**: TenantID isolation in all schemas
- **RTL Support**: Full Arabic/English UI with native RTL layouts
- **AI Integration**: OpenAI-powered document extraction and inventory predictions
- **Super Admin Panel**: Complete tenant and user management
- **Premium UI**: Modern design with Tailwind CSS and Framer Motion

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Frontend | React.js (Vite), Tailwind CSS |
| State | Redux Toolkit, React Query |
| Auth | JWT with bcrypt |
| E-Invoicing | node-forge, qrcode, handlebars |
| AI | OpenAI API |

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB 6+
- OpenAI API Key (optional, for AI features)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## ⚙️ Environment Variables

```env
# Server
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zatca-erp
JWT_SECRET=your-secret-key

# OpenAI (Optional)
OPENAI_API_KEY=sk-...

# ZATCA API
ZATCA_API_URL=https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal

# Email (for alerts)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🔑 Default Credentials

**Super Admin:**
- Email: admin@zatca-erp.com
- Password: SuperAdmin@123
- Leave tenant field empty

## 📁 Project Structure

```
zatca-erp/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── middleware/      # Auth & error handling
│   ├── utils/
│   │   ├── zatca/       # ZATCA e-invoicing utilities
│   │   └── hr/          # Payroll calculations
│   ├── jobs/            # Cron jobs (Iqama, ZATCA sync)
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── layouts/     # Page layouts
    │   ├── pages/       # Route pages
    │   ├── store/       # Redux slices
    │   └── lib/         # API, translations
    └── index.html
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `POST /api/invoices/:id/sign` - Sign & submit to ZATCA

### HR & Payroll
- `GET /api/employees` - List employees
- `POST /api/payroll/generate` - Generate monthly payroll
- `POST /api/payroll/generate-wps` - Download WPS SIF file
- `POST /api/payroll/calculate-gosi` - GOSI calculation
- `POST /api/payroll/calculate-eosb` - EOSB calculation

### Inventory
- `GET /api/products` - List products
- `GET /api/products/lookup?barcode=xxx` - Barcode lookup
- `POST /api/products/:id/landed-cost` - Calculate landed cost
- `POST /api/products/:id/transfer` - Stock transfer

### Super Admin
- `GET /api/super-admin/dashboard` - System overview
- `GET /api/super-admin/tenants` - Manage tenants
- `POST /api/super-admin/tenants` - Create tenant

## 🔒 ZATCA Compliance

This system implements ZATCA Phase 2 requirements:

1. **Invoice Chaining**: Each invoice hash includes the previous invoice hash
2. **Digital Signature**: ECDSA secp256k1 signatures on invoice hash
3. **QR Code**: TLV-encoded data with seller, VAT, timestamp, totals, hash, signature
4. **XML Format**: UBL 2.1 compliant invoice structure
5. **API Integration**: Clearance for B2B, Reporting for B2C

## 🌐 Localization

The system supports full RTL layout with Arabic translations:

```javascript
// Switch language
dispatch(setLanguage('ar')) // Arabic RTL
dispatch(setLanguage('en')) // English LTR
```

All UI text, including form labels, buttons, and messages, automatically switch between languages.

## 📄 License

MIT License - Free for commercial and personal use.

## 🤝 Support

For issues and feature requests, please open a GitHub issue.

---

Built with ❤️ for Saudi Arabian businesses

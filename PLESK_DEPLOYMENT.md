# ZATCA ERP - Plesk Node.js Deployment Guide

## Domain: Maqder.com

---

## 1. Plesk Node.js Configuration

### Step 1: Enable Node.js in Plesk
1. Log into Plesk Panel
2. Go to **Domains** → **Maqder.com**
3. Click **Node.js** in the sidebar
4. Click **Enable Node.js**

### Step 2: Node.js Application Settings

| Setting | Value |
|---------|-------|
| **Node.js Version** | 18.x or 20.x (LTS recommended) |
| **Package Manager** | npm |
| **Document Root** | `/httpdocs` |
| **Application Mode** | production |
| **Application URL** | https://maqder.com |
| **Application Root** | `/httpdocs/backend` |
| **Application Startup File** | `server.js` |

### Step 3: Environment Variables in Plesk

In Plesk Node.js settings, add these environment variables:

```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://hassansarwar2112_db_user:GvozITy6hCKgrIH4@maqder.se7slkz.mongodb.net/zatca-erp?retryWrites=true&w=majority&appName=Maqder
JWT_SECRET=maqder-zatca-erp-jwt-secret-CHANGE-THIS-TO-RANDOM-STRING
JWT_EXPIRE=7d
FRONTEND_URL=https://maqder.com
```

> ⚠️ **IMPORTANT**: Change `JWT_SECRET` to a unique random string (32+ characters)

---

## 2. Directory Structure on Server

```
/var/www/vhosts/maqder.com/httpdocs/
├── backend/
│   ├── server.js          (Node.js entry point)
│   ├── package.json
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── ...
└── frontend/
    └── dist/              (Built React app)
        ├── index.html
        ├── assets/
        └── ...
```

---

## 3. Deployment Steps

### Step 1: Build Frontend Locally
```bash
cd frontend
npm install
npm run build
```

### Step 2: Upload Files to Server
Upload via FTP/SFTP or Git:
- Upload `backend/` folder to `/httpdocs/backend/`
- Upload `frontend/dist/` contents to `/httpdocs/` (or a subdomain)

### Step 3: Install Backend Dependencies
In Plesk Node.js panel, click **NPM Install** or via SSH:
```bash
cd /var/www/vhosts/maqder.com/httpdocs/backend
npm install --production
```

### Step 4: Restart Application
In Plesk Node.js panel, click **Restart App**

---

## 4. Apache/Nginx Configuration

### Option A: Serve Frontend + Proxy API (Recommended)

Add to `.htaccess` in `/httpdocs/`:

```apache
# Redirect API requests to Node.js backend
RewriteEngine On
RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]

# Serve React app for all other routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Option B: Nginx Proxy (if using Nginx)

```nginx
location /api {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 5. SSL Certificate

1. In Plesk, go to **SSL/TLS Certificates**
2. Click **Install** → **Let's Encrypt**
3. Enable **Redirect HTTP to HTTPS**

---

## 6. MongoDB Atlas Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to **Network Access**
3. Add your Plesk server's IP address to the whitelist
4. Or add `0.0.0.0/0` to allow all IPs (less secure)

---

## 7. Environment Variables Summary

| Variable | Production Value |
|----------|------------------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://hassansarwar2112_db_user:***@maqder.se7slkz.mongodb.net/zatca-erp?retryWrites=true&w=majority&appName=Maqder` |
| `JWT_SECRET` | `<random-32-char-string>` |
| `JWT_EXPIRE` | `7d` |
| `FRONTEND_URL` | `https://maqder.com` |
| `OPENAI_API_KEY` | (optional) |
| `SUPER_ADMIN_EMAIL` | `admin@maqder.com` |
| `SUPER_ADMIN_PASSWORD` | `SuperAdmin@123` |

---

## 8. First Login

After deployment:
1. Visit `https://maqder.com`
2. Login with Super Admin credentials:
   - Email: `admin@maqder.com`
   - Password: `SuperAdmin@123`
3. **Change the password immediately!**

---

## 9. Troubleshooting

### Check Node.js Logs
In Plesk: **Domains** → **Maqder.com** → **Node.js** → **Logs**

### Common Issues

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check if Node.js app is running, check PORT |
| MongoDB connection error | Verify IP whitelist in Atlas, check URI |
| CORS errors | Ensure `FRONTEND_URL` matches your domain |
| Static files not loading | Check document root and build output |

---

## 10. Security Checklist

- [ ] Change `JWT_SECRET` to a unique random string
- [ ] Change Super Admin password after first login
- [ ] Enable HTTPS/SSL
- [ ] Restrict MongoDB Atlas IP whitelist
- [ ] Set `NODE_ENV=production`
- [ ] Remove `.env.production` from version control after setup

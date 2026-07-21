const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building frontend React app...');
const frontendPath = path.join(__dirname, '../frontend');
try {
  execSync('npm install', { cwd: frontendPath, stdio: 'inherit' });
  execSync('npx vite build --base ./', { 
    cwd: frontendPath, 
    stdio: 'inherit',
    env: { ...process.env, VITE_IS_DESKTOP: 'true', VITE_API_BASE_URL: 'https://maqder.com/api' }
  });
} catch (err) {
  console.error('Failed to build frontend:', err);
  process.exit(1);
}

const src = path.join(frontendPath, 'dist');
const dest = path.join(__dirname, 'ui');

console.log(`Copying built UI from ${src} to ${dest}...`);

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}

fs.cpSync(src, dest, { recursive: true });

console.log('UI copied successfully! Ready for Electron Builder.');

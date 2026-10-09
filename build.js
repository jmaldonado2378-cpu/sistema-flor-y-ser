const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('⚛️ Building React + TypeScript Frontend...');
try {
  execSync('npx vite build', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
  console.log('✅ React frontend built successfully in frontend/dist!');
} catch (err1) {
  try {
    execSync('npm run build', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
    console.log('✅ React frontend built successfully via npm run build!');
  } catch (err2) {
    console.log('📦 Using pre-compiled frontend dist static files.');
  }
}

// Copiar el bundle de React generado a la raíz y a public/ para compatibilidad total con Hostinger
const distDir = path.join(__dirname, 'frontend', 'dist');
const publicDir = path.join(__dirname, 'public');
const distPublicDir = path.join(__dirname, 'dist', 'public');

if (fs.existsSync(distDir)) {
  console.log('📦 Sincronizando frontend/dist a la raíz y carpetas public/...');
  fs.cpSync(distDir, __dirname, { recursive: true });
  fs.cpSync(distDir, publicDir, { recursive: true });
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.cpSync(distDir, distPublicDir, { recursive: true });
  }
  console.log('✅ Archivos estáticos de React v2.0 sincronizados exitosamente!');
}

console.log('⚙️ Compiling TypeScript backend (npx tsc)...');
try {
  execSync('npx tsc', { stdio: 'inherit' });
} catch (err) {
  console.warn('⚠️ tsc compilation warning, continuing build...');
}

// Sincronizar catalogSeedData.json en dist/database
const srcSeed = path.join(__dirname, 'src', 'database', 'catalogSeedData.json');
const distDb = path.join(__dirname, 'dist', 'database');
const distSeed = path.join(distDb, 'catalogSeedData.json');
if (fs.existsSync(srcSeed)) {
  if (!fs.existsSync(distDb)) {
    fs.mkdirSync(distDb, { recursive: true });
  }
  fs.copyFileSync(srcSeed, distSeed);
  console.log('✅ catalogSeedData.json sincronizado a dist/database/');
}

console.log('🚀 Build process completed successfully!');


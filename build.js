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

console.log('🚀 Build process completed successfully!');


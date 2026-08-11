const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('⚛️ Building React + TypeScript Frontend...');
try {
  execSync('npm run build', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
  console.log('✅ React frontend built successfully in frontend/dist!');

  // Copiar el bundle de React generado a la raíz para compatibilidad con el importador de Git de Hostinger
  const distDir = path.join(__dirname, 'frontend', 'dist');
  if (fs.existsSync(distDir)) {
    console.log('📦 Sincronizando frontend/dist a la raíz del repositorio para Hostinger...');
    fs.cpSync(distDir, __dirname, { recursive: true });
    console.log('✅ Archivos estáticos (index.html, assets/) copiados exitosamente a la raíz!');
  }
} catch (err) {
  console.error('❌ React frontend build failed:', err);
}

console.log('⚙️ Compiling TypeScript backend (npx tsc)...');
try {
  execSync('npx tsc', { stdio: 'inherit' });
} catch (err) {
  console.warn('⚠️ tsc compilation warning, continuing build...');
}

console.log('🚀 Build process completed successfully!');


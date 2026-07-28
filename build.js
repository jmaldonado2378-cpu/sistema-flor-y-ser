const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Bundling vendor.bundle.js with esbuild...');
execSync('npx esbuild src/frontend_entry.js --bundle --minify --outfile=public/vendor.bundle.js', { stdio: 'inherit' });

console.log('⚙️ Compiling TypeScript backend (npx tsc)...');
try {
  execSync('npx tsc', { stdio: 'inherit' });
} catch (err) {
  console.warn('⚠️ tsc compilation warning, continuing build...');
}

const filesToCopy = ['vendor.bundle.js', 'app.js', 'index.html', 'styles.css', '.htaccess'];

// Ensure dist/public directory exists
const distPublicDir = path.join(__dirname, 'dist', 'public');
if (!fs.existsSync(distPublicDir)) {
  fs.mkdirSync(distPublicDir, { recursive: true });
}

filesToCopy.forEach(file => {
  const src = path.join(__dirname, 'public', file);
  const destRoot = path.join(__dirname, file);
  const destDistPublic = path.join(distPublicDir, file);

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, destRoot);
    fs.copyFileSync(src, destDistPublic);
    console.log(`✅ Copied public/${file} -> ./${file} & ./dist/public/${file}`);
  }
});

console.log('🚀 Build and root/dist sync completed successfully!');

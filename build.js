const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Bundling vendor.bundle.js with esbuild...');
execSync('npx esbuild src/frontend_entry.js --bundle --minify --outfile=public/vendor.bundle.js', { stdio: 'inherit' });

const filesToCopy = ['vendor.bundle.js', 'app.js', 'index.html', 'styles.css'];

filesToCopy.forEach(file => {
  const src = path.join(__dirname, 'public', file);
  const dest = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied public/${file} -> ./${file}`);
  }
});
console.log('🚀 Build and root sync completed successfully!');

const fs = require('fs');
const path = require('path');

function fixAllFiles(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      if (!file.name.startsWith('.') && file.name !== 'node_modules') {
        fixAllFiles(fullPath);
      }
    } else if (file.name.match(/\.(ts|tsx|js|jsx)$/)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('soloboard')) {
          const fixed = content.replace(/soloboard/g, 'dashboard');
          fs.writeFileSync(fullPath, fixed, 'utf8');
          console.log(`✓ ${fullPath.replace(process.cwd(), '')}`);
        }
      } catch(e) {
        console.error(`✗ ${fullPath}: ${e.message}`);
      }
    }
  });
}

console.log('Fixing all soloboard references...\n');
fixAllFiles(path.join(process.cwd(), 'src'));
console.log('\nDone!');


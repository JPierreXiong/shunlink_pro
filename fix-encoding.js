const fs = require('fs');
const path = require('path');

const files = [
  'src/components/soloboard/site-settings-dialog.tsx',
  'src/components/soloboard/sync-progress-dialog.tsx',
  'src/components/soloboard/wizard-batch-add-dialog.tsx',
  'src/shared/hooks/use-sites.ts'
];

files.forEach(f => {
  const fullPath = path.join(process.cwd(), f);
  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/soloboard/g, 'dashboard');
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Fixed: ${f}`);
    } catch(e) {
      console.error(`Error fixing ${f}:`, e.message);
    }
  }
});














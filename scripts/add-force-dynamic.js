const fs = require('fs');
const path = require('path');

function walk(dir) {
  return fs.readdirSync(dir).flatMap(f => {
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const apiDir = path.join(__dirname, '../src/app/api');
const routes = walk(apiDir).filter(f => f.endsWith('route.ts'));
let count = 0;

routes.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('force-dynamic')) {
    fs.writeFileSync(f, "export const dynamic = 'force-dynamic';\n\n" + c, 'utf8');
    count++;
    console.log('  + ' + path.relative(apiDir, f));
  } else {
    console.log('  = ' + path.relative(apiDir, f) + ' (already has force-dynamic)');
  }
});

console.log('\nDone. Added force-dynamic to ' + count + ' files.');









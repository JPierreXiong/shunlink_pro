const fs = require('fs');
const langs = ['en', 'fr', 'zh'];

const replacements = [
  ['SoloBoard \u2014 Multi-Site Monitoring Dashboard for Solo Entrepreneurs', 'LinkFlow AI \u2014 AI-Powered Backlink Deployment Platform'],
  ['Monitor GA4 traffic, Stripe & Creem revenue, and uptime for up to 10 websites', 'Deploy AI agents to secure high-authority backlinks in 48 hours with live proof'],
  ['multi-site monitoring dashboard, GA4 analytics dashboard', 'AI backlink deployment, automated backlinks, SEO link building'],
  ['solopreneur tools, website analytics aggregator, SaaS dashboard, Creem revenue tracking, website uptime monitor, solo founder dashboard', 'backlink proof, high authority backlinks, linkflow ai, automated SEO'],
  ['SoloBoard Dashboard', 'LinkFlow AI Dashboard'],
  ['Monitoring {count} sites', 'Managing {count} tasks'],
  ['Monitor all your sites in one place. Track GA4 analytics, payment revenue, and uptime status.', 'Manage your backlink tasks and track deployment results in one place.'],
  ['Monitor All Your Sites', 'Manage Your Backlink Tasks'],
  ['Track revenue, traffic, and uptime status for all your websites in one place', 'Track deployment status, live URLs, and screenshot proof for all your backlink tasks'],
  ['No websites yet', 'No tasks yet'],
  ['Add your first website to start monitoring revenue, traffic, and uptime status.', 'Submit your first backlink task to start deploying AI-powered backlinks with proof.'],
  ['Add Your First Website', 'Deploy Your First Backlink'],
  ['Add Website', 'New Task'],
  ['Upgrade to Add More Sites', 'Upgrade to Deploy More Backlinks'],
  ['soloboard.app', 'linkflowai.app'],
  ['SoloBoard', 'LinkFlow AI'],
  ['soloboard', 'linkflowai'],
  ['solopreneur', 'SEO professional'],
  ['solo entrepreneur', 'SEO professional'],
];

langs.forEach(lang => {
  const p = `src/config/locale/messages/${lang}/common.json`;
  let s = fs.readFileSync(p, 'utf8');
  replacements.forEach(([from, to]) => { s = s.split(from).join(to); });
  // validate JSON
  try { JSON.parse(s); } catch(e) { console.error(lang + ' INVALID JSON: ' + e.message); return; }
  fs.writeFileSync(p, s, 'utf8');
  console.log(lang + ' common.json done');
});

// Fix about.json
langs.forEach(lang => {
  const p = `src/config/locale/messages/${lang}/about.json`;
  try {
    let s = fs.readFileSync(p, 'utf8');
    s = s.split('SoloBoard').join('LinkFlow AI');
    s = s.split('soloboard').join('linkflowai');
    s = s.split('solopreneur').join('SEO professional');
    s = s.split('soloboard.app').join('linkflowai.app');
    s = s.split('support@soloboard.app').join('support@linkflowai.app');
    JSON.parse(s);
    fs.writeFileSync(p, s, 'utf8');
    console.log(lang + ' about.json done');
  } catch(e) { console.error(lang + ' about error: ' + e.message); }
});

// Fix dashboard.json
langs.forEach(lang => {
  const p = `src/config/locale/messages/${lang}/dashboard.json`;
  try {
    let s = fs.readFileSync(p, 'utf8');
    s = s.split('SoloBoard').join('LinkFlow AI');
    s = s.split('soloboard').join('linkflowai');
    JSON.parse(s);
    fs.writeFileSync(p, s, 'utf8');
    console.log(lang + ' dashboard.json done');
  } catch(e) { console.error(lang + ' dashboard error: ' + e.message); }
});

// Fix pricing.json - product names and metadata
langs.forEach(lang => {
  const p = `src/config/locale/messages/${lang}/pricing.json`;
  try {
    let s = fs.readFileSync(p, 'utf8');
    s = s.split('SoloBoard Pricing').join('LinkFlow AI Pricing');
    s = s.split('Pricing \u2014 SoloBoard').join('Pricing \u2014 LinkFlow AI');
    s = s.split('SoloBoard Free').join('LinkFlow AI Free');
    s = s.split('SoloBoard Base').join('LinkFlow AI Base');
    s = s.split('SoloBoard Pro').join('LinkFlow AI Pro');
    s = s.split('SoloBoard pricing').join('LinkFlow AI pricing');
    s = s.split('SoloBoard plans').join('LinkFlow AI plans');
    s = s.split('soloboard').join('linkflowai');
    s = s.split('solopreneur').join('SEO professional');
    JSON.parse(s);
    fs.writeFileSync(p, s, 'utf8');
    console.log(lang + ' pricing.json done');
  } catch(e) { console.error(lang + ' pricing error: ' + e.message); }
});

console.log('All done!');


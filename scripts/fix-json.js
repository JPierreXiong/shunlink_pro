const fs = require('fs');

function fixJsonFile(filepath) {
  let text = fs.readFileSync(filepath, 'utf8');
  
  // The problem: content like "LinkFlow AI（以下简称"我们"）" has unescaped
  // ASCII double quotes around Chinese words inside a JSON string value.
  // We need to escape those inner quotes.
  //
  // Strategy: find patterns where a double-quote is immediately followed by
  // a Chinese character (not whitespace/colon which would indicate JSON structure)
  // and replace with escaped quote.
  
  // Split into lines and fix each line's string values
  const lines = text.split('\n');
  const fixedLines = lines.map(line => {
    // Match JSON string values: "key": "value with potential issues"
    // We need to fix unescaped quotes INSIDE value strings
    return line.replace(/: (")(.*)(")(,?)$/, (match, q1, content, q2, comma) => {
      // Replace unescaped quotes inside content with escaped quotes
      // An unescaped quote is one not preceded by \
      const fixed = content.replace(/(?<!\\)"/g, '\\"');
      return ': ' + q1 + fixed + q2 + comma;
    });
  });
  
  const fixed = fixedLines.join('\n');
  
  try {
    JSON.parse(fixed);
    fs.writeFileSync(filepath, fixed, 'utf8');
    console.log('✅ Fixed: ' + filepath);
  } catch(e) {
    console.error('❌ Still broken: ' + filepath + ' - ' + e.message);
  }
}

fixJsonFile('src/config/locale/messages/zh/privacy.json');
fixJsonFile('src/config/locale/messages/zh/terms.json');


























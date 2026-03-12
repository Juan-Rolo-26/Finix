const fs = require('fs');
let content = fs.readFileSync('src/pages/Portfolio.tsx', 'utf-8');

content = content.replace(/displayMetrics=/g, 'metrics=');
content = content.replace(/displayMovements=/g, 'movements=');

fs.writeFileSync('src/pages/Portfolio.tsx', content);
console.log('Fixed props');

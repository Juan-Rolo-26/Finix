const fs = require('fs');
let content = fs.readFileSync('src/pages/Portfolio.tsx', 'utf-8');

content = content.replace(/t\.portfolio\.displayMetrics/g, 't.portfolio.metrics');
content = content.replace(/t\.portfolio\.displayMovements/g, 't.portfolio.movements');
content = content.replace(/displayMovements\.map\(\(movement\)/g, 'displayMovements.map((movement: any)');

fs.writeFileSync('src/pages/Portfolio.tsx', content);
console.log('Fixed translations and types');

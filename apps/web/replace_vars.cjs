const fs = require('fs');
const content = fs.readFileSync('src/pages/Portfolio.tsx', 'utf-8');

const splitToken = '{selectedPortfolio && metrics && (';
if (!content.includes(splitToken)) {
    console.log('Split token not found');
    process.exit(1);
}

const parts = content.split(splitToken);
let renderBlock = parts[1];

// Make targeted replacements within the render block only
renderBlock = renderBlock.replace(/selectedPortfolio\./g, 'displayPortfolio.');
renderBlock = renderBlock.replace(/selectedPortfolio\?/g, 'displayPortfolio?');
renderBlock = renderBlock.replace(/metrics\./g, 'displayMetrics.');
renderBlock = renderBlock.replace(/metrics\?/g, 'displayMetrics?');
renderBlock = renderBlock.replace(/metrics,/g, 'displayMetrics,');
renderBlock = renderBlock.replace(/metrics=/g, 'displayMetrics=');
renderBlock = renderBlock.replace(/\{metrics\s*\}/g, '{displayMetrics}');
renderBlock = renderBlock.replace(/movements\./g, 'displayMovements.');
renderBlock = renderBlock.replace(/movements\.map/g, 'displayMovements.map');
renderBlock = renderBlock.replace(/movements,/g, 'displayMovements,');
renderBlock = renderBlock.replace(/movements=/g, 'displayMovements=');
renderBlock = renderBlock.replace(/movements\.length/g, 'displayMovements.length');

// Reconstruct file
const newContent = parts[0] + '{displayPortfolio && displayMetrics && (' + renderBlock;

fs.writeFileSync('src/pages/Portfolio.tsx', newContent);
console.log('Replaced successfully');

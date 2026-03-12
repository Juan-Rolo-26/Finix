const fs = require('fs');
let content = fs.readFileSync('src/pages/Portfolio.tsx', 'utf-8');

content = content.replace(
  /const \{ displayPortfolio, displayMetrics, displayMovements \} = useMemo\(\(\) => \{/g,
  'const { displayPortfolio, displayMetrics, displayMovements } = useMemo((): { displayPortfolio: Portfolio | null, displayMetrics: PortfolioMetrics | null, displayMovements: Movement[] } => {'
);
content = content.replace(/\{ displayPortfolio: p as Portfolio, displayMetrics: m, displayMovements: movs \}/g, '{ displayPortfolio: p as Portfolio, displayMetrics: m as PortfolioMetrics | null, displayMovements: movs as Movement[] }');

fs.writeFileSync('src/pages/Portfolio.tsx', content);
console.log('Fixed typings');

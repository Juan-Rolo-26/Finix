const { execSync } = require('child_process');
try {
  execSync('curl -v -X POST -H "Content-Type: application/json" -d \'{"name":"Test","description":"Test","category":"Acciones"}\' http://localhost:3001/api/communities', {stdio: 'inherit'});
} catch (e) {}

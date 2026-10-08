// Read PM2 JSON privately; never print process environments or secret values.
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const app = JSON.parse(input).find(p => p.name === 'finix-api');
    if (app && app.pm2_env?.pm_cwd !== process.argv[2]) process.exitCode = 3;
  } catch { process.exitCode = 1; }
});

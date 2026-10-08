#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const report = { inspectedAt: new Date().toISOString(), queries: [], supabaseReferences: [] };
function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filename = path.join(directory, entry.name);
        if (entry.isDirectory()) { walk(filename); continue; }
        if (!/\.tsx?$/.test(filename) || /\.spec\.ts$/.test(filename)) continue;
        const source = fs.readFileSync(filename, 'utf8');
        const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
        const relative = path.relative(root, filename);
        source.split('\n').forEach((line, index) => { if (/supabase\.(auth|storage|from|channel|rpc|functions)|SUPABASE_/i.test(line)) report.supabaseReferences.push({ file: relative, line: index + 1, service: /supabase\.auth|JWT|ISSUER|JWKS/.test(line) ? 'auth' : /storage/.test(line) ? 'storage' : 'configuration' }); });
        function visit(node) {
            if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && /prisma\./.test(node.expression.getText(tree))) {
                const action = node.expression.name.text;
                if (/^(find|count|groupBy|aggregate|\$query|\$execute|create|update|delete|upsert)/.test(action)) {
                    const properties = node.arguments[0] && ts.isObjectLiteralExpression(node.arguments[0]) ? node.arguments[0].properties.map(p => p.name?.getText(tree)) : [];
                    const parents = []; let parent = node.parent;
                    while (parent) { parents.push(parent); parent = parent.parent; }
                    report.queries.push({ file: relative, line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1, method: node.expression.getText(tree).replace(/^this\./, ''), action, bounded: action !== 'findMany' || properties.includes('take'), select: properties.includes('select'), include: properties.includes('include'), loop: parents.some(p => ts.isForStatement(p) || ts.isForOfStatement(p) || ts.isForInStatement(p) || ts.isWhileStatement(p)), methodName: parents.find(p => ts.isMethodDeclaration(p))?.name?.getText(tree) });
                }
            }
            ts.forEachChild(node, visit);
        }
        visit(tree);
    }
}
walk(path.join(root, 'apps/api/src')); walk(path.join(root, 'apps/web/src'));
fs.writeFileSync(process.argv[2] || '/tmp/finix-code-audit.json', JSON.stringify(report, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ queryCalls: report.queries.length, unboundedFindMany: report.queries.filter(q => !q.bounded).length, queriesInLoops: report.queries.filter(q => q.loop).length, supabaseReferences: report.supabaseReferences.length }));

// Static audit, no application execution or database access. argv: output JSON.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),findings=[],routes=[];
function visitDirectory(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())visitDirectory(file);else if(file.endsWith('.ts')&&!file.endsWith('.d.ts'))scan(file);}}
function decorators(node){return ts.canHaveDecorators(node)?ts.getDecorators(node)||[]:[];}
function argsOfDecorator(node,name){const dec=decorators(node).map(d=>d.expression).find(e=>ts.isCallExpression(e)&&e.expression.getText()===name);return dec?.arguments[0]&&ts.isStringLiteral(dec.arguments[0])?dec.arguments[0].text:undefined;}
function scan(file){const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);function visit(node,ancestors){
 if(ts.isClassDeclaration(node)){
  const prefix=argsOfDecorator(node,'Controller');
  if(prefix!==undefined)for(const method of node.members)if(ts.isMethodDeclaration(method))for(const verb of ['Get','Post','Put','Patch','Delete'])for(const dec of decorators(method))if(ts.isCallExpression(dec.expression)&&dec.expression.expression.getText(source)===verb){const endpoint=dec.expression.arguments[0];routes.push({file:path.relative(root,file),method:method.name.getText(source),verb:verb.toUpperCase(),path:'/'+[prefix,endpoint&&ts.isStringLiteral(endpoint)?endpoint.text:''].filter(Boolean).join('/')});}
 }
 if(ts.isCallExpression(node)){
  const expression=node.expression.getText(source),line=source.getLineAndCharacterOfPosition(node.getStart(source)).line+1;
  if(/\.(findMany|findUnique|findFirst|count|aggregate|groupBy)$/.test(expression)&&expression.includes('prisma')){
   const loop=ancestors.some(a=>ts.isForStatement(a)||ts.isForOfStatement(a)||ts.isForInStatement(a)||ts.isWhileStatement(a)||ts.isCallExpression(a)&&/\.(map|forEach)$/.test(a.expression.getText(source)));
   const literal=node.arguments[0]?.getText(source)||'',method=[...ancestors].reverse().find(a=>ts.isMethodDeclaration(a));
   findings.push({file:path.relative(root,file),line,method:method?.name?.getText(source),query:expression,loop,unbounded:expression.endsWith('findMany')&&!/take:|take,/.test(literal),select:/select:/.test(literal)});
  }
  if(expression==='fetch'&&!/signal/.test(node.arguments[1]?.getText(source)||''))findings.push({file:path.relative(root,file),line,query:'fetch without explicit signal'});
 }
 ts.forEachChild(node,child=>visit(child,[...ancestors,node]));}visit(source,[]);}
visitDirectory(path.join(root,'apps/api/src'));
const summary={queryCalls:findings.filter(x=>x.query.includes('prisma')).length,loopSites:findings.filter(x=>x.loop).length,unboundedFindMany:findings.filter(x=>x.unbounded).length,fetchWithoutExplicitSignal:findings.filter(x=>x.query.startsWith('fetch')).length,controllerRoutes:routes.length};
fs.writeFileSync(process.argv[2],JSON.stringify({caution:'Static candidates, not all violations. Includes server-internal full ledgers and tests; permission helpers and dynamic query construction require manual review.',summary,findings,routes},null,2));console.log(JSON.stringify(summary));

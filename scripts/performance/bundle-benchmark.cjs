// argv: baseline web dist, current web dist, baseline admin dist, current admin dist, output JSON
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {init,parse}=require('es-module-lexer');
(async()=>{
 await init;
 function inspect(root){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const entry=html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)[1].replace(/^\//,'');
  const closure=new Set();
  function visit(file){if(closure.has(file))return;closure.add(file);const source=fs.readFileSync(path.join(root,file),'utf8');for(const imp of parse(source)[0])if(imp.d===-1&&imp.n?.startsWith('.'))visit(path.posix.normalize(path.posix.join(path.posix.dirname(file),imp.n)));}
  visit(entry);
  function sum(files){let raw=0,gzip=0;for(const file of files){const b=fs.readFileSync(path.join(root,file));raw+=b.length;gzip+=zlib.gzipSync(b).length;}return {files:[...files],bytes:raw,gzipBytes:gzip};}
  return {entry:sum([entry]),initialStaticImports:sum(closure),allJavaScript:sum(fs.readdirSync(path.join(root,'assets')).filter(f=>f.endsWith('.js')).map(f=>'assets/'+f))};
 }
 const [wb,wa,ab,aa,out]=process.argv.slice(2);
 const data={conditions:'Production bundles, gzip default Node zlib, initial static-import closure excludes dynamic imports. Route measurements separately include dynamically loaded visible sections.',web:{before:inspect(wb),after:inspect(wa)},admin:{before:inspect(ab),after:inspect(aa)}};
 fs.writeFileSync(out,JSON.stringify(data,null,2));
 console.log(JSON.stringify(Object.fromEntries(['web','admin'].map(name=>[name,Object.fromEntries(['before','after'].map(phase=>[phase,{entry:data[name][phase].entry.bytes,entryGzip:data[name][phase].entry.gzipBytes,staticClosureGzip:data[name][phase].initialStaticImports.gzipBytes,totalJavaScriptGzip:data[name][phase].allJavaScript.gzipBytes}]))]))));
})().catch(e=>{console.error(e);process.exitCode=1});

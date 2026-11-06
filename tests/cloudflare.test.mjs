import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker,{storage} from '../worker.mjs';
function database(){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE records(key TEXT PRIMARY KEY,value TEXT NOT NULL)');return {prepare(sql){return {bind(...values){const s=db.prepare(sql);return {first:async()=>s.get(...values)||null,all:async()=>({results:s.all(...values)}),run:async()=>s.run(...values)}}}}}}
test('D1 SQL réel : pagination, préfixes, modification et absence',async()=>{
 const s=storage(database());assert.equal(await s.get('missing'),null);
 for(let i=0;i<501;i++)await s.put('attempts/'+String(i).padStart(4,'0'),'{}');await s.put('submissions/1','{}');
 const a=await s.list({prefix:'attempts/'});assert.equal(a.objects.length,500);assert.equal(a.truncated,true);
 const b=await s.list({prefix:'attempts/',cursor:a.cursor});assert.equal(b.objects.length,1);assert.equal(b.truncated,false);
 await s.put('attempts/0000','updated');assert.equal(await(await s.get('attempts/0000')).text(),'updated');
});
test('authentification et résultats persistés via Worker et D1',async()=>{
 const env={DB:database(),ADMIN_PASSWORD:'test-only'};
 const call=(path,body,cookie)=>worker.fetch(new Request('https://test.workers.dev'+path,{method:body?'POST':'GET',headers:cookie?{cookie}:{},body:body?JSON.stringify(body):undefined}),env);
 assert.equal((await call('/api/admin/results')).status,401);
 const login=await call('/api/admin/login',{password:'test-only'});const cookie=login.headers.get('set-cookie').split(';')[0];
 const a=await(await call('/api/start',{nom:'Durand',prenom:'Alice'})).json();assert.ok(a.token);
 const p=await call('/api/progress',{token:a.token,answers:{1:['A']},confirmed:[],current:0});assert.equal(p.status,200);
 const rows=await(await call('/api/admin/results',null,cookie)).json();assert.equal(rows.results.length,1);assert.equal(rows.results[0].prenom,'Alice');
});
test('Netlify : succès validé, suspension, erreur réseau et fausse page 200',async()=>{
 const original=globalThis.fetch;const bytes=new TextEncoder().encode('expected');const hash=Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');let fallback=0;
 const env={NETLIFY_ORIGIN:'https://test.netlify.app',ASSET_HASHES:{'/index.html':hash},ASSETS:{fetch:async()=>{fallback++;return new Response('backup')}}};
 try{
  for(const response of [()=>new Response(bytes),()=>new Response('paused',{status:402}),()=>{throw Error('offline')},()=>new Response('paused',{status:200})]){
   globalThis.fetch=async()=>response();const r=await worker.fetch(new Request('https://quiz.workers.dev/'),env);assert.equal(await r.text(),fallback?'backup':'expected');
  }
  assert.equal(fallback,3);
 }finally{globalThis.fetch=original}
});
test('API indépendante de Netlify : aucun appel externe ni redirection',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('Netlify ne doit pas être appelé')};
 try{const r=await worker.fetch(new Request('https://quiz.workers.dev/api/questions'),{DB:database(),ADMIN_PASSWORD:'test',NETLIFY_ORIGIN:'https://paused.netlify.app'});assert.equal(r.status,200);assert.ok((await r.json()).length>0)}finally{globalThis.fetch=original}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';
function load() {
 const jar = new Map();
 const env = { CANVA_CLIENT_ID:'test', CANVA_CLIENT_SECRET:'secret', CANVA_REDIRECT_URI:'https://studio.example/api/canva/callback', CANVA_COOKIE_KEY:'ab'.repeat(32) };
 const module = { exports:{} };
 const js = ts.transpileModule(fs.readFileSync('src/lib/canva/server.ts','utf8'), { compilerOptions:{ module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022 } }).outputText;
 vm.runInNewContext(js, { exports:module.exports, module, Buffer, Date, Response, AbortSignal, URLSearchParams, process:{env}, require(name) {
  if(name==='server-only') return {};
  if(name==='node:crypto') return crypto;
  if(name==='next/headers') return {cookies:async()=>({get:key=>jar.get(key),set:(key,value)=>jar.set(key,{value})})};
  throw new Error(name);
 }});
 return {...module.exports,env,jar};
}
test('tickets reject tampering, other users, wrong purpose and expiry',()=>{
 const c=load(), value=c.ticket('alice','design','design-id');
 assert.equal(c.readTicket(value,'alice','design'),'design-id');
 assert.throws(()=>c.readTicket(value,'bob','design'));
 assert.throws(()=>c.readTicket(value,'alice','asset'));
 const bytes=Buffer.from(value,'base64url');bytes[35]^=1;
 assert.throws(()=>c.readTicket(bytes.toString('base64url'),'alice','design'));
 assert.throws(()=>c.readTicket(c.seal({userId:'alice',kind:'design',id:'x',expires:0}),'alice','design'));
});
test('connection is encrypted and bound to the Studio user',async()=>{
 const c=load();await c.storeTokens('alice',{access_token:'access',refresh_token:'refresh',expires_in:3600});
 assert.equal((await c.session('alice')).access,'access');
 assert.equal(await c.session('bob'),null);
 assert.ok(!c.jar.get(c.SESSION).value.includes('refresh'));
});
test('curated library enforces allowlist and rejects path injection',()=>{
 const c=load();c.env.CANVA_TEMPLATE_IDS='template_a, template_b';
 c.allowedTemplate('template_a');
 assert.throws(()=>c.allowedTemplate('template_c'));
 assert.throws(()=>c.allowedTemplate('../oauth/token'));
});
test('missing encryption configuration fails closed',()=>{
 const c=load();delete c.env.CANVA_COOKIE_KEY;
 assert.equal(c.configured(),false);assert.throws(()=>c.seal({token:'secret'}));
});
function route({signedIn=true,dataset={HEADLINE:{type:'text'},PRODUCT_IMAGE:{type:'image'}},providerFailure=false}={}) {
 const security=load();const calls=[];
 const module={exports:{}};
 const js=ts.transpileModule(fs.readFileSync('src/app/api/canva/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const api={...security,accessToken:async()=> 'token',canva:async(token,path,init)=>{
  calls.push({path,init});if(providerFailure)throw new security.CanvaError('Provider unavailable',502);
  if(path.endsWith('/dataset'))return {dataset};
  if(path==='/autofills')return {job:{id:'job',status:'in_progress'}};
  throw new Error(path);
 }};
 const mocks={
  'next/headers':{},'@/lib/insforge/server':{getSessionUser:async()=>signedIn?{id:'alice'}:null},
  '@/lib/insforge/admin':{},'@/lib/upload':{UploadError:class extends Error{}},
  '@/lib/higgsfield/guard':{guard:()=>null},'@/lib/canva/server':api,
 };
 vm.runInNewContext(js,{exports:module.exports,module,Response,URL,Buffer,process:{env:{}},require:name=>{if(name in mocks)return mocks[name];throw new Error(name);}});
 return {...module.exports,security,calls};
}
const generate=fields=>new Request('https://studio.example/api/canva?action=generate',{method:'POST',body:JSON.stringify({templateId:'template_a',fields})});
test('generation requires a Studio sign-in before accessing Canva',async()=>{
 const r=route({signedIn:false});assert.equal((await r.POST(generate({}))).status,401);assert.equal(r.calls.length,0);
});
test('generation validates live fields and never silently submits incomplete content',async()=>{
 const r=route();assert.equal((await r.POST(generate({HEADLINE:'Sale'}))).status,400);
 assert.equal(r.calls.filter(c=>c.path==='/autofills').length,0);
});
test('generation uses server-validated image tickets and the real Canva data schema',async()=>{
 const r=route();const image=r.security.ticket('alice','asset','image-id');
 const response=await r.POST(generate({HEADLINE:' Sale ',PRODUCT_IMAGE:image}));assert.equal(response.status,200);
 const payload=JSON.parse(r.calls.find(c=>c.path==='/autofills').init.body);
 assert.equal(payload.brand_template_id,'template_a');assert.equal(payload.data.HEADLINE.text,'Sale');assert.equal(payload.data.PRODUCT_IMAGE.asset_id,'image-id');
 assert.ok((await response.json()).ticket);
});
test('provider failure returns an error without a fake successful generation',async()=>{
 const r=route({providerFailure:true});assert.equal((await r.POST(generate({}))).status,502);
});

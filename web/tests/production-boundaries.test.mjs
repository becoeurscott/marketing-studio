import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import path from 'node:path';
import sharp from 'sharp';
const root = process.env.REVIEW_SOURCE_ROOT || process.cwd();
function load(file, mocks = {}) {
  const js = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(js, {
    exports: module.exports, module,
    require: name => { if (name in mocks) return mocks[name]; throw new Error(`Unexpected dependency ${name}`); },
    Request, Response, URL, Date, Map, Number, Math, AbortSignal, Blob, Buffer, Uint8Array,
    fetch: mocks.fetch, process: { env: {} }, console: { error() {} },
  });
  return module.exports;
}
const request = headers => new Request('https://app.example/api/hf/generate', { headers });
test('origin guard rejects malformed and cross-origin requests, accepts native requests', () => {
  const { createGuard } = load('src/lib/higgsfield/guard.ts');
  const guard = createGuard();
  assert.equal(guard(request({origin:'not-a-url'}), {limit:10}).status, 403);
  assert.equal(guard(request({origin:'https://attacker.example'}), {limit:10}).status, 403);
  assert.equal(guard(request({origin:'https://app.example/path'}), {limit:10}).status, 403);
  assert.equal(guard(request({origin:'https://app.example'}), {limit:10}), null);
  assert.equal(guard(request({authorization:'Bearer native'}), {limit:10}), null);
});
test('rate limiting is bounded by a fixed window and returns a retry time', () => {
  let now = 0;
  const guard = load('src/lib/higgsfield/guard.ts').createGuard(() => now);
  assert.equal(guard(request({}), {limit:1}), null);
  const blocked = guard(request({}), {limit:1});
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('retry-after'), '3600');
  now = 3600000;
  assert.equal(guard(request({}), {limit:1}), null);
});
function route({submitFailure = false, attachFailure = false, balanceFailure = false} = {}) {
  let refunds = 0;
  const account = {
    InsufficientCreditsError: class extends Error {}, jobCost:()=>5,
    startJob: async()=> 'job-id', refundJob: async()=>{refunds++},
    accountSummary: async()=>{if(balanceFailure) throw new Error('db unavailable');return {credits:15}},
  };
  const { POST } = load('src/app/api/hf/generate/route.ts', {
    '@/lib/account': account, '@/lib/higgsfield/guard':{guard:()=>null},
    '@/lib/higgsfield/server':{
      toModelInput:()=>{}, submit:async()=>{if(submitFailure)throw new Error('provider rejected');return {requestId:'provider-id',status:'queued'}},
      errorResponse:()=>Response.json({error:'failed'},{status:502}),
    },
    '@/lib/insforge/server':{getSessionUser:async()=>({id:'user'})},
    '@/lib/jobs':{attachRequest:async()=>{if(attachFailure)throw new Error('db unavailable')}},
  });
  return { POST, refunds:()=>refunds };
}
const generationRequest = () => new Request('https://app.example/api/hf/generate', {
  method:'POST', body:JSON.stringify({kind:'image',prompt:'photo'}),
});
test('provider rejection refunds the debit', async()=>{
  const r = route({submitFailure:true});
  assert.equal((await r.POST(generationRequest())).status,502);assert.equal(r.refunds(),1);
});
test('a balance read failure after provider acceptance does not refund or lose the job', async()=>{
  const r = route({balanceFailure:true});const response=await r.POST(generationRequest());
  assert.equal(response.status,200);assert.equal((await response.json()).requestId,'job-id');assert.equal(r.refunds(),0);
});
test('an attachment failure after provider acceptance is reported without refunding', async()=>{
  const r = route({attachFailure:true});assert.equal((await r.POST(generationRequest())).status,503);assert.equal(r.refunds(),0);
});
function jobs({uploadFailure = false, holdUpload = false} = {}) {
  const row={id:'job',user_id:'user',hf_request_id:'provider',kind:'image',status:'queued',outputs:[],finalized:false,refunded:false,updated_at:'2020-01-01T00:00:00Z'};
  let uploadCount=0; let release;
  const wait = new Promise(resolve=>{release=resolve});
  const db={from(){
    let update;const filters=[];
    const query={select(){return query},eq(k,v){filters.push([k,v]);return query},limit(){return query},update(v){update=v;return query},
      then(resolve,reject){return Promise.resolve().then(()=>{
        if(!filters.every(([k,v])=>row[k]===v))return {data:[],error:null};
        if(update)Object.assign(row,update);
        return {data:[structuredClone(row)],error:null};
      }).then(resolve,reject)},
    };return query;
  }};
  const {syncJob}=load('src/lib/jobs.ts',{
    'server-only':{}, './insforge/admin':{MEDIA_BUCKET:'media',adminClient:()=>({database:db,storage:{from:()=>({upload:async()=>{
      uploadCount++;if(holdUpload)await wait;
      if(uploadFailure)return {error:{message:'storage unavailable'}};
      return {data:{url:'https://durable.example/result.jpg',key:'u/user/jobs/job/0.jpg'}};
    }})}})},
    './higgsfield/server':{getJob:async()=>({status:'completed',images:['https://provider.example/temp.jpg'],videoUrl:null})},
    './account':{refundJob:async()=>{throw new Error('unexpected refund')}},
    fetch:async()=>new Response('image',{headers:{'Content-Type':'image/jpeg'}}),
  });
  return {syncJob,row,release,uploads:()=>uploadCount};
}
test('storage failure remains retryable and never saves expiring provider URLs', async()=>{
  const j=jobs({uploadFailure:true});const result=await j.syncJob('user','job');
  assert.equal(result.status,'in_progress');assert.equal(j.row.finalized,false);assert.equal(j.row.outputs.length,0);
});
test('concurrent poll cannot report completion before durable output is saved', async()=>{
  const j=jobs({holdUpload:true});const first=j.syncJob('user','job');
  for(let i=0;i<20&&j.uploads()===0;i++)await new Promise(resolve=>setImmediate(resolve));
  const second=await j.syncJob('user','job');assert.equal(second.status,'in_progress');assert.equal(j.uploads(),1);
  j.release();const result=await first;assert.equal(result.status,'completed');assert.equal(j.row.finalized,true);assert.equal(result.images[0],'https://durable.example/result.jpg');
});

test('upload size is enforced while streaming even without content-length', async()=>{
  const {readUpload,MAX_UPLOAD_BYTES}=load('src/lib/upload.ts',{sharp});
  const body=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(MAX_UPLOAD_BYTES));controller.enqueue(new Uint8Array(1));controller.close()}});
  await assert.rejects(readUpload(new Request('https://app.example/upload',{method:'POST',body,duplex:'half'})),error=>error.status===413);
});
test('upload rejects a fake image and a mismatched MIME header', async()=>{
  const {normalizePhoto}=load('src/lib/upload.ts',{sharp});
  const photo=await sharp({create:{width:8,height:8,channels:3,background:'#ff7700'}}).png().toBuffer();
  for(const body of ['not an image',photo]){
    await assert.rejects(normalizePhoto(new Request('https://app.example/upload',{method:'POST',headers:{'content-type':'image/jpeg'},body})),error=>error.status===422);
  }
});
test('valid photos are decoded, converted, and stripped of metadata', async()=>{
  const {normalizePhoto}=load('src/lib/upload.ts',{sharp});
  const input=await sharp({create:{width:8,height:8,channels:3,background:'#ff7700'}}).withMetadata().png().toBuffer();
  const output=await normalizePhoto(new Request('https://app.example/upload',{method:'POST',headers:{'content-type':'image/png'},body:input}));
  const info=await sharp(output).metadata();
  assert.equal(info.format,'jpeg');assert.equal(info.width,8);assert.equal(info.exif,undefined);assert.equal(info.icc,undefined);
});

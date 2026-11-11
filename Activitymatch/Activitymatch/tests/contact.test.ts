import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { pool } from "../server/db";
import { migrateContactSchema } from "../server/migrate";
import { cleanupExpiredData } from "../server/cleanup";
import { registerContactRoutes } from "../server/contact";

const postgres = new PGlite();
const adapter = async (config:any, params?:any[]) => {
  const sql=typeof config==='string'?config:config.text;
  const result=await postgres.query(sql,params);
  return { ...result, rowCount:result.affectedRows, rows:config.rowMode==='array'?result.rows.map((r:any)=>result.fields.map((f:any)=>r[f.name])):result.rows };
};
(pool as any).query=adapter;
(pool as any).connect=async()=>({query:adapter,release(){}});
const endpoints=new Map<string,any>();
const app:any={};
for(const verb of ['get','post','patch','delete']) app[verb]=(path:string,handler:any)=>endpoints.set(`${verb} ${path}`,handler);
registerContactRoutes(app);
const sent:any[]=[];
process.env.APP_BASE_URL='https://activitymatch.example';
process.env.RESEND_API_KEY='test-not-a-real-key';
process.env.EMAIL_FROM='ActivityMatch <test@mail.activitymatch.example>';
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url:any,options:any)=>{
  assert.equal(url,'https://api.resend.com/emails');
  sent.push(JSON.parse(options.body));
  return new Response(JSON.stringify({id:'simulated'}),{status:200});
};
async function call(verb:string,path:string,body:any={},params:any={},token?:string,ip='127.0.0.1') {
  let status=200;let result:any;const headers:any={};
  const req:any={body,params,query:{},ip,headers:token?{authorization:`Bearer ${token}`}:{}};
  const res:any={setHeader(k:string,v:string){headers[k]=v;},status(value:number){status=value;return this;},json(value:any){result=value;return this;}};
  await endpoints.get(`${verb} ${path}`)(req,res,()=>{});
  return {status,body:result,headers};
}
const tokenFrom=(mail:any,path:string)=>mail.text.match(new RegExp(path+'#([a-f0-9]{64})'))?.[1];
try {
  await migrateContactSchema();
  await migrateContactSchema();
  assert.equal(endpoints.has('get /api/email-actions/confirm'),false,'GET must not consume links');
  const listing={name:'Patrick',age:37,gender:'Keine Angabe',city:'Ingolstadt',category:'Sport',title:'Rennradrunde am Samstag',description:'Gemeinsam eine lockere Runde fahren.',level:'Amateur',activityDate:'2026-12-01',activityTime:'10:00',contactEmail:'patrick@example.com',contactPhone:'',consent:true};
  const create=await call('post','/api/listings',listing);
  assert.equal(create.status,202);assert.equal(sent.length,1);
  assert.equal(create.body.secretKey,undefined);
  const token=tokenFrom(sent[0],'/email-action');
  const manage=tokenFrom(sent[0],'/manage/1');
  assert.ok(token);assert.ok(manage);
  assert.deepEqual((await call('get','/api/listings')).body,[]);
  assert.equal((await call('get','/api/listings/:id',{}, {id:'1'})).status,404);
  assert.equal((await call('get','/api/manage/:id',{}, {id:'1'},manage)).status,403);
  assert.equal((await call('post','/api/email-actions/confirm',{token})).status,200);
  const publicRows=(await call('get','/api/listings')).body;
  assert.equal(publicRows.length,1);assert.equal(publicRows[0].canContact,true);
  for(const name of ['contactEmail','contactPhone','secretKey','manageHash','emailVerified','published']) assert.ok(!(name in publicRows[0]),name+' leaked');
  assert.deepEqual((await call('get','/api/listings/:id',{}, {id:'1'})).body,publicRows[0]);
  assert.equal((await call('post','/api/email-actions/confirm',{token})).status,200);
  const data={name:'Lisa',email:'lisa@example.com',message:'Hallo Patrick, ich würde gerne mitfahren!',consent:true,website:''};
  assert.equal((await call('post','/api/listings/:id/contact',{...data,consent:false},{id:'1'})).status,400);
  assert.equal((await call('post','/api/listings/:id/contact',data,{id:'1'})).status,202);
  assert.equal(sent.length,2);assert.equal(sent[1].to[0],data.email);
  const contactToken=tokenFrom(sent[1],'/email-action');
  assert.equal((await call('post','/api/email-actions/confirm',{token:contactToken})).status,200);
  assert.equal(sent.length,3);assert.equal(sent[2].to[0],listing.contactEmail);assert.equal(sent[2].reply_to,data.email);assert.ok(sent[2].text.includes(data.message));
  assert.equal((await call('post','/api/email-actions/confirm',{token:contactToken})).status,200);
  assert.equal(sent.length,3,'consumed link forwarded twice');
  const changes={title:'Neue Rennradrunde am Sonntag',description:listing.description,city:listing.city,category:listing.category,level:listing.level,activityDate:'',activityTime:'',contactEnabled:false};
  assert.equal((await call('patch','/api/manage/:id',changes,{id:'1'},'a'.repeat(64))).status,403);
  assert.equal((await call('patch','/api/manage/:id',changes,{id:'1'},manage)).status,200);
  assert.equal((await call('get','/api/listings/:id',{}, {id:'1'})).body.title,changes.title);
  assert.equal((await call('post','/api/listings/:id/contact',data,{id:'1'})).status,409);
  assert.equal((await call('patch','/api/manage/:id',{...changes,contactEnabled:true},{id:'1'},manage)).status,200);
  assert.equal((await call('post','/api/listings/:id/contact',data,{id:'1'})).status,202);
  const expired=tokenFrom(sent.at(-1),'/email-action');
  await postgres.query("UPDATE email_actions SET expires_at=now()-interval '1 hour' WHERE kind='message'");
  assert.equal((await call('post','/api/email-actions/confirm',{token:expired})).status,410);
  // Endpoint limits survive within persistent PostgreSQL state.
  for(let i=0;i<8;i++) await call('post','/api/listings/:id/contact',data,{id:'1'});
  assert.equal((await call('post','/api/listings/:id/contact',data,{id:'1'})).status,429);
  // Revocation while awaiting confirmation must stop the pending request.
  assert.equal((await call('post','/api/listings/:id/contact',{...data,email:'other@example.com'},{id:'1'},undefined,'127.0.0.2')).status,202);
  const pendingToken=tokenFrom(sent.at(-1),'/email-action');
  assert.equal((await call('patch','/api/manage/:id',changes,{id:'1'},manage)).status,200);
  assert.equal((await call('post','/api/email-actions/confirm',{token:pendingToken})).status,409);
  // Provider failure cannot publish a pending listing.
  globalThis.fetch=async()=>new Response('{}',{status:503});
  assert.equal((await call('post','/api/listings',{...listing,contactEmail:'new@example.com'}, {},undefined,'127.0.0.3')).status,503);
  assert.equal((await postgres.query('SELECT count(*)::int AS n FROM listings')).rows[0].n,1);
  assert.equal((await call('delete','/api/manage/:id',{}, {id:'1'},manage)).status,200);
  assert.deepEqual((await call('get','/api/listings')).body,[]);
  assert.equal((await call('post','/api/email-actions/confirm',{token})).status,410);
  // Existing data remains visible, but old unverified addresses cannot receive requests.
  await postgres.query("INSERT INTO listings(name,age,gender,city,category,title,description,level,contact_email,secret_key) VALUES('Alt',30,'Keine Angabe','Berlin','Sport','Alte Anzeige','Vorhandene Beschreibung','Amateur','old@example.com','legacy-key')");
  assert.equal((await call('get','/api/listings')).body[0].canContact,false);
  await postgres.query("INSERT INTO listings(name,age,gender,city,category,title,description,level,secret_key,published,created_at) VALUES('Test',30,'Keine Angabe','Berlin','Sport','Abgelaufene Anzeige','Vorhandene Beschreibung','Amateur','temporary',false,now()-interval '2 days')");
  await cleanupExpiredData();
  assert.equal((await postgres.query('SELECT count(*)::int AS n FROM listings')).rows[0].n,1);
  console.log('PASS: migrations, private public API, hidden pending listing, confirmation, duplicate prevention, reply-to, validation, management authorization, edits, contact pause, expiry, rate limit, provider failure and cascade deletion. No real emails sent.');
} finally {
  globalThis.fetch=originalFetch;
  await postgres.close();
  await pool.end();
}

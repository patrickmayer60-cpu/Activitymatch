import { registerAdminDashboard } from "../server/admin-dashboard";
import { requireAdmin } from "../server/routes";
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
for(const verb of ['get','post','patch','delete']) app[verb]=(path:string,...handlers:any[])=>endpoints.set(`${verb} ${path}`,async(req:any,res:any)=>{
  for(const handler of handlers){let next=false;await handler(req,res,()=>{next=true;});if(!next)break;}
});
registerContactRoutes(app);
registerAdminDashboard(app,requireAdmin);
const sent:any[]=[];
process.env.APP_BASE_URL='https://activitymatch.example';
process.env.RESEND_API_KEY='test-not-a-real-key';
process.env.EMAIL_FROM='ActivityMatch <test@mail.activitymatch.example>';
const originalFetch=globalThis.fetch;
const simulatedFetch:typeof fetch=async(url:any,options:any)=>{
  assert.equal(url,'https://api.resend.com/emails');
  sent.push(JSON.parse(options.body));
  return new Response(JSON.stringify({id:'simulated'}),{status:200});
};
globalThis.fetch=simulatedFetch;
async function call(verb:string,path:string,body:any={},params:any={},token?:string,ip='127.0.0.1',admin=false) {
  let status=200;let result:any;const headers:any={};
  const req:any={body,params,query:verb==='get'?body:{},ip,session:{isAdmin:admin},headers:token?{authorization:`Bearer ${token}`}:{}};
  const res:any={setHeader(k:string,v:string){headers[k]=v;},status(value:number){status=value;return this;},json(value:any){result=value;return this;}};
  await endpoints.get(`${verb} ${path}`)(req,res,()=>{});
  return {status,body:result,headers};
}
const tokenFrom=(mail:any,path:string)=>mail.text.match(new RegExp(path+'(?:\\?lang=(?:de|en))?#([a-f0-9]{64})'))?.[1];
try {
  await migrateContactSchema();
  await migrateContactSchema();
  assert.equal(endpoints.has('get /api/email-actions/confirm'),false,'GET must not consume links');
  const listing={name:'Patrick',age:37,gender:'Keine Angabe',city:'Ingolstadt',category:'Rennrad',title:'Rennradrunde am Samstag',description:'Gemeinsam eine lockere Runde fahren.',level:'Amateur',activityDate:'2026-12-01',activityTime:'10:00',contactEmail:'patrick@example.com',contactPhone:'',consent:true};
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
  for(const route of ['/api/admin/dashboard','/api/admin/listings','/api/admin/contacts']) {
    assert.equal((await call('get',route)).status,401,'private API must reject unsigned requests');
  }
  const adminCall=(path:string,query:any={})=>call('get',path,query,{},undefined,'127.0.0.9',true);
  const summary=await adminCall('/api/admin/dashboard');
  assert.equal(summary.status,200);
  assert.equal(summary.body.published,1);
  assert.equal(summary.body.confirmedAddresses,1);
  assert.equal(summary.body.publications30,1);
  assert.equal(summary.body.contacts30,1,'duplicate/expired/failed requests must not inflate metrics');
  assert.equal(summary.body.daily.length,30);
  const contactList=await adminCall('/api/admin/contacts');
  assert.equal(contactList.body.total,1);
  assert.equal(contactList.body.items[0].email,listing.contactEmail);
  const privateRows=await adminCall('/api/admin/listings');
  assert.equal(privateRows.body.items[0].contactEmail,listing.contactEmail);
  assert.equal(privateRows.body.items[0].secretKey,undefined);
  assert.equal(privateRows.body.items[0].manageHash,undefined);
  assert.equal((await adminCall('/api/admin/listings',{page:'bad'})).status,400);
  assert.equal((await adminCall('/api/admin/contacts',{search:'does-not-exist'})).body.total,0);
  await postgres.query("INSERT INTO listings(name,age,gender,city,category,title,description,level,contact_email,secret_key,email_verified) VALUES('Neu',40,'Keine Angabe','Berlin','Sport','Weitere Anzeige','Vorhandene Beschreibung','Amateur','PATRICK@example.com','duplicate',true)");
  const duplicate=await adminCall('/api/admin/contacts');
  assert.equal(duplicate.body.total,1);
  assert.equal(duplicate.body.items[0].listingCount,2);
  assert.equal(duplicate.body.items[0].name,'Neu');
  await postgres.query("DELETE FROM listings WHERE secret_key='duplicate'");
  assert.equal((await call('delete','/api/manage/:id',{}, {id:'1'},manage)).status,200);
  assert.deepEqual((await call('get','/api/listings')).body,[]);
  assert.equal((await adminCall('/api/admin/contacts')).body.total,0,'last listing removal must remove contact');
  const retained=(await adminCall('/api/admin/dashboard')).body;
  assert.equal(retained.publications30,1,'aggregate history survives deletion');
  assert.equal(retained.contacts30,1);
  assert.equal((await call('post','/api/email-actions/confirm',{token})).status,410);
  // Existing data remains visible, but old unverified addresses cannot receive requests.
  await postgres.query("INSERT INTO listings(name,age,gender,city,category,title,description,level,contact_email,secret_key) VALUES('Alt',30,'Keine Angabe','Berlin','Sport','Alte Anzeige','Vorhandene Beschreibung','Amateur','old@example.com','legacy-key')");
  assert.equal((await call('get','/api/listings')).body[0].canContact,false);
  await postgres.query("INSERT INTO listings(name,age,gender,city,category,title,description,level,secret_key,published,created_at) VALUES('Test',30,'Keine Angabe','Berlin','Sport','Abgelaufene Anzeige','Vorhandene Beschreibung','Amateur','temporary',false,now()-interval '2 days')");
  await cleanupExpiredData();
  assert.equal((await postgres.query('SELECT count(*)::int AS n FROM listings')).rows[0].n,1);
  // English creator and sender: canonical category, localized links and emails.
  globalThis.fetch=simulatedFetch;
  const englishListing={...listing,language:'en',category:'Laufen',contactEmail:'english@example.com'};
  assert.equal((await call('post','/api/listings',englishListing,{},undefined,'127.0.0.20')).status,202);
  assert.match(sent.at(-1).subject,/Please confirm/);
  assert.ok(sent.at(-1).text.includes('?lang=en#'));
  const englishToken=tokenFrom(sent.at(-1),'/email-action');
  assert.ok(englishToken);
  const englishConfirmed=await call('post','/api/email-actions/confirm',{token:englishToken},{},undefined,'127.0.0.20');
  assert.equal(englishConfirmed.status,200);
  const englishId=String(englishConfirmed.body.listingId);
  assert.equal((await call('get','/api/listings',{category:'Laufen'})).body.length,1);
  assert.equal((await call('post','/api/listings/:id/contact',{...data,language:'en',email:'sender-en@example.com'},{id:englishId},undefined,'127.0.0.21')).status,202);
  assert.match(sent.at(-1).subject,/Confirm your/);
  const enContactToken=tokenFrom(sent.at(-1),'/email-action');
  assert.equal((await call('post','/api/email-actions/confirm',{token:enContactToken},{},undefined,'127.0.0.21')).status,200);
  assert.match(sent.at(-1).subject,/New enquiry/);
  assert.equal(sent.at(-1).reply_to,'sender-en@example.com');
  const languageStats=(await adminCall('/api/admin/dashboard')).body;
  assert.ok(languageStats.categories.some((c:any)=>c.label==='Laufen'&&c.count===1));
  console.log('PASS: migrations, private public API, hidden pending listing, confirmation, duplicate prevention, reply-to, validation, management authorization, edits, contact pause, expiry, rate limit, provider failure and cascade deletion. No real emails sent.');
} finally {
  globalThis.fetch=originalFetch;
  await postgres.close();
  await pool.end();
}

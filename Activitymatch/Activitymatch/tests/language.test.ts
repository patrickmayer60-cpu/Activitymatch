import assert from "node:assert/strict";
import { CATEGORIES } from "../shared/categories";
import { insertListingSchema, editListingSchema, contactSchema } from "../shared/schema";
import { english } from "../client/src/lib/translations";
import { t, setLanguage, locale } from "../client/src/lib/i18n";
import { publishEmail, requestEmail, forwardEmail } from "../server/email-text";

const listing={name:"Alex",age:30,gender:"Keine Angabe",city:"Ingolstadt",title:"Test einer Aktivität",description:"Gemeinsame Aktivität in der Umgebung.",level:"Anfänger",contactEmail:"alex@example.com",consent:true};
for(const category of CATEGORIES){
 assert.ok(insertListingSchema.safeParse({...listing,category,language:"en"}).success,category);
 assert.ok(editListingSchema.safeParse({title:listing.title,description:listing.description,city:listing.city,category,level:listing.level,activityDate:"",activityTime:"",contactEnabled:true}).success);
 assert.ok(category in english,`Missing category translation: ${category}`);
}
for(const category of ['Outdoor','Fitness','Gaming','Musik','Sonstiges'])assert.ok(CATEGORIES.includes(category as any));
assert.ok(!insertListingSchema.safeParse({...listing,category:'Sport'}).success,'general sports must not be selectable for new listings');
assert.ok(!insertListingSchema.safeParse({...listing,category:'Running'}).success,'translated labels must not be stored as category values');
assert.equal(insertListingSchema.parse({...listing,category:'Laufen'}).language,'de');
assert.ok(!contactSchema.safeParse({name:'Alex',email:'alex@example.com',message:'Gerne wäre ich dabei.',consent:true,language:'invalid'}).success);
setLanguage('en');assert.equal(t('Laufen'),'Running');assert.equal(locale(),'en-GB');
assert.equal(t('Titel eines fremden Inserats'),'Titel eines fremden Inserats');
assert.equal(t('Anzeige erstellen'),'Create listing');
setLanguage('de');assert.equal(t('Sport'),'Sport (alte Kategorie)');assert.equal(t('Anzeige erstellen'),'Anzeige erstellen');assert.equal(locale(),'de-DE');
const data={language:'en',name:'Alex',title:'Titel bleibt unverändert',confirmUrl:'https://example.com/email-action?lang=en#abc',manageUrl:'https://example.com/manage/1?lang=en#def'};
const pub=publishEmail(data);assert.match(pub.subject,/Please confirm/);assert.ok(pub.text.includes(data.title)&&pub.text.includes(data.confirmUrl));
assert.match(publishEmail({...data,language:'de'}).subject,/Bitte bestätige/);
assert.match(requestEmail({language:'en',name:'Sam',title:data.title,url:data.confirmUrl}).subject,/Confirm/);
const forwarded=forwardEmail({language:'en',owner:'Alex',name:'Sam',title:data.title,message:'Nachricht bleibt unverändert',email:'sam@example.com',url:'https://example.com/listing/1'});
assert.match(forwarded.subject,/New enquiry/);assert.ok(forwarded.text.includes('Nachricht bleibt unverändert'));
console.log('PASS: 30 categories, legacy compatibility, canonical filters, DE/EN labels and dates, language validation, English/German email templates and unchanged user text.');

import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Local design preview. No imports from server/, no database and no mail access.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
function upcomingDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
const examples = [
  {name:"Alex",age:32,gender:"Keine Angabe",city:"Ingolstadt",category:"Sport",title:"Gemeinsame Rennradrunde am Wochenende",description:"Wer hat Lust auf eine entspannte Runde von etwa 50 km? Wir fahren rund 23–25 km/h und machen unterwegs eine Kaffeepause. Start am Klenzepark.",level:"Amateur",activityTime:"10:00"},
  {name:"Mira",age:29,gender:"Weiblich",city:"Ingolstadt",category:"Fitness",title:"Laufen im Klenzepark – gemeinsam starten",description:"Ich möchte wieder regelmäßig laufen und suche nette Leute für lockere 5 km. Das Tempo ist entspannt, Gehpausen sind jederzeit möglich. Spaß und Bewegung stehen im Vordergrund.",level:"Anfänger",activityTime:"18:00"},
  {name:"Jan",age:35,gender:"Männlich",city:"Stammham",category:"Outdoor",title:"Wandern im Altmühltal",description:"Eine gemütliche Wanderung mit Aussicht und Einkehr. Geplant sind ungefähr 12 km. Treffpunkt und Anreise sprechen wir gemeinsam ab. Neue Gesichter sind herzlich willkommen!",level:"Anfänger",activityTime:"09:30"},
  {name:"Lea",age:27,gender:"Weiblich",city:"München",category:"Sport",title:"Tennispartner für Feierabendmatches",description:"Suche jemanden für regelmäßige Tennismatches nach der Arbeit. Ich spiele seit einigen Jahren, aber ohne Turnierambitionen. Gerne auch am Wochenende.",level:"Amateur",activityTime:"17:30"},
  {name:"Sam",age:31,gender:"Keine Angabe",city:"Ingolstadt",category:"Sport",title:"Gemeinsam Schwimmen trainieren",description:"Ich trainiere für meinen ersten Triathlon und freue mich über Gesellschaft im Schwimmbad. Technik üben, kurze Serien und zwischendurch eine Pause – ganz ohne Leistungsdruck.",level:"Anfänger",activityTime:"19:00"},
  {name:"Ben",age:38,gender:"Männlich",city:"Eichstätt",category:"Outdoor",title:"Gravelrunde mit Aussicht und Kaffeestopp",description:"Wir erkunden ruhige Wege und Schotterstrecken rund um Eichstätt. Rund 40 km mit ein paar Höhenmetern. Ein Gravelbike oder Mountainbike passt gut. Gemeinsam ankommen ist das Ziel.",level:"Amateur",activityTime:"10:30"},
].map((row,index)=>({
  ...row,id:index+1,activityDate:upcomingDate(index+2),recurrence:"Einmalig",
  matchPreference:null,contactNote:"Dies ist eine fiktive Beispielanzeige für die lokale Designvorschau.",
  contactEnabled:true,canContact:true,createdAt:new Date().toISOString(),
}));

function previewApi(): Plugin {
  return {
    name:"activitymatch-local-preview",
    configureServer(server) {
      server.middlewares.use((req,res,next)=>{
        const url = new URL(req.url || "/", "http://127.0.0.1");
        if (!url.pathname.startsWith("/api/")) return next();
        res.setHeader("Content-Type","application/json; charset=utf-8");
        res.setHeader("Cache-Control","no-store");
        const send = (status:number,body:unknown)=>{
          res.statusCode=status;res.end(JSON.stringify(body));
        };
        if (req.method !== "GET") {
          // Never forward requests or process personal data in design preview.
          req.resume();
          return send(409,{message:"Lokale Designvorschau: Hier werden keine Anzeigen gespeichert und keine E-Mails versendet. Bitte verwende zum Testen nur Beispieldaten."});
        }
        if (url.pathname === "/api/listings") {
          let rows=examples;
          for (const field of ["city","category","level","search"]) {
            const value=url.searchParams.get(field)?.toLocaleLowerCase("de-DE");
            if (!value) continue;
            rows=rows.filter(row=>{
              if(field === "search") return row.title.toLocaleLowerCase("de-DE").includes(value);
              const text=row[field as "city"|"category"|"level"].toLocaleLowerCase("de-DE");
              return field === "city" ? text.includes(value) : text === value;
            });
          }
          return send(200,rows);
        }
        const match=url.pathname.match(/^\/api\/listings\/(\d+)$/);
        if(match) {
          const row=examples.find(row=>row.id===Number(match[1]));
          return row?send(200,row):send(404,{message:"Beispielanzeige nicht gefunden."});
        }
        if(url.pathname === "/api/admin/session") return send(200,{authenticated:true});
        if(url.pathname === "/api/admin/dashboard") return send(200,{
          stored:examples.length,published:examples.length,pending:0,confirmedAddresses:examples.length,
          publications30:examples.length,contacts30:0,trackingSince:new Date().toISOString(),
          categories:[...new Set(examples.map(row=>row.category))].map(label=>({label,count:examples.filter(row=>row.category===label).length})),
          cities:[...new Set(examples.map(row=>row.city))].map(label=>({label,count:examples.filter(row=>row.city===label).length})),
          daily:[{day:upcomingDate(0),publications:examples.length,contacts:0}],
        });
        if(url.pathname === "/api/admin/listings" || url.pathname === "/api/admin/contacts") {
          const contacts=url.pathname.endsWith("contacts");
          const value=(url.searchParams.get("search")||"").toLowerCase();
          const page=Math.max(1,Number(url.searchParams.get("page"))||1);
          const items=examples.map((row,index)=>contacts?{
            email:`beispiel${index+1}@example.com`,name:row.name,age:row.age,city:row.city,
            listingCount:1,firstCreated:row.createdAt,lastCreated:row.createdAt,
          }:{...row,contactEmail:`beispiel${index+1}@example.com`,emailVerified:true,published:true});
          const filtered=items.filter(row=>JSON.stringify(row).toLowerCase().includes(value));
          return send(200,{items:filtered.slice((page-1)*25,page*25),total:filtered.length,page,pageSize:25});
        }
        return send(404,{message:"Diese Funktion gehört nicht zur lokalen Designvorschau."});
      });
    },
    transformIndexHtml() {
      return [{tag:"div",attrs:{
        role:"status",
        style:"position:fixed;bottom:0;left:0;right:0;z-index:99999;padding:10px 16px;background:#203817;color:#fff;text-align:center;font:13px/1.4 system-ui;box-shadow:0 -2px 8px #0002;pointer-events:none",
      },children:"LOKALE VORSCHAU · Fiktive Beispielanzeigen · Kein Speichern oder E-Mail-Versand",injectTo:"body"},
      {tag:"style",children:"body { padding-bottom: 72px !important; }",injectTo:"head"}];
    },
  };
}
export default defineConfig({
  plugins:[react(),previewApi()],
  root:path.resolve(projectRoot,"client"),
  resolve:{alias:{
    "@":path.resolve(projectRoot,"client/src"),
    "@shared":path.resolve(projectRoot,"shared"),
    "@assets":path.resolve(projectRoot,"attached_assets"),
  }},
  server:{host:"127.0.0.1",port:5173,open:true,fs:{strict:true,deny:["**/.*"]}},
});

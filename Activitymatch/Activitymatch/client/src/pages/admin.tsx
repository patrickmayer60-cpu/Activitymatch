import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import type { AdminDashboard, AdminListing, AdminContact, AdminPage } from "@shared/admin";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BrandLogo } from "@/components/brand-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Lock, LogOut, RefreshCw, Trash2 } from "lucide-react";

const privateQuery = (query: {queryKey: readonly unknown[]}) =>
  String(query.queryKey[0]).startsWith("/api/admin/") && query.queryKey[0] !== "/api/admin/session";
async function adminFetch<T>(url:string,method="GET",body?:unknown):Promise<T> {
  const response=await fetch(url,{method,credentials:"same-origin",headers:body?{"Content-Type":"application/json"}:{},...(body?{body:JSON.stringify(body)}:{})});
  if(response.status===401) {
    queryClient.setQueryData(["/api/admin/session"],{authenticated:false});
    throw new Error("Deine Sitzung ist abgelaufen. Bitte erneut anmelden.");
  }
  const data=await response.json();
  if(!response.ok)throw new Error(data.message||"Anfrage fehlgeschlagen.");
  return data;
}
const date=(value:string)=>new Date(value).toLocaleDateString("de-DE");
const number=(value:number)=>value.toLocaleString("de-DE");
function Metric({label,value,hint}:{label:string;value:number;hint:string}) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-bold mt-2">{number(value)}</p><p className="text-xs text-muted-foreground mt-2">{hint}</p></CardContent></Card>;
}
function Distribution({title,rows}:{title:string;rows:{label:string;count:number}[]}) {
  return <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="space-y-3">{rows.length?rows.map(row=><div key={row.label} className="flex justify-between gap-4 text-sm"><span>{row.label}</span><strong>{number(row.count)}</strong></div>):<p className="text-sm text-muted-foreground">Noch keine veröffentlichten Anzeigen.</p>}</CardContent></Card>;
}

export default function Admin() {
  const [password,setPassword]=useState("");
  const [view,setView]=useState<"overview"|"listings"|"contacts">("overview");
  const [search,setSearch]=useState("");
  const [draft,setDraft]=useState("");
  const [page,setPage]=useState(1);
  const [deleting,setDeleting]=useState<AdminListing|null>(null);
  const session=useQuery<{authenticated:boolean}>({queryKey:["/api/admin/session"],staleTime:30000,refetchOnWindowFocus:true});
  const authenticated=session.data?.authenticated??false;
  useEffect(()=>{
    if(!authenticated) {queryClient.removeQueries({predicate:privateQuery});setPassword("");}
  },[authenticated]);
  const dashboard=useQuery<AdminDashboard>({queryKey:["/api/admin/dashboard"],queryFn:()=>adminFetch("/api/admin/dashboard"),enabled:authenticated,staleTime:30000});
  const params=`?page=${page}&search=${encodeURIComponent(search)}`;
  const listings=useQuery<AdminPage<AdminListing>>({queryKey:["/api/admin/listings",page,search],queryFn:()=>adminFetch(`/api/admin/listings${params}`),enabled:authenticated&&view==="listings",staleTime:30000});
  const contacts=useQuery<AdminPage<AdminContact>>({queryKey:["/api/admin/contacts",page,search],queryFn:()=>adminFetch(`/api/admin/contacts${params}`),enabled:authenticated&&view==="contacts",staleTime:30000});
  const login=useMutation({mutationFn:async()=>{await apiRequest("POST","/api/admin/login",{password});},onSuccess:()=>{setPassword("");queryClient.invalidateQueries({queryKey:["/api/admin/session"]});}});
  const logout=useMutation({mutationFn:()=>adminFetch("/api/admin/logout","POST",{}),onSuccess:()=>{queryClient.setQueryData(["/api/admin/session"],{authenticated:false});queryClient.removeQueries({predicate:privateQuery});}});
  const remove=useMutation({mutationFn:(id:number)=>adminFetch(`/api/admin/listings/${id}`,"DELETE",{}),onSuccess:()=>{
    setDeleting(null);
    queryClient.invalidateQueries({predicate:privateQuery});
    queryClient.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith("/api/listings")});
  }});
  const refresh=()=>queryClient.invalidateQueries({predicate:privateQuery});
  function tab(next:typeof view){setView(next);setPage(1);setSearch("");setDraft("");}
  function apply(event:FormEvent){event.preventDefault();setPage(1);setSearch(draft.trim());}
  const data=dashboard.data;
  const current=view==="contacts"?contacts:listings;
  const error=dashboard.error||current.error||logout.error;
  return <div className="min-h-screen bg-background">
    <header className="border-b bg-card"><div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
      <Link href="/"><BrandLogo className="h-11 sm:h-14"/></Link>
      <div className="flex gap-2"><Link href="/"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1"/>Zurück</Button></Link>{authenticated&&<Button variant="outline" size="sm" disabled={logout.isPending} onClick={()=>logout.mutate()}><LogOut className="w-4 h-4 mr-1"/>Abmelden</Button>}</div>
    </div></header>
    {session.isLoading?<div className="p-12 flex justify-center"><Loader2 className="animate-spin"/></div>:!authenticated?<main className="max-w-sm mx-auto p-4 py-16"><Card><CardHeader><Lock className="w-7 h-7 mb-2"/><CardTitle>Admin-Bereich</CardTitle></CardHeader><CardContent>
      <form className="space-y-4" onSubmit={event=>{event.preventDefault();login.mutate();}}>
        <label className="block text-sm">Admin-Passwort<Input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} className="mt-1" required/></label>
        {login.error&&<p role="alert" className="text-sm text-destructive">{login.error.message}</p>}
        {session.error&&<p role="alert" className="text-sm text-destructive">Verbindung zur Anmeldung fehlgeschlagen. Bitte Seite neu laden.</p>}
        <Button type="submit" disabled={!password||login.isPending} className="w-full">{login.isPending?"Wird angemeldet …":"Anmelden"}</Button>
      </form>
    </CardContent></Card></main>:<main className="max-w-6xl mx-auto px-4 py-7 space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3"><div><h1 className="text-2xl font-bold">ActivityMatch verwalten</h1><p className="text-sm text-muted-foreground mt-1">Interne Übersicht · Nur für den Betreiber</p></div><Button variant="outline" onClick={refresh}><RefreshCw className="w-4 h-4 mr-2"/>Aktualisieren</Button></div>
      <div className="flex flex-wrap gap-2">{([["overview","Übersicht"],["listings","Anzeigen"],["contacts","Kontakte"]] as const).map(([key,label])=><Button key={key} variant={view===key?"default":"outline"} onClick={()=>tab(key)}>{label}</Button>)}</div>
      {error&&<p role="alert" className="text-sm text-destructive">{error.message}</p>}
      {view==="overview"&&(dashboard.isLoading?<p>Lade Kennzahlen …</p>:data&&<>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Metric label="Veröffentlichte Anzeigen" value={data.published} hint="Aktuell gespeichert und öffentlich sichtbar"/>
          <Metric label="Bestätigte Ersteller-Adressen" value={data.confirmedAddresses} hint="Unterschiedliche E-Mail-Adressen mit vorhandenen veröffentlichten Anzeigen"/>
          <Metric label="Unbestätigte Anzeigen" value={data.pending} hint="Noch nicht öffentlich sichtbar"/>
          <Metric label="Neue Veröffentlichungen · 30 Tage" value={data.publications30} hint="Ab Statistikstart gezählt, auch nach späterer Löschung"/>
          <Metric label="Weitergeleitete Anfragen · 30 Tage" value={data.contacts30} hint="Bestätigte Anfragen, vom Versanddienst angenommen"/>
          <Metric label="Gespeicherte Anzeigen insgesamt" value={data.stored} hint="Veröffentlicht und unbestätigt, ohne bereits gelöschte Anzeigen"/>
        </div>
        <p className="text-sm text-muted-foreground">Statistikstart: {date(data.trackingSince)}. Frühere Vorgänge werden nicht rückwirkend gezählt. Ersteller-Adressen sind keine Besucher- oder verlässlich eindeutige Personenzahl. Eine weitergeleitete Anfrage belegt noch kein Treffen.</p>
        <div className="grid md:grid-cols-2 gap-4"><Distribution title="Aktuelle Anzeigen nach Kategorie" rows={data.categories}/><Distribution title="Städte mit den meisten aktuellen Anzeigen" rows={data.cities}/></div>
        <Card><CardHeader><CardTitle className="text-base">Letzte 30 Kalendertage · Europe/Berlin</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-3">Datum</th><th>Veröffentlichungen</th><th>Weitergeleitete Anfragen</th></tr></thead><tbody>{[...data.daily].reverse().map(day=><tr key={day.day} className="border-b"><td className="py-2">{date(day.day+"T12:00:00")}</td><td>{day.publications}</td><td>{day.contacts}</td></tr>)}</tbody></table></div></CardContent></Card>
      </>)}
      {view!=="overview"&&<>
        {view==="contacts"&&<p className="text-sm text-muted-foreground">Je bestätigter E-Mail-Adresse ein Eintrag. Vorname, Alter und Stadt stammen aus der neuesten vorhandenen Anzeige; Angaben sind Selbstauskünfte. Nach Löschung der letzten Anzeige verschwindet der Kontakt. Diese Übersicht ist keine Newsletter-Einwilligung.</p>}
        <form onSubmit={apply} className="flex flex-wrap gap-2"><Input className="flex-1 min-w-48" aria-label="Suche" placeholder={view==="contacts"?"Vorname, E-Mail oder Stadt suchen":"Titel, Vorname, E-Mail oder Stadt suchen"} maxLength={100} value={draft} onChange={event=>setDraft(event.target.value)}/><Button type="submit">Suchen</Button><Button variant="outline" type="button" onClick={()=>{setDraft("");setSearch("");setPage(1);}}>Zurücksetzen</Button></form>
        {current.isLoading?<p>Lade Daten …</p>:<>
          <p className="text-sm text-muted-foreground">{current.data?.total??0} Einträge · Seite {page}</p>
          <div className="overflow-x-auto border rounded-lg bg-card"><table className="w-full text-sm min-w-[820px]"><thead><tr className="border-b text-left">{(view==="contacts"?["Vorname","Alter","E-Mail (privat)","Stadt","Anzeigen","Letzte Anzeige"]:["Anzeige","Vorname / Alter","E-Mail (privat)","Ort / Kategorie","Status","Aktion"]).map(label=><th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>
            {view==="contacts"?contacts.data?.items.map(row=><tr key={row.email} className="border-b"><td className="p-3">{row.name}</td><td className="p-3">{row.age}</td><td className="p-3 break-all">{row.email}</td><td className="p-3">{row.city}</td><td className="p-3">{row.listingCount}</td><td className="p-3">{date(row.lastCreated)}</td></tr>):listings.data?.items.map(row=><tr key={row.id} className="border-b"><td className="p-3"><p className="font-medium">{row.title}</p><p className="text-xs text-muted-foreground">#{row.id} · {date(row.createdAt)}</p></td><td className="p-3">{row.name}, {row.age}</td><td className="p-3 break-all">{row.contactEmail||"Keine E-Mail hinterlegt"}<p className="text-xs text-muted-foreground">{row.emailVerified?"Bestätigt":"Nicht bestätigt"}</p></td><td className="p-3">{row.city}<p className="text-xs text-muted-foreground">{row.category}</p></td><td className="p-3"><Badge variant="secondary">{row.published?"Veröffentlicht":"Unbestätigt"}</Badge>{!row.contactEnabled&&<p className="text-xs mt-1">Anfragen pausiert</p>}</td><td className="p-3"><div className="flex gap-2">{row.published&&<Link className="underline self-center" href={`/listing/${row.id}`}>Ansehen</Link>}<Button size="icon" variant="outline" aria-label={`Anzeige ${row.id} löschen`} onClick={()=>{remove.reset();setDeleting(row);}}><Trash2 className="w-4 h-4"/></Button></div></td></tr>)}
          </tbody></table>{current.data?.items.length===0&&<p className="p-6 text-sm text-muted-foreground">Keine passenden Einträge.</p>}</div>
          <div className="flex gap-2"><Button variant="outline" disabled={page===1||current.isFetching} onClick={()=>setPage(page-1)}>Zurück</Button><Button variant="outline" disabled={!current.data||page*25>=current.data.total||current.isFetching} onClick={()=>setPage(page+1)}>Weiter</Button></div>
        </>}
      </>}
    </main>}
    <Dialog open={!!deleting} onOpenChange={open=>{if(!open)setDeleting(null);}}><DialogContent><DialogHeader><DialogTitle>Anzeige endgültig löschen?</DialogTitle><DialogDescription>„{deleting?.title}“ und die zugehörigen Daten werden gelöscht. Ein Kontakt ohne weitere Anzeigen verschwindet aus der Übersicht. Bereits erfasste Tageszählungen bleiben erhalten. Das Löschen kann nicht rückgängig gemacht werden.</DialogDescription></DialogHeader>{remove.error&&<p role="alert" className="text-destructive">{remove.error.message}</p>}<div className="flex justify-end gap-2"><Button variant="outline" disabled={remove.isPending} onClick={()=>setDeleting(null)}>Abbrechen</Button><Button variant="destructive" disabled={remove.isPending} onClick={()=>deleting&&remove.mutate(deleting.id)}>Endgültig löschen</Button></div></DialogContent></Dialog>
  </div>;
}

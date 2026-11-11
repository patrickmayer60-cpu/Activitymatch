import { queryClient } from "@/lib/queryClient";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PublicListing } from "@shared/schema";

export default function ManageListing() {
  const [,params]=useRoute("/manage/:id");
  const [token]=useState(()=>window.location.hash.slice(1));
  const [row,setRow]=useState<(PublicListing & {contactEmail:string})|null>(null);
  const [pending,setPending]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [deleted,setDeleted]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(false);
  async function request(method:string,body?:unknown) {
    const response=await fetch(`/api/manage/${params?.id}`,{method,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
    const result=await response.json();
    if(!response.ok) throw new Error(result.message||"Anfrage fehlgeschlagen.");
    return result;
  }
  useEffect(()=>{request("GET").then(setRow).catch(error=>setError(error.message));},[params?.id,token]);
  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!row)return;
    setPending(true);setError("");setMessage("");
    try {
      const {title,description,city,category,level,activityDate,activityTime,contactEnabled}=row;
      setMessage((await request("PATCH",{title,description,city,category,level,activityDate,activityTime,contactEnabled})).message);
      queryClient.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith("/api/listings")});
    } catch(error){setError(error instanceof Error?error.message:"Speichern fehlgeschlagen.");}
    finally{setPending(false);}
  }
  async function remove() {
    setPending(true);setError("");
    try{await request("DELETE");setDeleted(true);queryClient.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith("/api/listings")});window.history.replaceState(null,"",window.location.pathname);}
    catch(error){setError(error instanceof Error?error.message:"Löschen fehlgeschlagen.");}
    finally{setPending(false);}
  }
  return <main className="max-w-xl mx-auto px-5 py-10 space-y-5">
    <Link href="/" className="font-semibold text-primary">ActivityMatch</Link>
    <h1 className="text-2xl font-bold">Anzeige verwalten</h1>
    <p className="text-sm text-muted-foreground">Dieser Link ist privat. Wer ihn besitzt, kann deine Anzeige bearbeiten und löschen. Bewahre deine ursprüngliche E-Mail auf.</p>
    {error&&<p role="alert" className="text-destructive">{error}</p>}
    {deleted?<p role="status">Deine Anzeige wurde gelöscht.</p>:row?<form onSubmit={save} className="space-y-4">
      <p className="text-sm">E-Mail (privat): {row.contactEmail}</p>
      <label className="block text-sm">Titel<Input required minLength={5} maxLength={150} value={row.title} onChange={e=>setRow({...row,title:e.target.value})}/></label>
      <label className="block text-sm">Beschreibung<Textarea required minLength={10} maxLength={500} rows={5} value={row.description} onChange={e=>setRow({...row,description:e.target.value})}/></label>
      <label className="block text-sm">Stadt<Input required minLength={2} maxLength={100} value={row.city} onChange={e=>setRow({...row,city:e.target.value})}/></label>
      <label className="block text-sm">Kategorie<select className="block w-full border rounded-md p-2 bg-background" value={row.category} onChange={e=>setRow({...row,category:e.target.value})}>{["Sport","Gaming","Musik","Outdoor","Fitness","Sonstiges"].map(v=><option key={v}>{v}</option>)}</select></label>
      <label className="block text-sm">Level<select className="block w-full border rounded-md p-2 bg-background" value={row.level} onChange={e=>setRow({...row,level:e.target.value})}>{["Anfänger","Amateur","Profi"].map(v=><option key={v}>{v}</option>)}</select></label>
      <label className="block text-sm">Datum (leer für flexibel)<Input type="date" value={row.activityDate||""} onChange={e=>setRow({...row,activityDate:e.target.value})}/></label>
      <label className="block text-sm">Uhrzeit<Input type="time" value={row.activityTime||""} onChange={e=>setRow({...row,activityTime:e.target.value})}/></label>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={row.contactEnabled} onChange={e=>setRow({...row,contactEnabled:e.target.checked})}/> Kontaktanfragen erlauben</label>
      <p className="text-sm text-muted-foreground">Beim Antworten auf eine Anfrage in deinem E-Mail-Programm wird deine E-Mail-Adresse für den Interessenten sichtbar.</p>
      {message&&<p role="status">{message}</p>}
      <Button disabled={pending} type="submit">Änderungen speichern</Button>
      <div className="border-t pt-4 space-y-3">{confirmDelete?<><p>Anzeige endgültig löschen? Das lässt sich nicht rückgängig machen.</p><Button disabled={pending} type="button" variant="destructive" onClick={remove}>Ja, Anzeige löschen</Button><Button className="ml-2" type="button" variant="outline" onClick={()=>setConfirmDelete(false)}>Abbrechen</Button></>:<Button type="button" variant="outline" onClick={()=>setConfirmDelete(true)}>Anzeige löschen</Button>}</div>
    </form>:!error&&<p>Anzeige wird geladen … Bitte bestätige zuerst deine Anzeige über den anderen Link in deiner E-Mail.</p>}
    <p><Link className="underline" href="/">Zur Übersicht</Link></p>
  </main>;
}

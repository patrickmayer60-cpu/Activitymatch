import { useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm({listingId, canContact}: {listingId:number;canContact:boolean}) {
  const [open,setOpen]=useState(false);
  const [pending,setPending]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    setPending(true);setError("");
    try {
      const response=await apiRequest("POST",`/api/listings/${listingId}/contact`,{
        name:data.get("name"),email:data.get("email"),message:data.get("message"),consent:data.get("consent")==="on",website:data.get("website"),
      });
      setMessage((await response.json()).message);
    } catch(error) {setError(error instanceof Error ? error.message : "Versand fehlgeschlagen.");}
    finally {setPending(false);}
  }
  if(!canContact) return <p className="text-sm text-muted-foreground">Diese Anzeige nimmt derzeit keine Kontaktanfragen an. Bei älteren Anzeigen wurde die E-Mail-Adresse noch nicht bestätigt.</p>;
  if(message) return <p role="status" className="rounded-md bg-muted p-4 text-sm">{message} Bitte prüfe auch deinen Spamordner.</p>;
  if(!open) return <div className="space-y-3"><p className="text-sm text-muted-foreground">Schreibe ohne Account. Die Nachricht wird nach Bestätigung deiner E-Mail-Adresse zugestellt.</p><Button onClick={()=>setOpen(true)}>Nachricht senden</Button></div>;
  return <form onSubmit={submit} className="space-y-4">
    <label className="block text-sm font-medium">Dein Vorname *<Input name="name" required minLength={2} maxLength={100} autoComplete="given-name" className="mt-1" /></label>
    <label className="block text-sm font-medium">Deine E-Mail-Adresse *<Input name="email" type="email" required maxLength={254} autoComplete="email" className="mt-1" /></label>
    <label className="block text-sm font-medium">Deine Nachricht *<Textarea name="message" required minLength={10} maxLength={2000} rows={4} className="mt-1" /></label>
    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
    <label className="flex gap-2 text-sm"><input name="consent" type="checkbox" required className="mt-1" /><span>Mein Vorname, meine Nachricht und meine E-Mail-Adresse werden nach meiner Bestätigung an den Ersteller weitergegeben, damit er mir direkt antworten kann.</span></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-2"><Button disabled={pending} type="submit">{pending?"Wird gesendet …":"Bestätigungslink anfordern"}</Button><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Abbrechen</Button></div>
  </form>;
}

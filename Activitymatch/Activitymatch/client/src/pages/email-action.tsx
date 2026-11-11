import { t, locale } from "@/lib/i18n";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Keep tokens in the URL fragment: never sent in requests, referrers or server logs.
export default function EmailAction() {
  const [token]=useState(()=>window.location.hash.slice(1));
  const [pending,setPending]=useState(false);
  const [result,setResult]=useState<{message:string;listingId?:number}|null>(null);
  const [error,setError]=useState("");
  async function confirm() {
    setPending(true);setError("");
    try {
      const response=await apiRequest("POST","/api/email-actions/confirm",{token});
      setResult(await response.json());
      queryClient.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith("/api/listings")});
      window.history.replaceState(null,"",window.location.pathname);
    } catch(error) {setError(error instanceof Error?error.message:t("Bestätigung fehlgeschlagen."));}
    finally {setPending(false);}
  }
  return <main className="max-w-lg mx-auto px-5 py-16 space-y-5">
    <Link href="/" className="text-primary font-semibold">ActivityMatch</Link>
    <h1 className="text-2xl font-bold">{result?t("Bestätigung erfolgreich"):t("Deine E-Mail bestätigen")}</h1>
    {result?<><p role="status">{t(result.message)}</p>{result.listingId&&<p><Link href={`/listing/${result.listingId}`} className="underline">{t("Anzeige ansehen")}</Link></p>}</>:<>
      <p>{t("Mit einem Klick bestätigst du deine Anzeige oder die Weiterleitung deiner Kontaktanfrage. Falls du diese Anfrage nicht selbst gestellt hast, schließe diese Seite.")}</p>
      <Button disabled={pending || !/^[a-f0-9]{64}$/.test(token)} onClick={confirm}>{pending?t("Wird bestätigt …"):t("Jetzt bestätigen")}</Button>
      {!/^[a-f0-9]{64}$/.test(token)&&<p role="alert">{t("Bitte öffne den vollständigen Link aus deiner E-Mail.")}</p>}
    </>}
    {error&&<p role="alert" className="text-destructive">{t(error)}</p>}
    <p><Link href="/" className="underline">{t("Zur Übersicht")}</Link></p>
  </main>;
}

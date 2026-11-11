import { useLanguage, setLanguage } from "@/lib/i18n";
export function LanguageSwitch(){
 const language=useLanguage();
 return <div className="border-b bg-muted/40"><div className="max-w-6xl mx-auto px-3 sm:px-4 py-1.5 flex justify-end items-center gap-2 text-xs">
  <label htmlFor="interface-language">{language==="en"?"Language":"Sprache"}</label>
  <select id="interface-language" value={language} onChange={event=>setLanguage(event.target.value==="en"?"en":"de")} className="rounded border bg-background px-2 py-1 text-xs" aria-label="Sprache / Language">
   <option value="de">Deutsch</option><option value="en">English</option>
  </select>
 </div></div>;
}

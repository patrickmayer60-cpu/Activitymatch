import { useSyncExternalStore } from "react";
import { english } from "./translations";
export type Language = "de" | "en";
function initial():Language {
  if(typeof window === "undefined")return "de";
  const linked = new URLSearchParams(window.location.search).get("lang");
  if(linked === "de" || linked === "en")return linked;
  try {const saved=localStorage.getItem("activitymatch-language");if(saved==="de"||saved==="en")return saved;} catch {}
  return "de";
}
let language:Language=initial();
const listeners=new Set<()=>void>();
export function getLanguage(){return language;}
export function setLanguage(value:Language){
  language=value;
  try{localStorage.setItem("activitymatch-language",value);}catch{}
  listeners.forEach(listener=>listener());
}
export function useLanguage(){
  return useSyncExternalStore(listener=>{listeners.add(listener);return ()=>{listeners.delete(listener);};},()=>language,()=>"de");
}
export function locale(){return language==="en"?"en-GB":"de-DE";}
export function t(value:string|null|undefined):string {
  if(!value)return "";
  return language==="en" ? english[value]??value : value === "Sport" ? "Sport (alte Kategorie)" : value;
}

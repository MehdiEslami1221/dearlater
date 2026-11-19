"use client";
import {useEffect,useState} from "react";
import {Monitor,Moon,Sun} from "lucide-react";
const modes=["system","light","dark"] as const;
type Mode=typeof modes[number];
function preference():Mode{
  try{const v=localStorage.getItem("dl-appearance");return v==="light"||v==="dark"?v:"system";}catch{return "system";}
}
export function ThemeController(){
  useEffect(()=>{
    const media=matchMedia("(prefers-color-scheme: dark)");
    const apply=()=>{const mode=preference();document.documentElement.dataset.theme=mode==="system"?(media.matches?"dark":"light"):mode;};
    apply();media.addEventListener("change",apply);window.addEventListener("dl-appearance",apply);window.addEventListener("storage",apply);
    return ()=>{media.removeEventListener("change",apply);window.removeEventListener("dl-appearance",apply);window.removeEventListener("storage",apply);};
  },[]);
  return null;
}
export function Appearance({fa}:{fa:boolean}){
  const [mode,setMode]=useState<Mode>("system");
  useEffect(()=>setMode(preference()),[]);
  return <fieldset><legend>{fa?"نمایش":"Appearance"}</legend><div className="types appearance-modes">{modes.map((v,i)=>{
    const Icon=[Monitor,Sun,Moon][i];
    return <button key={v} aria-pressed={mode===v} className={mode===v?"chosen":""} onClick={()=>{
      setMode(v);try{localStorage.setItem("dl-appearance",v);window.dispatchEvent(new Event("dl-appearance"));}catch{document.documentElement.dataset.theme=v==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):v;}
    }}><Icon size={15}/>{(fa?["سیستم","روشن","تیره"]:["System","Light","Dark"])[i]}</button>;
  })}</div></fieldset>;
}

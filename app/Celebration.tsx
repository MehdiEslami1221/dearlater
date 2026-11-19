import {useEffect,useState,type CSSProperties} from "react";
import type {Design} from "@/lib/design";

const motifs={
  birthday:["🎈","✦","🎉","🎈"],
  anniversary:["♡","🌹","♥","✧"],
  personal:["✉","✧","🕊️","✦"],
  reminder:["✓","◷","✧","🔔"],
};
function nightAt(hour:number){return hour<6||hour>=18;}
export function Celebration({occasion}:{occasion:Design["occasion"]}){
  const [night,setNight]=useState(false),[visible,setVisible]=useState(true);
  useEffect(()=>{
    const update=()=>{setNight(nightAt(new Date().getHours()));setVisible(!document.hidden);};
    update();const clock=setInterval(update,60000);
    document.addEventListener("visibilitychange",update);
    return ()=>{clearInterval(clock);document.removeEventListener("visibilitychange",update);};
  },[]);
  if(!visible)return null;
  return <div className={`celebration ongoing occasion-${occasion} ${night?"sky-night":"sky-day"}`} aria-hidden="true">
    {occasion==="birthday" && night && <div className="starfield">{Array.from({length:44},(_,i)=><i key={i} style={{left:(i*43%100)+"%",top:(i*31%95)+"%",animationDelay:-(i%7)+"s"}}/>)}</div>}
    {["left","right"].map(side=><div className={`edge edge-${side}`} key={side}>
      {motifs[occasion].map((symbol,i)=><span key={i} style={{"--slot":i} as CSSProperties}>{night&&occasion==="birthday"?"✧":symbol}</span>)}
      {occasion==="birthday" && night && <div className="night-burst">
        <b className="flare-trail"/>{Array.from({length:16},(_,i)=><i key={i} style={{"--angle":(i*22.5)+"deg"} as CSSProperties}/>)}
      </div>}
    </div>)}
  </div>;
}

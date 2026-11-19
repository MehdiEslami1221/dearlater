import {type CSSProperties} from "react";
import { stickers,standard,palettes,type Design } from "@/lib/design";
import { Feather, Mail } from "lucide-react";
export function Brand() {
  return (
    <span className="brand" dir="ltr">
      <span className="brandicon">
        <Feather size={19} />
      </span>{" "}
      DearLater<span className="branddot">.</span>
    </span>
  );
}
export function Envelope({
  cover,
  name,
  caption, design=standard, opened=false,
}: {
  cover: string;
  name: string;
  caption: string; design?:Design; opened?:boolean;
}) {
  return (
    <div className={`artboard design-${design.style} moment-${design.occasion} ${opened&&design.effects?"revealed":""}`} style={{"--paper":palettes[design.palette].paper,"--ink-color":design.ink,"--accent":palettes[design.palette].accent,"--stage":palettes[design.palette].stage} as CSSProperties}>
      {opened && design.effects && design.occasion==="birthday" && <div aria-hidden="true" className="confetti">{Array.from({length:18},(_,i)=><i key={i} style={{"--i":i,left:(i*41%100)+"%"} as CSSProperties}/>)}</div>}
      <div className="paper">
        <div className="flap"/><div className="wax" aria-hidden="true">D</div><div className="airstripe" />
        <div className="postage">
          <Mail size={24} />
          <small>DL</small>
        </div>
        <div className="postmark">
          DEARLATER
          <br />
          POST
        </div>
        <div className="address">
          <small>{caption}</small>
          <b dir="auto">{name}</b>
          <p dir="auto">{cover}</p>
        </div>
        <div className="paperline" />{design.sticker!=="none" && <span className="letter-sticker" aria-hidden="true">{stickers[design.sticker]}</span>}
      </div>
    </div>
  );
}

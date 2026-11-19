import {stickers,contrast,palettes,styles,occasions,type Design} from "@/lib/design";
const styleLabels=[["Wax seal","مهر مومی"],["Air mail","پست هوایی"],["Letterpress","چاپ برجسته"]];
const occasionLabels=[["Personal","شخصی"],["Birthday","تولد"],["Anniversary","سالگرد"],["Reminder","یادآوری"]];
export function Designer({value,change,fa}:{value:Design;change:(v:Design)=>void;fa:boolean}){
 const i=fa?1:0,update=(v:Partial<Design>)=>change({...value,...v}),p=palettes[value.palette];
 return <fieldset className="designer"><legend>{fa?"طراحی پاکت":"Envelope studio"}</legend>
 <div className="pair"><label>{fa?"طرح":"Edition"}<select value={value.style} onChange={e=>update({style:e.target.value as Design["style"]})}>{styles.map((s,k)=><option key={s} value={s}>{styleLabels[k][i]}</option>)}</select></label>
 <label>{fa?"مناسبت":"Occasion"}<select value={value.occasion} onChange={e=>update({occasion:e.target.value as Design["occasion"]})}>{occasions.map((s,k)=><option key={s} value={s}>{occasionLabels[k][i]}</option>)}</select></label></div>
 <div className="swatches">{palettes.map((v,k)=><button key={v.paper} type="button" title={v.name[i]} aria-label={v.name[i]} aria-pressed={k===value.palette} style={{background:`linear-gradient(135deg,${v.paper} 60%,${v.accent} 60%)`}} onClick={()=>update({palette:k,ink:v.ink})}/>)}</div>
 <div className="inkrow"><small>{p.name[i]}</small><label>{fa?"رنگ نوشته":"Ink colour"}<input type="color" value={value.ink} onChange={e=>update({ink:e.target.value})}/></label></div>
 {contrast(p.paper,value.ink)<4.5&&<button className="contrast" onClick={()=>update({ink:p.ink})}>{fa?"انتخاب رنگ خواناتر":"Use a more legible ink"}</button>}
 <label>{fa?"نام روی پاکت":"Name on the envelope"}<input maxLength={100} dir="auto" value={value.addressee} onChange={e=>update({addressee:e.target.value})}/></label>
 <div className="backdrop-controls"><div className="gradient-sample" style={{background:`linear-gradient(90deg,${value.leftColor},${value.rightColor})`}}/><div className="pair">{(["leftColor","rightColor"] as const).map((key,index)=><label key={key}>{(fa?["پس‌زمینه سمت چپ","پس‌زمینه سمت راست"]:["Left background","Right background"])[index]}<input type="color" value={value[key]} onChange={e=>update({[key]:e.target.value})}/></label>)}</div></div>
 <label className="check"><input type="checkbox" checked={value.effects} onChange={e=>update({effects:e.target.checked})}/>{fa?"جلوه‌های مناسبتی هنگام باز شدن":"Celebrate when the letter opens"}</label>
 <fieldset className="sticker-picker"><legend>{fa?"استیکر روی پاکت":"Envelope sticker"}</legend><div>{Object.entries(stickers).map(([key,symbol],index)=>{
 const name=fa?["بدون استیکر","کیک","بادکنک","دسته‌گل","ماه","نامه عاشقانه","پروانه","زنگ","ستاره"][index]:key;
 return <button type="button" key={key} aria-label={name} title={name} aria-pressed={value.sticker===key} onClick={()=>update({sticker:key as Design["sticker"]})}>{symbol||"∅"}</button>;
 })}</div></fieldset></fieldset>;
}

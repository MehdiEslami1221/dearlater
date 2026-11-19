export const palettes=[
 {name:["Ivory & wine","کرم و زرشکی"],paper:"#f7e8cf",ink:"#582638",accent:"#943e4e",stage:"#e5d4c2"},
 {name:["Garden sage","مریم‌گلی"],paper:"#d8dfc9",ink:"#213d34",accent:"#527660",stage:"#bacbb7"},
 {name:["Midnight gold","سرمه‌ای و طلایی"],paper:"#253950",ink:"#fff1ca",accent:"#d0a35f",stage:"#afb8c4"},
 {name:["Lilac copper","یاسی و مسی"],paper:"#e7dbea",ink:"#46304d",accent:"#ae755c",stage:"#cbbdcc"},
 {name:["Coastal mist","آبی مه‌آلود"],paper:"#dbe8e9",ink:"#244754",accent:"#688e9a",stage:"#b8cbcb"}
];
export const styles=["classic","airmail","minimal"] as const;
export const occasions=["personal","birthday","anniversary","reminder"] as const;
export const stickers = {none:"", cake:"🎂", balloon:"🎈", bouquet:"💐", moon:"🌙", heart:"💌", butterfly:"🦋", bell:"🔔", star:"🌟"} as const;
export type Design={leftColor:string;rightColor:string;effects:boolean; sticker:keyof typeof stickers;style:typeof styles[number]; palette:number; ink:string; occasion:typeof occasions[number]; addressee:string};
export const standard:Design={leftColor:"#c6e1ee",rightColor:"#c8dfcf",effects:true,sticker:"none",style:"classic",palette:0,ink:palettes[0].ink,occasion:"personal",addressee:""};
export function design(value:Partial<Design>|null|undefined):Design{
 const palette=Number.isInteger(value?.palette)&&palettes[value!.palette!]?value!.palette!:0;
 return {leftColor:color(value?.leftColor,standard.leftColor),rightColor:color(value?.rightColor,standard.rightColor),effects:value?.effects!==false, sticker:value?.sticker && Object.hasOwn(stickers,value.sticker)?value.sticker:"none",palette,style:styles.includes(value?.style as Design["style"])?value!.style!:"classic",
 occasion:occasions.includes(value?.occasion as Design["occasion"])?value!.occasion!:"personal",
 ink:/^#[a-f0-9]{6}$/i.test(value?.ink||"")?value!.ink!:palettes[palette].ink,
 addressee:typeof value?.addressee==="string"?value.addressee.trim().slice(0,100):""};
}
export function contrast(a:string,b:string){
 function luminance(s:string){const rgb=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
 const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}

function color(value:unknown,fallback:string){return typeof value==="string" && /^#[a-f0-9]{6}$/i.test(value)?value:fallback;}

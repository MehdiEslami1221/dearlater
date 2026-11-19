import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {existsSync} from "node:fs";
import {resolve} from "node:path";
import {createInterface} from "node:readline";
import {readerGateway} from "./reader-gateway.mjs";

const deskPort=3000;
const children=new Set();
let stopping=false;
function stop(code,message){
  if(stopping)return;
  stopping=true;
  if(message)console.error(message);
  for(const child of children)child.kill();
  process.exit(code);
}
process.on("SIGINT",()=>stop(0));
process.on("SIGTERM",()=>stop(0));
process.on("uncaughtException",e=>stop(1,e.message));

function start(binary,args,options){
  const child=spawn(binary,args,{windowsHide:true,...options});
  children.add(child);
  child.once("error",error=>stop(1,error.message));
  child.once("exit",code=>stop(code||1,"Public test stopped."));
  return child;
}
function listen(server,port){
  return new Promise((ok,fail)=>{
    server.once("error",fail);server.listen(port,"127.0.0.1",()=>ok(server.address().port));
  });
}
const probe=createServer();
await listen(probe,deskPort);
await new Promise(done=>probe.close(done));
const gateway=readerGateway(deskPort);
const port=await listen(gateway,0);
const binary=process.platform==="win32"&&existsSync("cloudflared.exe")?resolve("cloudflared.exe"):"cloudflared";
const tunnel=start(binary,["tunnel","--protocol","http2","--url","http://127.0.0.1:"+port],{stdio:["ignore","pipe","pipe"]});
let started=false;
const timeout=setTimeout(()=>stop(1,"No public address received. Check cloudflared, VPN and network access."),90000);
async function launch(site){
  clearTimeout(timeout);
  start(process.execPath,["node_modules/next/dist/bin/next","start","-H","127.0.0.1","-p",String(deskPort)],
        {stdio:"inherit",env:{...process.env,DEARLATER_PUBLIC_ORIGIN:site}});
  const desk="http://127.0.0.1:"+deskPort;
  for(let i=0;i<90;i++){
    try{if((await fetch(desk+"/api/desk")).ok){
      console.log("Private writing desk: "+desk+"\nPublic envelope origin: "+site+"\nKeep this window open.");
      if(process.platform==="win32")spawn("rundll32.exe",["url.dll,FileProtocolHandler",desk],{stdio:"ignore",windowsHide:true}).unref();
      return;
    }}catch{}
    await new Promise(done=>setTimeout(done,1000));
  }
  stop(1,"The local desk did not start.");
}
for(const stream of [tunnel.stdout,tunnel.stderr]){
  createInterface({input:stream}).on("line",line=>{
    // Cloudflared prints the allocated URL inside its startup banner.
    const match=line.match(/https:\/\/[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com\b/i);
    if(match&&!started){started=true;void launch(match[0]);}
    if(/ERR|error/i.test(line))console.error(line);
  });
}

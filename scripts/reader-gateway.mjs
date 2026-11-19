import http from "node:http";

// Only static reader assets and individual letter routes may reach Next.
// Build the upstream request from scratch: client headers and queries stay outside.
function readerPath(url) {
  const raw=url.split("?")[0];
  if (/^\/(?:api\/envelope|e)\/[A-Za-z0-9_-]{32}$/.test(raw)) return raw;
  if (/^\/fonts\/IRANSansX-(?:Regular|Bold)\.woff2$/.test(raw)) return raw;
  if (!raw.startsWith("/_next/static/")) return null;
  let decoded;
  try { decoded=decodeURIComponent(raw); } catch { return null; }
  if (!/\.(js|css|woff2)$/.test(decoded)) return null;
  const segments=decoded.slice(1).split("/");
  if (!segments.every(s=>/^[\w.()\[\]-]+$/.test(s)&&s!=="."&&s!=="..")) return null;
  return segments.map(encodeURIComponent).join("/").replace(/^/,"/");
}
export function readerGateway(deskPort) {
  return http.createServer((req,res)=>{
    const path=readerPath(req.url||"");
    if (!path || !["GET","HEAD"].includes(req.method)) {
      res.writeHead(404,{"Cache-Control":"no-store"}).end(); return;
    }
    const upstream=http.request({hostname:"127.0.0.1",port:deskPort,path,method:req.method}, response=>{
      const headers={"Cache-Control":path.startsWith("/_next/static/")?"public, max-age=31536000, immutable":"private, no-store",
        "Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow","X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY"};
      if(response.headers["content-type"]) headers["Content-Type"]=response.headers["content-type"];
      res.writeHead(response.statusCode||502,headers);response.pipe(res);
      response.on("error",()=>res.destroy());
    });
    upstream.setTimeout(20000,()=>upstream.destroy());
    upstream.on("error",()=>{if(!res.headersSent) res.writeHead(503);res.end();});
    res.on("close",()=>upstream.destroy());
    upstream.end();
  });
}

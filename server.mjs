import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PUB=path.join(__dirname,'public');
const DATA_DIR=process.env.PWP_DATA_DIR||path.join(__dirname,'data');
const DATA=path.join(DATA_DIR,'leads.json');
const PORT=Number(process.env.PORT||3000);
const ADMIN_PIN=String(process.env.PWP_ADMIN_PIN||'').trim();
const MAX_BODY=1_500_000;
const rate=new Map();

fs.mkdirSync(DATA_DIR,{recursive:true});
if(!fs.existsSync(DATA)) fs.writeFileSync(DATA,'[]');

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.ico':'image/x-icon'};
const readLeads=()=>{try{return JSON.parse(fs.readFileSync(DATA,'utf8'))}catch{return[]}};
const writeLeads=x=>{const tmp=DATA+'.tmp';fs.writeFileSync(tmp,JSON.stringify(x,null,2));fs.renameSync(tmp,DATA)};
const headers={
  'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://wa.me https://api.whatsapp.com https://pwplatam.com"
};
const json=(res,status,obj)=>{res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj))};
const parseBody=req=>new Promise((resolve,reject)=>{let d='';req.on('data',c=>{d+=c;if(d.length>MAX_BODY){reject(new Error('too_large'));req.destroy()}});req.on('end',()=>{try{resolve(JSON.parse(d||'{}'))}catch(e){reject(e)}});req.on('error',reject)});
const allowed=(ip)=>{const now=Date.now(),slot=rate.get(ip)||{t:now,n:0};if(now-slot.t>60_000){slot.t=now;slot.n=0}slot.n++;rate.set(ip,slot);return slot.n<=12};
const clean=s=>String(s??'').trim().slice(0,300);
const validLead=p=>p&&p.contact&&clean(p.contact.name).length>=2&&clean(p.contact.phone).replace(/\D/g,'').length>=8&&p.answers&&typeof p.answers==='object'&&p.results&&typeof p.results==='object';

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').toString().split(',')[0].trim();
  if(url.pathname==='/api/health') return json(res,200,{ok:true,service:'PWP Financial Protection Assessment',version:'1.1.0',adminEnabled:Boolean(ADMIN_PIN)});
  if(url.pathname==='/api/leads'&&req.method==='POST'){
    if(!allowed(ip)) return json(res,429,{ok:false,error:'rate_limited'});
    try{
      const payload=await parseBody(req); if(!validLead(payload)) return json(res,422,{ok:false,error:'invalid_lead'});
      const leads=readLeads();
      const item={id:crypto.randomUUID(),createdAt:new Date().toISOString(),status:'Novo',referral:clean(payload.referral||'organic'),contact:{name:clean(payload.contact.name),email:clean(payload.contact.email),phone:clean(payload.contact.phone),city:clean(payload.contact.city)},answers:payload.answers,results:payload.results};
      leads.unshift(item); writeLeads(leads.slice(0,10000)); return json(res,201,{ok:true,id:item.id});
    }catch(e){return json(res,e?.message==='too_large'?413:400,{ok:false,error:'invalid_payload'})}
  }
  if(url.pathname==='/api/leads'&&req.method==='GET'){
    if(!ADMIN_PIN) return json(res,503,{ok:false,error:'admin_not_configured'});
    if(req.headers['x-admin-pin']!==ADMIN_PIN) return json(res,401,{ok:false});
    return json(res,200,{ok:true,leads:readLeads()});
  }
  if(url.pathname.startsWith('/api/leads/')&&req.method==='PATCH'){
    if(!ADMIN_PIN) return json(res,503,{ok:false,error:'admin_not_configured'});
    if(req.headers['x-admin-pin']!==ADMIN_PIN) return json(res,401,{ok:false});
    try{const id=url.pathname.split('/').pop(); const patch=await parseBody(req); const leads=readLeads(); const i=leads.findIndex(x=>x.id===id); if(i<0)return json(res,404,{ok:false}); leads[i]={...leads[i],status:clean(patch.status||leads[i].status),updatedAt:new Date().toISOString()};writeLeads(leads);return json(res,200,{ok:true,lead:leads[i]})}catch{return json(res,400,{ok:false})}
  }

  let file=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
  file=path.normalize(file).replace(/^(\.\.(\/|\\|$))+/,'');
  let fp=path.join(PUB,file);
  if(!fp.startsWith(PUB)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()) fp=path.join(PUB,'index.html');
  const ext=path.extname(fp); const cache=ext==='.html'?'no-store':'public, max-age=3600';
  res.writeHead(200,{...headers,'Content-Type':types[ext]||'application/octet-stream','Cache-Control':cache}); fs.createReadStream(fp).pipe(res);
});
server.listen(PORT,()=>console.log(`PWP Assessment ${PORT} | admin ${ADMIN_PIN?'enabled':'disabled'}`));

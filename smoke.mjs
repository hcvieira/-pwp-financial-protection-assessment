import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const port=3199; const pin='smoke-test-private-pin'; const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pwp-smoke-'));
const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,env:{...process.env,PORT:String(port),PWP_ADMIN_PIN:pin,PWP_DATA_DIR:dir},stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
  let ok=false; for(let i=0;i<30;i++){try{const r=await fetch(`http://127.0.0.1:${port}/api/health`);if(r.ok){ok=true;break}}catch{}await wait(100)}
  if(!ok) throw new Error('server did not start');
  const home=await fetch(`http://127.0.0.1:${port}/`); const html=await home.text(); if(!html.includes('PWP Financial Protection Assessment')) throw new Error('home failed');
  const lead={contact:{name:'Smoke Test',phone:'11999999999',email:'smoke@example.com',city:'São Paulo'},referral:'smoke',answers:{occupation:'Empresário(a)'},results:{score:58,priority:80,incomeGap:30000,familyGap:1000000}};
  const post=await fetch(`http://127.0.0.1:${port}/api/leads`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(lead)}); if(post.status!==201)throw new Error('lead post failed '+post.status);
  const get=await fetch(`http://127.0.0.1:${port}/api/leads`,{headers:{'x-admin-pin':pin}});const j=await get.json();if(!j.ok||j.leads.length!==1)throw new Error('lead get failed');
  const js=fs.readFileSync(path.join(root,'public','app.js'),'utf8');
  const q=(js.match(/\{id:'/g)||[]).length; if(q<65)throw new Error(`question bank too small: ${q}`);
  if(!js.includes('5511945444626') && !fs.readFileSync(path.join(root,'public','config.js'),'utf8').includes('5511945444626')) throw new Error('official whatsapp not configured');
  console.log(JSON.stringify({ok:true,health:true,leadPersistence:true,questionDefinitions:q,officialWhatsapp:true}));
} finally {child.kill('SIGTERM')}

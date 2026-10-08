import express from 'express';
import { kv } from '@vercel/kv';
const app = express();
app.use(express.json({limit:'20mb'}));
app.use(express.urlencoded({extended:true,limit:'20mb'}));
const SUPER_HASH = process.env.SUPER_HASH || 'MajorTech2026_SuperSecure_32Chars!';
const KEY_MAIN = "majortech-permanent-v1";
const KEY_AUDIT = "majortech-audit-v1";
const KEY_RATE = "majortech-ratelimit";
const defaultData = () => ({
  validIds:["LISE-038-2025","LISE-045-2025","LISE-001-2025","LISE-002-2025"],
  candidates:[{id:"A",name:"Candidate A"},{id:"B",name:"Candidate B"},{id:"C",name:"Candidate C"}],
  votes:{}, votedIds:[], tokens:{}
});
async function load(){ let d=await kv.get(KEY_MAIN); if(!d){ d=defaultData(); await kv.set(KEY_MAIN,d);} return d; }
async function save(d){ await kv.set(KEY_MAIN,d); }
async function auditLog(msg){ const logs=await kv.get(KEY_AUDIT)||[]; logs.push(new Date().toISOString()+" "+msg); await kv.set(KEY_AUDIT, logs.slice(-500)); }
async function rateCheck(ip){
  const key = `${KEY_RATE}:${ip}`;
  let data = await kv.get(key)||{count:0, ts:Date.now()};
  if(Date.now()-data.ts > 60000){ data={count:0, ts:Date.now()}; }
  data.count++; await kv.set(key,data,{ex:60});
  return data.count <= 15;
}
app.get('/api/public', async (req,res)=>{ const d=await load(); res.json({candidates:d.candidates}); });
app.post('/api/verify', async (req,res)=>{
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
  if(!await rateCheck(ip)) return res.status(429).json({error:"Too many tries! Wait 1 min"});
  const id=String(req.body.studentId||'').trim().toUpperCase();
  if(!id) return res.status(400).json({error:"Enter ID"});
  const data=await load();
  if(!data.validIds.includes(id)){
    await auditLog(`L1 BLOCK ${id} from ${ip}`);
    return res.status(400).json({error:`Already voted! No double voting! ID ${id} has voted!`.replace('Already voted! No double voting!','ID not found!')});
  }
  if(data.votedIds.includes(id)){
    await auditLog(`L3 BLOCK ${id} RED TEXT`);
    return res.status(400).json({error:`Already voted! No double voting! ID ${id} has voted!`});
  }
  const token="TG"+Math.floor(1000+Math.random()*9000);
  data.tokens[token]={studentId:id, used:false, ip, created:Date.now()};
  await save(data);
  await auditLog(`L2 TOKEN ${id} -> ${token}`);
  res.json({token});
});
app.post('/api/vote', async (req,res)=>{
  const {token,candidateId}=req.body;
  const data=await load();
  const t=data.tokens[token];
  if(!t||t.used) return res.status(400).json({error:"Invalid or burned token! Token Burned."});
  if(data.votedIds.includes(t.studentId)) return res.status(400).json({error:`Already voted! No double voting! ID ${t.studentId} has voted!`});
  data.votes[candidateId]=(data.votes[candidateId]||0)+1;
  data.votedIds.push(t.studentId);
  t.used=true;
  await save(data);
  await auditLog(`L3 VOTE ${t.studentId} -> ${candidateId}`);
  const candName=data.candidates.find(c=>c.id===candidateId)?.name||candidateId;
  res.json({ok:true, candidateName:candName});
});
app.get('/api/DONT@001/data', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  const main=await load(); const audit=await kv.get(KEY_AUDIT)||[];
  res.json({...main, audit});
});
app.post('/api/DONT@001/save', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  const data=await load();
  if(req.body.validIds) data.validIds=req.body.validIds.map(s=>String(s).trim().toUpperCase()).filter(Boolean);
  if(req.body.candidates) data.candidates=req.body.candidates;
  await save(data); res.json({ok:true});
});
app.get('/DONT@001',(req,res)=>res.send(`<html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-100 p-6"><div class="max-w-2xl mx-auto bg-white p-6 rounded-2xl"><h1 class="font-black">DONT@001 VAULT</h1><input id="h" class="w-full border p-3 rounded-xl mt-3" value="MajorTech2026_SuperSecure_32Chars!"><textarea id="ids" rows="8" class="w-full border p-3 rounded-xl mt-3"></textarea><button onclick="saveIds()" class="w-full bg-[#111d33] text-white p-3 rounded-xl mt-3 font-black">Save Permanently</button></div><script>async function saveIds(){const h=document.getElementById('h').value;const ids=document.getElementById('ids').value.split('\\n').filter(Boolean);const r=await fetch('/api/DONT@001/save?h='+encodeURIComponent(h),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({validIds:ids})});alert((await r.json()).ok?'Saved!':'Error')}fetch('/api/DONT@001/data?h='+encodeURIComponent(document.getElementById('h').value)).then(r=>r.json()).then(j=>{if(j.validIds)document.getElementById('ids').value=j.validIds.join('\\n')})<\/script></body></html>`));
app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MajorTech</title><script src="https://cdn.tailwindcss.com"></script><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@800;900&display=swap');body{font-family:Inter;background:linear-gradient(180deg,#7b5bff 0%,#6a4bff 100%);min-height:100vh}.card{max-width:380px;margin:0 auto;background:white;border-radius:28px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25)}.header{background:#111d33;padding:22px 24px}.tech{color:#2eb5f5}.err{color:#ef4444;font-size:12px;font-weight:800;margin-top:10px}</style></head><body class="flex items-center justify-center p-4">
<div id="s1" class="card w-full"><div class="header"><div class="text-white font-black text-[26px]">Major<span class="tech">Tech</span> Verify</div><div class="text-white/60 text-[12px] mt-1">Official Student ID Verification</div></div><div class="p-6"><div class="font-black text-[11px] tracking-widest">ENTER STUDENT ID NUMBER</div><input id="sid" class="w-full mt-3 bg-[#f1f3f9] p-4 rounded-2xl outline-none font-bold" placeholder="LISE-038-2025"><div id="e1" class="err hidden"></div><button onclick="verify()" class="w-full mt-5 bg-[#111d33] text-white py-4 rounded-2xl font-black">VERIFY ></button></div></div>
<div id="s2" class="card w-full hidden"><div class="header"><div class="text-white font-black text-[26px]">Major<span class="tech">Tech</span> Vote</div><div class="text-white/60 text-[12px]">Token like AB1234</div></div><div class="p-6"><div id="tokBox" class="bg-[#10d876] text-white text-center py-5 rounded-2xl font-black text-[30px] tracking-[5px]">TG0000</div><input id="tin" class="w-full mt-4 border-2 border-gray-100 p-4 rounded-2xl outline-none font-bold"><div id="e2" class="err hidden"></div><button onclick="nextStep()" class="w-full mt-4 bg-[#111d33] text-white py-4 rounded-2xl font-black">ENTER > NEXT</button></div></div>
<div id="s3" class="card w-full hidden"><div class="header"><div class="text-white font-black text-[22px]">Choose Candidate</div></div><div class="p-4"><div id="cans" class="space-y-3"></div><div id="e3" class="err hidden text-center"></div></div></div>
<div id="s4" class="card w-full hidden bg-[#111d33] text-center p-8"><div class="w-20 h-20 bg-[#10d876] rounded-full flex items-center justify-center mx-auto text-4xl font-black text-white">✓</div><div class="text-white font-black text-[22px] mt-5">Vote Successful!</div><div id="votedFor" class="text-white/80 mt-3 text-[14px]"></div><div class="bg-white/10 rounded-2xl p-4 mt-6 text-left"><div class="text-white font-bold text-[13px]">Your vote is secured. Token Burned.</div><div class="text-[#a78bfa] text-[11px] mt-2">Live result is only for Admin & Faculty.</div></div><button onclick="location.reload()" class="w-full mt-6 bg-[#7b5bff] text-white py-4 rounded-2xl font-black">Admin / Faculty Login</button></div>
<script>
let myToken='';
async function verify(){
 const id=document.getElementById('sid').value.trim().toUpperCase();
 const e=document.getElementById('e1'); e.classList.add('hidden');
 if(!id){e.innerText='Enter ID'; e.classList.remove('hidden'); return;}
 e.innerText='Checking KV Safe...'; e.classList.remove('hidden'); e.style.color='#7b5bff';
 const r=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:id})});
 const j=await r.json();
 if(!r.ok){e.style.color='#ef4444'; e.innerText='❌ '+j.error; return;}
 myToken=j.token;
 document.getElementById('tokBox').innerText=myToken;
 document.getElementById('tin').value=myToken;
 document.getElementById('s1').classList.add('hidden');
 document.getElementById('s2').classList.remove('hidden');
}
function nextStep(){
 const t=document.getElementById('tin').value.trim().toUpperCase();
 if(t!==myToken){const e=document.getElementById('e2');e.innerText='Token mismatch!';e.classList.remove('hidden');return;}
 loadCans();
}
async function loadCans(){
 document.getElementById('s2').classList.add('hidden');
 document.getElementById('s3').classList.remove('hidden');
 document.getElementById('cans').innerHTML='Loading...';
 const r=await fetch('/api/public'); const j=await r.json();
 document.getElementById('cans').innerHTML=j.candidates.map(c=>\`<div class="bg-white shadow rounded-2xl p-3 flex items-center gap-3"><div class="w-14 h-14 bg-[#2a344b] rounded-2xl flex items-center justify-center text-white font-black">C</div><div class="flex-1 font-black text-[14px]">\${c.name}</div><button onclick="vote('\${c.id}')" class="bg-[#111d33] text-white px-6 py-3 rounded-2xl font-black text-[12px]">VOTE</button></div>\`).join('');
}
async function vote(cid){
 if(!confirm('Confirm?')) return;
 const r=await fetch('/api/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:myToken,candidateId:cid})});
 const j=await r.json();
 if(!r.ok){const e=document.getElementById('e3');e.innerText=j.error;e.classList.remove('hidden');return;}
 document.getElementById('votedFor').innerText='You voted for '+j.candidateName;
 document.getElementById('s3').classList.add('hidden');
 document.getElementById('s4').classList.remove('hidden');
}
</script></body></html>`));
export default app;

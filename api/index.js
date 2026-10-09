import express from 'express';
import { kv } from '@vercel/kv';
const app = express();
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({extended:true,limit:'50mb'}));

// YOUR REAL HASHES FROM YOUR NOTEPAD PHOTO - SAVED IN VERCEL KV ENV
const SUPER_HASH = process.env.SUPER_HASH || 'z8x2c4v6b9n1m3q5w7e2r4t6y8u1i3o5p2a4s6d8f7e9c1a2b3';
const FACULTY_HASH = process.env.FACULTY_HASH || 'a9f3b7c2d1e8f4a6b9c2d1e8f4a6b9c2d5e8f1a3b7c9d2e5f8a1b2c3';

const KEY_MAIN = "majortech-v4-step1";
const KEY_AUDIT = "majortech-audit-v4";

// Default IDs 001-050 so LISE-040-2025 works by default!
const genIds = () => Array.from({length:50},(_,i)=>`LISE-${String(i+1).padStart(3,'0')}-2025`);
const defaultData = () => ({
  validIds: genIds(),
  candidates:[
    {id:"A", party:"Candidate A", president:"Candidate A", vice:"", presPhoto:"", vicePhoto:"", logo:""},
    {id:"B", party:"Candidate B", president:"Candidate B", vice:"", presPhoto:"", vicePhoto:"", logo:""},
    {id:"C", party:"Candidate C", president:"Candidate C", vice:"", presPhoto:"", vicePhoto:"", logo:""}
  ],
  votes:{}, votedIds:[], tokens:{}
});
async function load(){ let d=await kv.get(KEY_MAIN); if(!d){ d=defaultData(); await kv.set(KEY_MAIN,d);} return d; }
async function save(d){ await kv.set(KEY_MAIN,d); }
async function auditLog(m){ const l=await kv.get(KEY_AUDIT)||[]; l.push(new Date().toISOString()+" - "+m); await kv.set(KEY_AUDIT,l.slice(-500)); }

app.get('/api/public', async (req,res)=>{ res.json(await load()); });

app.post('/api/verify', async (req,res)=>{
  const id=String(req.body.studentId||'').trim().toUpperCase();
  const data=await load();
  if(!data.validIds.includes(id)) return res.status(400).json({error:`ID not found! ${id} is not registered!`});
  if(data.votedIds.includes(id)) return res.status(400).json({error:`Already voted! No double voting! ID ${id} has voted!`});
  const token="TG"+Math.floor(1000+Math.random()*9000);
  data.tokens[token]={studentId:id, used:false}; await save(data); await auditLog(`VERIFY - ${id} -> ${token}`);
  res.json({token});
});

app.post('/api/vote', async (req,res)=>{
  const {token,candidateId}=req.body; const data=await load(); const t=data.tokens[token];
  if(!t||t.used) return res.status(400).json({error:"Invalid or burned token!"});
  if(data.votedIds.includes(t.studentId)) return res.status(400).json({error:`Already voted! ID ${t.studentId} has voted!`});
  data.votes[candidateId]=(data.votes[candidateId]||0)+1; data.votedIds.push(t.studentId); t.used=true;
  await save(data); await auditLog(`VOTE - ${t.studentId} -> ${candidateId}`);
  const cand=data.candidates.find(c=>c.id===candidateId); res.json({ok:true, party:cand?.party||candidateId});
});

app.get('/api/admin/data', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Wrong Super Hash! Use DONT@001 hash from Vercel KV"});
  const main=await load(); const audit=await kv.get(KEY_AUDIT)||[]; res.json({...main, audit});
});
app.post('/api/admin/save', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Wrong hash"});
  const data=await load();
  if(req.body.validIds) data.validIds=req.body.validIds.map(s=>String(s).trim().toUpperCase()).filter(Boolean);
  if(req.body.candidates) data.candidates=req.body.candidates;
  await save(data); res.json({ok:true, data});
});
app.post('/api/admin/reset', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Wrong hash"});
  const data=await load(); data.votes={}; data.votedIds=[]; data.tokens={}; await save(data); await auditLog(`RESET`); res.json({ok:true});
});
app.get('/api/faculty/stats', async (req,res)=>{
  if(req.query.h!==FACULTY_HASH && req.query.h!==SUPER_HASH) return res.status(403).json({error:"Wrong Faculty Hash! Use faculty hash from Vercel KV"});
  const d=await load(); const audit=await kv.get(KEY_AUDIT)||[]; res.json({...d, audit, total:d.votedIds.length});
});

// DONT@001 - REQUESTS YOUR HASH
app.get('/DONT@001',(req,res)=>res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#1a1d29] min-h-screen text-white p-4"><div class="max-w-3xl mx-auto"><h1 class="text-center font-black text-xl mt-6">🔒 DONT@001 SUPER ADMIN</h1><div class="bg-[#2a2d3a] rounded-3xl p-6 mt-6"><div id="gate"><p class="text-xs text-white/60 mb-2">Paste your DONT@001 hash saved in Vercel KV:</p><input id="h" type="password" class="w-full bg-black p-4 rounded-2xl" placeholder="z8x2c4v6b9n1m3q5w7e2r4t6y8u1i3o5p2a4s6d8f7e9c1a2b3"><button onclick="unlock()" class="w-full mt-3 bg-white text-black py-3 rounded-2xl font-black">UNLOCK VAULT ></button><div id="e" class="text-red-400 text-xs mt-2 hidden"></div></div><div id="vault" class="hidden"><textarea id="ids" rows="12" class="w-full bg-black p-4 rounded-2xl mt-4"></textarea><button onclick="saveIds()" class="w-full mt-3 bg-yellow-400 text-black py-3 rounded-2xl font-black">Save IDs -> Voter page updates!</button><button onclick="resetV()" class="w-full mt-2 bg-red-500 py-2 rounded-2xl font-black">Reset Votes</button><div id="msg" class="text-xs mt-2 text-center"></div></div></div></div><script>
async function unlock(){const h=document.getElementById('h').value.trim();const r=await fetch('/api/admin/data?h='+encodeURIComponent(h));const j=await r.json();if(!r.ok){document.getElementById('e').innerText=j.error;document.getElementById('e').classList.remove('hidden');return;}document.getElementById('gate').classList.add('hidden');document.getElementById('vault').classList.remove('hidden');document.getElementById('ids').value=j.validIds.join('\\n');}
async function saveIds(){const h=document.getElementById('h').value.trim();const ids=document.getElementById('ids').value.split('\\n').filter(Boolean);const r=await fetch('/api/admin/save?h='+encodeURIComponent(h),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({validIds:ids})});document.getElementById('msg').innerText=(await r.json()).ok?'Saved! Voter now uses only your real IDs!':'Error';}
async function resetV(){if(!confirm('Reset votes?'))return;const h=document.getElementById('h').value.trim();await fetch('/api/admin/reset?h='+encodeURIComponent(h),{method:'POST'});alert('Votes reset');}
<\/script></body></html>`));

// FACULTY - REQUESTS YOUR HASH
app.get('/faculty',(req,res)=>res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#6b4eff] min-h-screen flex items-center justify-center p-4"><div class="bg-white rounded-[28px] w-full max-w-[420px] overflow-hidden"><div class="bg-[#111d33] p-6"><div class="text-white font-black text-xl">Faculty Dashboard</div><div class="text-white/60 text-xs">Hash from Vercel KV required</div></div><div class="p-6"><p class="text-xs mb-2">Paste faculty hash:</p><input id="h" type="password" class="w-full bg-[#f1f3f9] p-4 rounded-2xl" placeholder="a9f3b7c2d1e8f4a6b9c..."><button onclick="unlock()" class="w-full mt-3 bg-[#111d33] text-white py-3 rounded-2xl font-black">UNLOCK ></button><div id="e" class="text-red-500 text-xs hidden mt-2"></div><div id="stats" class="hidden mt-4"></div></div></div><script>async function unlock(){const h=document.getElementById('h').value.trim();const r=await fetch('/api/faculty/stats?h='+encodeURIComponent(h));const j=await r.json();if(!r.ok){document.getElementById('e').innerText=j.error;document.getElementById('e').classList.remove('hidden');return;}document.getElementById('stats').classList.remove('hidden');document.getElementById('stats').innerHTML='Total Votes: '+j.total+'<br><br>'+j.candidates.map(c=>c.party+': '+(j.votes[c.id]||0)+' votes').join('<br>');}<\/script></body></html>`));

// VOTER PAGE - YOUR 4 PHOTOS FLOW
app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MajorTech</title><script src="https://cdn.tailwindcss.com"></script><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@800;900&display=swap');body{font-family:Inter;background:linear-gradient(180deg,#7b5bff 0%,#6a4bff 100%);min-height:100vh}.card{max-width:380px;margin:0 auto;background:white;border-radius:28px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25)}.header{background:#111d33;padding:22px 24px}.tech{color:#2eb5f5}.err{color:#ef4444;font-size:12px;font-weight:800;margin-top:10px}</style></head><body class="flex items-center justify-center p-4"><div id="s1" class="card w-full"><div class="header"><div class="text-white font-black text-[26px]">Major<span class="tech">Tech</span> Verify</div><div class="text-white/60 text-[12px] mt-1">Official Student ID Verification</div></div><div class="p-6"><div class="font-black text-[11px] tracking-widest">ENTER STUDENT ID NUMBER</div><input id="sid" class="w-full mt-3 bg-[#f1f3f9] p-4 rounded-2xl outline-none font-bold" placeholder="LISE-040-2025" value="LISE-040-2025"><div id="e1" class="err hidden"></div><button onclick="verify()" class="w-full mt-5 bg-[#111d33] text-white py-4 rounded-2xl font-black">VERIFY ></button></div></div><div id="s2" class="card w-full hidden"><div class="header"><div class="text-white font-black text-[26px]">Major<span class="tech">Tech</span> Vote</div><div class="text-white/60 text-[12px]">Token like AB1234</div></div><div class="p-6"><div id="tokBox" class="bg-[#10d876] text-white text-center py-5 rounded-2xl font-black text-[30px] tracking-[5px]">TG0000</div><input id="tin" class="w-full mt-4 border-2 border-gray-100 p-4 rounded-2xl outline-none font-bold"><div id="e2" class="err hidden"></div><button onclick="nextStep()" class="w-full mt-4 bg-[#111d33] text-white py-4 rounded-2xl font-black">ENTER > NEXT</button></div></div><div id="s3" class="card w-full hidden"><div class="header"><div class="text-white font-black text-[22px]">Choose Candidate</div></div><div class="p-4"><div id="cans" class="space-y-3"></div><div id="e3" class="err hidden text-center"></div></div></div><div id="s4" class="card w-full hidden bg-[#111d33] text-center p-8"><div class="w-20 h-20 bg-[#10d876] rounded-full flex items-center justify-center mx-auto text-4xl font-black text-white">✓</div><div class="text-white font-black text-[22px] mt-5">Vote Successful!</div><div id="votedFor" class="text-white/80 mt-3 text-[14px]"></div><div class="bg-white/10 rounded-2xl p-4 mt-6 text-left"><div class="text-white font-bold text-[13px]">Your vote is secured. Token Burned.</div><div class="text-[#a78bfa] text-[11px] mt-2">Live result is only for Admin & Faculty.</div></div><button onclick="location.reload()" class="w-full mt-6 bg-[#7b5bff] text-white py-4 rounded-2xl font-black">Done</button></div><script>
let myToken='';
async function verify(){
 const id=document.getElementById('sid').value.trim().toUpperCase();
 const e=document.getElementById('e1'); e.classList.add('hidden');
 if(!id){e.innerText='Enter ID'; e.classList.remove('hidden'); return;}
 e.innerText='Checking...'; e.classList.remove('hidden'); e.style.color='#7b5bff';
 const r=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:id})});
 const j=await r.json();
 if(!r.ok){e.style.color='#ef4444'; e.innerText='❌ '+j.error; return;}
 myToken=j.token; document.getElementById('tokBox').innerText=myToken; document.getElementById('tin').value=myToken;
 document.getElementById('s1').classList.add('hidden'); document.getElementById('s2').classList.remove('hidden');
}
function nextStep(){ const t=document.getElementById('tin').value.trim().toUpperCase(); if(t!==myToken){const e=document.getElementById('e2');e.innerText='Token mismatch!';e.classList.remove('hidden');return;} loadCans(); }
async function loadCans(){ document.getElementById('s2').classList.add('hidden'); document.getElementById('s3').classList.remove('hidden'); document.getElementById('cans').innerHTML='Loading...'; const r=await fetch('/api/public'); const j=await r.json(); document.getElementById('cans').innerHTML=j.candidates.map(c=>\`<div class="bg-white shadow rounded-2xl p-3 flex items-center gap-3"><div class="w-14 h-14 bg-[#2a344b] rounded-2xl flex items-center justify-center text-white font-black">C</div><div class="flex-1 font-black text-[14px]">\${c.party}</div><button onclick="vote('\${c.id}')" class="bg-[#111d33] text-white px-6 py-3 rounded-2xl font-black text-[12px]">VOTE</button></div>\`).join(''); }
async function vote(cid){ if(!confirm('Confirm vote?')) return; const r=await fetch('/api/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:myToken,candidateId:cid})}); const j=await r.json(); if(!r.ok){const e=document.getElementById('e3');e.innerText=j.error;e.classList.remove('hidden');return;} document.getElementById('votedFor').innerText='You voted for '+j.party; document.getElementById('s3').classList.add('hidden'); document.getElementById('s4').classList.remove('hidden'); }
</script></body></html>`));
export default app;

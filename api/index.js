import express from 'express';
import { kv } from '@vercel/kv';
const app = express();
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({extended:true,limit:'50mb'}));
const SUPER_HASH = process.env.SUPER_HASH || 'z8x2c4v6b9n1m3q5w7e2r4t6y8u1i3o5p2a4s6d8f7e9c1a2b3';
const FACULTY_HASH = process.env.FACULTY_HASH || 'a9f3b7c2d1e8f4a6b9c2d1e8f4a6b9c2d5e8f1a3b7c9d2e5f8a1b2c3';
const KEY_MAIN = "majortech-v8-final";
const KEY_AUDIT = "majortech-audit-v8";
const genIds = () => Array.from({length:60},(_,i)=>`LISE-${String(i+1).padStart(3,'0')}-2025`);
const defaultData = () => ({
  validIds: genIds(),
  candidates:[
    {id:"A", party:"Candidate A", president:"Candidate A", vice:"Vice A", presPhoto:"", vicePhoto:"", logo:""},
    {id:"B", party:"Candidate B", president:"Candidate B", vice:"Vice B", presPhoto:"", vicePhoto:"", logo:""},
    {id:"C", party:"Candidate C", president:"Candidate C", vice:"Vice C", presPhoto:"", vicePhoto:"", logo:""}
  ],
  votes:{}, votedIds:[], tokens:{}
});
async function load(){ let d=await kv.get(KEY_MAIN); if(!d){ d=defaultData(); await kv.set(KEY_MAIN,d);} return d; }
async function save(d){ await kv.set(KEY_MAIN,d); }
async function auditLog(m){ const l=await kv.get(KEY_AUDIT)||[]; l.push(new Date().toISOString()+" - "+m); await kv.set(KEY_AUDIT,l.slice(-1000)); }
// CRYPTO TOKEN - NOT TG CONSTANT - RANDOM LETTER+NUMBER!
function cryptoToken(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let t=""; for(let i=0;i<6;i++){ t+=chars[Math.floor(Math.random()*chars.length)]; }
  return t;
}
app.get('/api/public', async (req,res)=>{ res.json(await load()); });
app.post('/api/verify', async (req,res)=>{
  const id=String(req.body.studentId||'').trim().toUpperCase(); const data=await load();
  if(!data.validIds.includes(id)) return res.status(400).json({error:`ID not found! ${id} not registered!`});
  if(data.votedIds.includes(id)) return res.status(400).json({error:`Already voted! No double voting! ID ${id} has voted!`});
  const token=cryptoToken(); // AB12CD style, not TG!
  data.tokens[token]={studentId:id, used:false}; await save(data); await auditLog(`VERIFY - ${id} -> ${token}`);
  res.json({token});
});
app.post('/api/vote', async (req,res)=>{
  const {token,candidateId}=req.body; const data=await load(); const t=data.tokens[token];
  if(!t||t.used) return res.status(400).json({error:"Token Burned or Invalid!"});
  if(data.votedIds.includes(t.studentId)) return res.status(400).json({error:`Already voted! ID ${t.studentId} has voted!`});
  data.votes[candidateId]=(data.votes[candidateId]||0)+1; data.votedIds.push(t.studentId); t.used=true;
  await save(data); await auditLog(`VOTE - ${t.studentId} -> ${candidateId}`);
  const cand=data.candidates.find(c=>c.id===candidateId); res.json({ok:true, party:cand?.party||candidateId});
});
app.get('/api/admin/data', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Wrong Super Hash"});
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
  const data=await load(); data.votes={}; data.votedIds=[]; data.tokens={}; await save(data); res.json({ok:true});
});
app.get('/api/faculty/stats', async (req,res)=>{
  if(req.query.h!==FACULTY_HASH && req.query.h!==SUPER_HASH) return res.status(403).json({error:"Wrong Faculty Hash"});
  const d=await load(); res.json({candidates:d.candidates, votes:d.votes, total:d.votedIds.length});
});

app.get('/DONT@001',(req,res)=>res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#0f172a] min-h-screen text-white p-3"><div class="max-w-5xl mx-auto"><h1 class="text-center font-black mt-2">🔒 DONT@001 SUPER ADMIN</h1><div class="bg-[#1e293b] rounded-3xl p-4 mt-4"><div id="gate"><input id="h" type="password" class="w-full bg-black p-4 rounded-2xl" placeholder="Paste DONT@001 hash"><button onclick="unlock()" class="w-full mt-3 bg-white text-black py-3 rounded-2xl font-black">UNLOCK ></button><div id="e" class="text-red-400 text-xs mt-2 hidden"></div></div><div id="vault" class="hidden"><div class="flex gap-2 flex-wrap"><button onclick="show('ids')" class="bg-yellow-400 text-black px-3 py-2 rounded-xl font-black text-xs">Upload IDs</button><button onclick="show('cand')" class="bg-green-500 px-3 py-2 rounded-xl font-black text-xs">Candidates</button><button onclick="show('audit')" class="bg-blue-500 px-3 py-2 rounded-xl font-black text-xs">Audit Log</button><button onclick="resetV()" class="bg-red-500 px-3 py-2 rounded-xl font-black text-xs">Reset</button></div>
<div id="p-ids" class="mt-4"><textarea id="ids" rows="8" class="w-full bg-black p-3 rounded-2xl"></textarea><button onclick="saveIds()" class="w-full mt-3 bg-yellow-400 text-black py-3 rounded-2xl font-black">Save IDs</button></div>
<div id="p-cand" class="hidden mt-4"><div class="bg-black p-4 rounded-2xl"><p class="text-xs text-green-400">✅ Active! Add one party, save, then form clears to add 2nd party! A,B,C auto removed!</p><input id="party" class="w-full bg-[#1e293b] p-3 rounded-xl mt-3 border-2 border-green-500" placeholder="Party Name REQUIRED e.g. ALL STUDENT PARTY (ALP)"><div class="grid grid-cols-2 gap-3 mt-3"><div><label class="text-[10px]">PRESIDENT</label><input id="pres" class="w-full bg-[#1e293b] p-3 rounded-xl mt-1" placeholder="RAYS B. TOE"><input id="presPhoto" type="file" accept="image/*" class="w-full bg-[#1e293b] p-2 rounded-xl mt-2 text-xs"><img id="pPrev" class="w-20 h-20 rounded-xl mt-2 hidden object-cover"></div><div><label class="text-[10px]">VICE PRESIDENT</label><input id="vice" class="w-full bg-[#1e293b] p-3 rounded-xl mt-1" placeholder="JOHN D. BLAMA"><input id="vicePhoto" type="file" accept="image/*" class="w-full bg-[#1e293b] p-2 rounded-xl mt-2 text-xs"><img id="vPrev" class="w-20 h-20 rounded-xl mt-2 hidden object-cover"></div></div><label class="text-[10px] mt-3 block">Party Logo</label><input id="logo" type="file" accept="image/*" class="w-full bg-[#1e293b] p-2 rounded-xl mt-1 text-xs"><img id="lPrev" class="w-20 h-20 rounded-xl mt-2 hidden object-cover"><button onclick="addCand()" class="w-full mt-4 bg-[#22c55e] py-4 rounded-2xl font-black">Add Candidate -> Reflects In Voter!</button><div class="text-xs mt-2 text-yellow-300" id="msg"></div></div><div id="clist" class="mt-4 space-y-2"></div></div>
<div id="p-audit" class="hidden mt-4"><div class="bg-black rounded-2xl p-4 h-[400px] overflow-auto font-mono text-xs text-green-400" id="abox"></div></div>
</div></div></div><script>
let DATA=null; let pB='', vB='', lB='';
function compress(file, cb){ if(!file){cb('');return;} const r=new FileReader(); r.onload=e=>{ const img=new Image(); img.onload=()=>{ const canvas=document.createElement('canvas'); const max=400; let w=img.width, h=img.height; if(w>h){ if(w>max){ h*=max/w; w=max; } } else { if(h>max){ w*=max/h; h=max; } } canvas.width=w; canvas.height=h; canvas.getContext('2d').drawImage(img,0,0,w,h); cb(canvas.toDataURL('image/jpeg',0.6)); }; img.src=e.target.result; }; r.readAsDataURL(file); }
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('presPhoto').addEventListener('change',e=>{ if(e.target.files[0]) compress(e.target.files[0],b=>{pB=b; document.getElementById('pPrev').src=b; document.getElementById('pPrev').classList.remove('hidden');}); });
  document.getElementById('vicePhoto').addEventListener('change',e=>{ if(e.target.files[0]) compress(e.target.files[0],b=>{vB=b; document.getElementById('vPrev').src=b; document.getElementById('vPrev').classList.remove('hidden');}); });
  document.getElementById('logo').addEventListener('change',e=>{ if(e.target.files[0]) compress(e.target.files[0],b=>{lB=b; document.getElementById('lPrev').src=b; document.getElementById('lPrev').classList.remove('hidden');}); });
});
async function unlock(){const h=document.getElementById('h').value.trim();const r=await fetch('/api/admin/data?h='+encodeURIComponent(h));const j=await r.json();if(!r.ok){document.getElementById('e').innerText=j.error;document.getElementById('e').classList.remove('hidden');return;}DATA=j;document.getElementById('gate').classList.add('hidden');document.getElementById('vault').classList.remove('hidden');document.getElementById('ids').value=j.validIds.join('\\n');render(j.candidates);loadAudit();}
function show(p){document.getElementById('p-ids').classList.add('hidden');document.getElementById('p-cand').classList.add('hidden');document.getElementById('p-audit').classList.add('hidden');document.getElementById('p-'+p).classList.remove('hidden');}
async function saveIds(){const h=document.getElementById('h').value.trim();const ids=document.getElementById('ids').value.split('\\n').filter(Boolean);const r=await fetch('/api/admin/save?h='+encodeURIComponent(h),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({validIds:ids})});alert((await r.json()).ok?'IDs Saved!':'Error');}
async function addCand(){
 const h=document.getElementById('h').value.trim();
 const party=document.getElementById('party').value.trim();
 if(!party){alert('Party name needed!');return;}
 const pres=document.getElementById('pres').value.trim();
 const vice=document.getElementById('vice').value.trim();
 let cands=DATA.candidates||[];
 const isDefault = cands.length===3 && cands.some(c=>c.party==='Candidate A');
 if(isDefault){ cands=[]; }
 cands.push({id:'T'+Date.now(), party, president:pres, vice, presPhoto:pB, vicePhoto:vB, logo:lB});
 const r=await fetch('/api/admin/save?h='+encodeURIComponent(h),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({candidates:cands})});
 const j=await r.json();
 if(j.ok){
  DATA.candidates=j.data.candidates; render(j.data.candidates);
  document.getElementById('msg').innerText='✅ '+party+' saved! Now add 2nd party - form cleared! Check voter page!';
  document.getElementById('party').value=''; document.getElementById('pres').value=''; document.getElementById('vice').value='';
  document.getElementById('presPhoto').value=''; document.getElementById('vicePhoto').value=''; document.getElementById('logo').value='';
  pB=''; vB=''; lB=''; document.getElementById('pPrev').classList.add('hidden'); document.getElementById('vPrev').classList.add('hidden'); document.getElementById('lPrev').classList.add('hidden');
 } else { alert('Failed'); }
}
function render(list){document.getElementById('clist').innerHTML=list.map(c=>'<div class=bg-black p-3 rounded-xl flex gap-3 items-center><img src="'+(c.logo||c.presPhoto||'https://via.placeholder.com/100')+'" class="w-12 h-12 rounded-xl object-cover"><div class=flex-1><b class=text-sm>'+c.party+'</b><div class=text-xs>'+c.president+' / '+c.vice+'</div></div><button onclick="delCand(\\''+c.id+'\\')" class="bg-red-600 px-3 py-1 rounded text-xs">Del</button></div>').join('');}
async function delCand(id){const h=document.getElementById('h').value.trim();const cands=DATA.candidates.filter(c=>c.id!==id);const r=await fetch('/api/admin/save?h='+encodeURIComponent(h),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({candidates:cands})});const j=await r.json();if(j.ok){DATA.candidates=j.data.candidates;render(j.data.candidates);}}
async function resetV(){if(!confirm('Reset votes?'))return;const h=document.getElementById('h').value.trim();await fetch('/api/admin/reset?h='+encodeURIComponent(h),{method:'POST'});alert('Reset');}
async function loadAudit(){const h=document.getElementById('h').value.trim();const r=await fetch('/api/admin/data?h='+encodeURIComponent(h));const j=await r.json();document.getElementById('abox').innerText=(j.audit||[]).join('\\n');}
<\/script></body></html>`));

app.get('/faculty',(req,res)=>res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#f5f5f7] min-h-screen"><div id="gate" class="min-h-screen flex items-center justify-center p-4 bg-[#6b4eff]"><div class="bg-white rounded-[28px] w-full max-w-[420px] overflow-hidden"><div class="bg-[#111d33] p-6"><div class="text-white font-black text-xl">Faculty Dashboard</div></div><div class="p-6"><input id="h" type="password" class="w-full bg-[#f1f3f9] p-4 rounded-2xl" placeholder="Paste faculty hash"><button onclick="unlock()" class="w-full mt-3 bg-[#111d33] text-white py-3 rounded-2xl font-black">UNLOCK LIVE ></button><div id="e" class="text-red-500 text-xs hidden mt-2"></div></div></div></div><div id="dash" class="hidden"><div class="bg-[#111d33] text-white p-4 flex justify-between"><div class="font-black text-sm">Live Results - <span class="bg-green-500 text-black text-[10px] px-2 py-1 rounded-full">LIVE</span></div><div id="time" class="text-xs"></div></div><div class="max-w-5xl mx-auto p-4"><div class="grid grid-cols-4 gap-3"><div class="bg-white rounded-2xl p-3 text-center shadow"><div class="text-[10px]">TOTAL VOTES</div><div id="total" class="font-black text-xl">0</div></div><div class="bg-white rounded-2xl p-3 text-center shadow"><div class="text-[10px]">TEAMS</div><div id="teams" class="font-black text-xl">0</div></div><div class="bg-white rounded-2xl p-3 text-center shadow"><div class="text-[10px]">LEADING</div><div id="leading" class="font-black text-[10px]">-</div></div><div class="bg-white rounded-2xl p-3 text-center shadow"><div class="text-[10px]">STATUS</div><div class="font-black text-xs text-green-500">LIVE</div></div></div><div id="results" class="mt-4 space-y-3"></div></div></div><script>async function unlock(){const h=document.getElementById('h').value.trim();const r=await fetch('/api/faculty/stats?h='+encodeURIComponent(h));const j=await r.json();if(!r.ok){document.getElementById('e').innerText=j.error;document.getElementById('e').classList.remove('hidden');return;}document.getElementById('gate').classList.add('hidden');document.getElementById('dash').classList.remove('hidden');render(j);setInterval(async()=>{const rr=await fetch('/api/faculty/stats?h='+encodeURIComponent(h));const jj=await rr.json();if(rr.ok)render(jj);},3000);}function render(j){document.getElementById('total').innerText=j.total||0;document.getElementById('teams').innerText=j.candidates.length;let maxV=0,lead='-';j.candidates.forEach(c=>{const v=j.votes[c.id]||0;if(v>maxV){maxV=v;lead=c.party;}});document.getElementById('leading').innerText=lead;document.getElementById('results').innerHTML=j.candidates.map(c=>{const v=j.votes[c.id]||0;const pct=j.total?Math.round(v/j.total*100):0;const isLead=v===maxV&&v>0;return '<div class="bg-white rounded-2xl p-4 shadow '+(isLead?'border-2 border-yellow-300':'')+'"><div class=flex justify-between><div class=flex gap-3 items-center><img src="'+(c.logo||'')+'" class="w-10 h-10 rounded-xl bg-gray-100 object-cover"><div><div class=font-black text-sm>'+c.party+'</div><div class=text-xs text-gray-500>'+v+' votes • '+pct+'%</div></div></div><div class=text-right><div class=font-black>'+pct+'%</div><div class=text-xs>'+v+' VOTES</div></div></div><div class="w-full bg-gray-100 h-2.5 rounded-full mt-3"><div class="bg-green-500 h-2.5 rounded-full" style="width:'+pct+'%"></div></div><div class="grid grid-cols-2 gap-4 mt-3 text-[11px]"><span class=flex items-center gap-1><img src="'+(c.presPhoto||'')+'" class="w-5 h-5 rounded-full bg-gray-100 object-cover"> President: '+c.president+'</span><span class=flex items-center gap-1><img src="'+(c.vicePhoto||'')+'" class="w-5 h-5 rounded-full bg-gray-100 object-cover"> Vice: '+c.vice+'</span></div></div>';}).join('');document.getElementById('time').innerText=new Date().toLocaleTimeString();}<\/script></body></html>`));

app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MajorTech</title><script src="https://cdn.tailwindcss.com"></script><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@800;900&display=swap');body{font-family:Inter;background:linear-gradient(180deg,#7b5bff 0%,#6a4bff 100%);min-height:100vh}.card{max-width:380px;margin:0 auto;background:white;border-radius:28px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25)}.header{background:#111d33;padding:22px 24px}.tech{color:#2eb5f5}.err{color:#ef4444;font-size:12px;font-weight:800;margin-top:10px}</style></head><body class="flex items-center justify-center p-4"><div id="s1" class="card w-full"><div class="header"><div class="text-white font-black text-[26px]">Major<span class="tech">Tech</span> Verify</div><div class="text-white/60 text-[12px] mt-1">Official Student ID Verification</div></div><div class="p-6"><div class="font-black text-[11px] tracking-widest">ENTER STUDENT ID NUMBER</div><input id="sid" class="w-full mt-3 bg-[#f1f3f9] p-4 rounded-2xl outline-none font-bold" placeholder="LISE-040-2025" value="LISE-040-2025"><div id="e1" class="err hidden"></div><button onclick="verify()" class="w-full mt-5 bg-[#111d33] text-white py-4 rounded-2xl font-black">VERIFY ></button></div></div><div id="s2" class="card w-full hidden"><div class="header"><div class="text-white font-black text-[26px]">Major<span class="tech">Tech</span> Vote</div><div class="text-white/60 text-[12px]">Crypto token like XK9P2M</div></div><div class="p-6"><div id="tokBox" class="bg-[#10d876] text-white text-center py-5 rounded-2xl font-black text-[24px] tracking-[3px]">------</div><input id="tin" class="w-full mt-4 border-2 border-gray-100 p-4 rounded-2xl outline-none font-bold text-center"><div id="e2" class="err hidden"></div><button onclick="nextStep()" class="w-full mt-4 bg-[#111d33] text-white py-4 rounded-2xl font-black">ENTER > NEXT</button></div></div><div id="s3" class="w-full max-w-[560px] mx-auto hidden"><div class="bg-[#111d33] text-white p-6 rounded-t-[28px] text-center"><div class="font-black text-2xl">Choose Team</div><div class="text-white/60 text-sm">President + Vice President - Side by Side</div></div><div class="bg-[#f5f5f7] p-4 rounded-b-[28px]"><div id="cans" class="space-y-4"></div><div id="e3" class="err hidden text-center"></div></div></div><div id="s4" class="card w-full hidden bg-[#111d33] text-center p-8"><div class="w-20 h-20 bg-[#10d876] rounded-full flex items-center justify-center mx-auto text-4xl font-black text-white">✓</div><div class="text-white font-black text-[22px] mt-5">Vote Successful!</div><div id="votedFor" class="text-white/80 mt-3 text-[14px]"></div><div class="bg-white/10 rounded-2xl p-4 mt-6 text-left"><div class="text-white font-bold text-[13px]">Your vote is secured. Token Burned.</div></div><button onclick="location.reload()" class="w-full mt-6 bg-[#7b5bff] text-white py-4 rounded-2xl font-black">Done</button></div><script>
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
function nextStep(){ const t=document.getElementById('tin').value.trim().toUpperCase(); if(t!==myToken){const e=document.getElementById('e2');e.innerText='Token mismatch! Enter exact crypto token!';e.classList.remove('hidden');return;} loadCans(); }
async function loadCans(){ document.getElementById('s2').classList.add('hidden'); document.getElementById('s3').classList.remove('hidden'); document.getElementById('cans').innerHTML='Loading teams...'; const r=await fetch('/api/public'); const j=await r.json(); document.getElementById('cans').innerHTML=j.candidates.map(c=>\`
<div class="bg-white rounded-[24px] p-5 shadow">
  <div class=flex items-center gap-3>
    <img src="\${c.logo||''}" class="w-12 h-12 rounded-xl bg-gray-100 object-cover">
    <div class=font-black text-sm>\${c.party}</div>
  </div>
  <!-- SIDE BY SIDE FIXED - NOT UP AND DOWN! -->
  <div class="grid grid-cols-2 gap-4 mt-5">
    <div class=text-center>
      <img src="\${c.presPhoto||''}" class="w-28 h-28 rounded-2xl object-cover mx-auto bg-gray-100 border-2">
      <div class="text-[10px] text-gray-400 mt-2">PRESIDENT</div>
      <div class=font-black text-xs>\${c.president||''}</div>
    </div>
    <div class=text-center>
      <img src="\${c.vicePhoto||''}" class="w-28 h-28 rounded-2xl object-cover mx-auto bg-gray-100 border-2">
      <div class="text-[10px] text-gray-400 mt-2">VICE PRESIDENT</div>
      <div class=font-black text-xs>\${c.vice||''}</div>
    </div>
  </div>
  <button onclick="vote('\${c.id}')" class="w-full mt-5 bg-[#22c55e] text-white py-4 rounded-2xl font-black text-sm">VOTE FOR \${c.party}</button>
</div>\`).join(''); }
async function vote(cid){ if(!confirm('Confirm? Token will burn!')) return; const r=await fetch('/api/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:myToken,candidateId:cid})}); const j=await r.json(); if(!r.ok){const e=document.getElementById('e3');e.innerText=j.error;e.classList.remove('hidden');return;} document.getElementById('votedFor').innerText='You voted for '+j.party; document.getElementById('s3').classList.add('hidden'); document.getElementById('s4').classList.remove('hidden'); }
</script></body></html>`));
export default app;

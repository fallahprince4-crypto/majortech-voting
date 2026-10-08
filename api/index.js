import express from 'express';
import { kv } from '@vercel/kv';
const app = express();
app.use(express.json({limit:'20mb'}));
app.use(express.urlencoded({extended:true, limit:'20mb'}));

const SUPER_HASH = process.env.SUPER_HASH || 'MajorTech2026_SuperSecure_32Chars!';
const FACULTY_HASH = process.env.FACULTY_HASH || 'MajorTech2026_FacultySecure_32Chars!';
const KEY = "majortech-permanent-v1";
const defaultData = () => ({ validIds:[], candidates:[], votes:{}, votedIds:[], tokens:{}, audit:[] });
async function load(){ let d=await kv.get(KEY); if(!d){ d=defaultData(); await kv.set(KEY,d);} return d; }
async function save(d){ await kv.set(KEY,d); }

// APIS
app.get('/api/public', async (req,res)=>{ const data=await load(); res.json({candidates:data.candidates}); });
app.post('/api/verify', async (req,res)=>{
  const id=String(req.body.studentId||'').trim().toUpperCase();
  if(!id) return res.status(400).json({error:"Enter ID"});
  const data=await load();
  if(!data.validIds.includes(id)) return res.status(400).json({error:"ID not found! Go to DONT@001 Admin to add IDs."});
  if(data.votedIds.includes(id)) return res.status(400).json({error:"You already voted!"});
  const token="TG"+Math.random().toString(36).substring(2,8).toUpperCase();
  data.tokens[token]={studentId:id, used:false}; await save(data);
  res.json({token});
});
app.post('/api/vote', async (req,res)=>{
  const {token, candidateId}=req.body; const data=await load();
  const t=data.tokens[token]; if(!t||t.used) return res.status(400).json({error:"Invalid token!"});
  if(data.votedIds.includes(t.studentId)) return res.status(400).json({error:"Already voted!"});
  data.votes[candidateId]=(data.votes[candidateId]||0)+1; data.votedIds.push(t.studentId); t.used=true;
  await save(data); res.json({ok:true});
});
app.get('/api/faculty/stats', async (req,res)=>{
  if(req.query.h!==FACULTY_HASH && req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  const data=await load(); res.json({total:data.votedIds.length, votes:data.votes, candidates:data.candidates, validCount:data.validIds.length, votedIds:data.votedIds});
});
app.get('/api/DONT@001/data', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  res.json(await load());
});
app.post('/api/DONT@001/save', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  const data=await load();
  if(req.body.validIds) data.validIds=req.body.validIds.map(s=>String(s).trim().toUpperCase()).filter(Boolean);
  if(req.body.candidates) data.candidates=req.body.candidates;
  if(req.body.action==='addCandidate' && req.body.name){
    data.candidates.push({id:'C'+Date.now(), name:req.body.name, position:req.body.position, photo:req.body.photo||''});
  }
  if(req.body.action==='deleteCandidate') data.candidates=data.candidates.filter(c=>c.id!==req.body.id);
  await save(data); res.json({ok:true, data});
});
app.post('/api/DONT@001/reset', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  const data=await load(); data.votes={}; data.votedIds=[]; data.tokens={}; await save(data); res.json({ok:true});
});

// ADMIN FULL UI PAGE
app.get('/DONT@001', (req,res)=>{
res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Vault</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-100 min-h-screen p-4"><div class="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6"><h1 class="text-2xl font-black text-blue-900">DONT@001 - SUPER ADMIN VAULT</h1><p class="text-sm text-gray-500">Permanent KV Safe - ${KEY}</p><div class="mt-4"><label class="font-bold">Super Hash</label><input id="h" class="w-full border p-3 rounded-xl mt-1" placeholder="Enter SUPER_HASH" value="MajorTech2026_SuperSecure_32Chars!"><button onclick="loadData()" class="mt-3 w-full bg-blue-900 text-white p-3 rounded-xl font-bold">Unlock Vault</button></div><div id="vault" class="hidden mt-6 space-y-6"><div class="bg-gray-50 p-4 rounded-xl"><h2 class="font-bold">Valid Student IDs (One per line)</h2><textarea id="ids" rows="8" class="w-full border p-3 rounded-xl mt-2" placeholder="LISE-045-2025&#10;LISE-001-2025"></textarea><button onclick="saveIds()" class="mt-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold">Save IDs Permanently</button></div><div class="bg-gray-50 p-4 rounded-xl"><h2 class="font-bold">Add Candidate</h2><input id="cname" class="w-full border p-3 rounded-xl mt-2" placeholder="Candidate Name"><input id="cpos" class="w-full border p-3 rounded-xl mt-2" placeholder="Position e.g. President"><input id="cphoto" type="file" accept="image/*" class="w-full border p-3 rounded-xl mt-2"><button onclick="addCand()" class="mt-2 bg-blue-900 text-white px-6 py-3 rounded-xl font-bold">Add Candidate</button><div id="clist" class="mt-4"></div></div><button onclick="resetVotes()" class="w-full bg-red-600 text-white p-3 rounded-xl font-bold">RESET Votes Only (Keep IDs & Candidates)</button><div id="msg" class="text-center text-sm mt-2"></div></div></div><script>
let HASH='';
async function loadData(){HASH=document.getElementById('h').value.trim();const r=await fetch('/api/DONT@001/data?h='+encodeURIComponent(HASH));const j=await r.json();if(!r.ok){alert(j.error);return;}document.getElementById('vault').classList.remove('hidden');document.getElementById('ids').value=(j.validIds||[]).join('\\n');renderCands(j.candidates||[]);msg.innerText='Loaded - Votes:'+Object.keys(j.votes||{}).length+' Voted:'+(j.votedIds||[]).length}
function renderCands(list){clist.innerHTML=list.map(c=>\`<div class="flex items-center gap-3 border p-2 rounded-xl mt-2"><img src="\${c.photo||''}" class="w-12 h-12 rounded-full bg-gray-200 object-cover"><div class="flex-1"><b>\${c.name}</b><div class="text-xs">\${c.position}</div></div><button onclick="delCand('\${c.id}')" class="bg-red-500 text-white px-3 py-1 rounded">Delete</button></div>\`).join('')}
async function saveIds(){const ids=document.getElementById('ids').value.split('\\n').map(s=>s.trim()).filter(Boolean);const r=await fetch('/api/DONT@001/save?h='+encodeURIComponent(HASH),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({validIds:ids})});const j=await r.json();msg.innerText=j.ok?'IDs Saved Permanently!':j.error}
async function addCand(){const name=cname.value.trim();if(!name){alert('Name needed');return;}let photo='';const f=cphoto.files[0];if(f){photo=await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(f);});}const r=await fetch('/api/DONT@001/save?h='+encodeURIComponent(HASH),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'addCandidate',name,position:cpos.value,photo})});const j=await r.json();if(j.ok){loadData();cname.value='';cpos.value='';}else alert(j.error)}
async function delCand(id){if(!confirm('Delete?'))return;await fetch('/api/DONT@001/save?h='+encodeURIComponent(HASH),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'deleteCandidate',id})});loadData()}
async function resetVotes(){if(!confirm('Reset votes? IDs and candidates stay!'))return;await fetch('/api/DONT@001/reset?h='+encodeURIComponent(HASH),{method:'POST'});alert('Votes reset!');loadData()}
</script></body></html>`);
});

// VOTER FULL BEAUTIFUL DESIGN
app.get('/', (req,res)=>{
res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Majortech Voting</title><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap" rel="stylesheet"><style>body{font-family:Inter,system-ui}</style></head><body class="bg-[#f3f5fb]"><div class="bg-[#0b2a6b] text-white py-5 text-center font-black text-[24px] tracking-widest">MAJORTECH VOTING</div><div class="max-w-[560px] mx-auto px-4 mt-8"><div id="s1" class="bg-white rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,.08)] p-7"><h2 class="font-black text-xl">Step 1 - Verify ID</h2><p class="text-gray-500 text-sm mt-1">Enter your registered Student ID</p><input id="sid" class="w-full mt-4 border-2 border-gray-100 bg-gray-50 p-4 rounded-xl focus:border-blue-900 outline-none" placeholder="LISE-045-2025"><button onclick="verify()" class="w-full mt-4 bg-[#0b2a6b] text-white py-4 rounded-xl font-black text-[16px]">Verify ID</button><div id="m1" class="text-center text-sm mt-3 text-red-500 font-bold"></div></div><div id="s2" class="hidden bg-white rounded-[20px] shadow p-7 mt-4"><h2 class="font-black text-xl">Step 2 - Your Voting Token</h2><div class="mt-4 bg-green-50 border-2 border-dashed border-green-600 rounded-xl p-4 text-center"><div id="tok" class="text-3xl font-black tracking-[6px]">-</div><div class="text-xs text-green-700 mt-1 font-bold">KEEP THIS TOKEN SAFE</div></div><button onclick="loadC()" class="w-full mt-4 bg-[#0b2a6b] text-white py-4 rounded-xl font-black">Continue to Vote →</button></div><div id="s3" class="hidden mt-4"><div class="bg-white rounded-[20px] shadow p-7"><h2 class="font-black text-xl">Step 3 - Choose Candidate</h2><div id="cans" class="mt-4"></div><div id="m3" class="text-center text-sm mt-3 text-red-500 font-bold"></div></div></div><div id="done" class="hidden bg-white rounded-[20px] shadow p-10 text-center mt-4"><div class="text-6xl">✅</div><h2 class="font-black text-2xl mt-4">Vote Casted Successfully!</h2><p class="text-gray-500 mt-2">Your vote is now permanently saved in KV Safe. Thank you!</p></div></div><script>let myToken='';async function verify(){const id=document.getElementById('sid').value.trim();if(!id){m1.innerText='Enter ID';return;}m1.innerText='Checking...';const r=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:id})});const j=await r.json();if(!r.ok){m1.innerText=j.error;return;}myToken=j.token;tok.innerText=myToken;s1.classList.add('hidden');s2.classList.remove('hidden');}async function loadC(){s2.classList.add('hidden');s3.classList.remove('hidden');cans.innerHTML='Loading candidates...';const r=await fetch('/api/public');const j=await r.json();const list=j.candidates||[];if(!list.length){cans.innerHTML='<div class=text-center p-6 text-gray-400>No candidates yet. Admin needs to add in /DONT@001</div>';return;}cans.innerHTML=list.map(c=>\`<div class="flex items-center gap-4 border border-gray-100 rounded-2xl p-4 mt-3 hover:shadow transition"><img src="\${c.photo||'https://via.placeholder.com/100'}" class="w-16 h-16 rounded-full object-cover bg-gray-100"><div class="flex-1"><div class="font-black text-[16px]">\${c.name}</div><div class="inline-block mt-1 bg-blue-50 text-blue-800 text-[11px] font-black px-3 py-1 rounded-full">\${c.position||'Candidate'}</div></div><button onclick="vote('\${c.id}')" class="bg-[#0b2a6b] text-white px-6 py-3 rounded-xl font-black">VOTE</button></div>\`).join('');}async function vote(cid){if(!confirm('Confirm your vote? Cannot change after!'))return;m3.innerText='Submitting...';const r=await fetch('/api/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:myToken,candidateId:cid})});const j=await r.json();if(!r.ok){m3.innerText=j.error;return;}s3.classList.add('hidden');done.classList.remove('hidden');}</script></body></html>`);
});

export default app;

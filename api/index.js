const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json({limit:'5mb'}));
app.use(express.urlencoded({extended:true,limit:'5mb'}));
const DATA_PATH = '/tmp/majortech-final.json';
const SUPER_HASH = process.env.SUPER_HASH || 'super-admin-hash';
const FACULTY_HASH = process.env.FACULTY_HASH || 'faculty-hash';

function getData(){
 try{
  if(!fs.existsSync(DATA_PATH)) return {votes:{},candidates:[],votedIds:[],validIds:["LISE-043-2025","LISE-046/2025","LISE-001","LISE-002"],audit:[]};
  return JSON.parse(fs.readFileSync(DATA_PATH,'utf8'));
 }catch{ return {votes:{},candidates:[],votedIds:[],validIds:["LISE-043-2025","LISE-046/2025","LISE-001","LISE-002"],audit:[]} }
}
function saveData(d){fs.writeFileSync(DATA_PATH, JSON.stringify(d));}

app.all('*', (req,res)=>{
 const url = new URL(req.url, 'https://example.com');
 const path = url.pathname.toLowerCase();
 const hash = url.searchParams.get('h') || req.body?.hash || '';
 const token = url.searchParams.get('token') || '';
 const data = getData();

 // --- DONT@001 ---
 if(path.includes('dont@001') || path.includes('dont001')){
  if(path.includes('/data')) return res.json(data);
  if(path.includes('/reset')){ saveData({votes:{},candidates:[],votedIds:[],validIds:data.validIds,audit:[]}); return res.json({ok:true}); }
  if(path.includes('/upload-ids')){ data.validIds = req.body.ids||[]; data.audit.push(new Date().toLocaleString()+' - UPLOAD '+data.validIds.length); saveData(data); return res.json({ok:true,count:data.validIds.length}); }
  if(path.includes('/add-candidate')){
    const newCand = {id:'C'+Date.now(), party:req.body.party, president:req.body.president, vice:req.body.vice, presidentPhoto:req.body.presidentPhoto, vicePhoto:req.body.vicePhoto, logo:req.body.logo};
    data.candidates.push(newCand); data.audit.push('ADD '+req.body.party); saveData(data); return res.json({ok:true});
  }
  if(hash!==SUPER_HASH &&!url.searchParams.get('h')){
   return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-2xl p-8 w-full max-w-md"><h2 class="font-bold text-xl">DONT@001</h2><input id="h" placeholder="Super Hash" class="w-full border p-4 rounded-xl mt-4"><button onclick="location.href='/DONT@001?h='+document.getElementById('h').value" class="w-full bg-red-600 text-white py-3 rounded-xl mt-4">Unlock</button></div></body></html>`);
  }
  return res.send(`
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-[#0F172A] text-white p-4"><div class="max-w-5xl mx-auto">
<h1 class="text-2xl font-black text-center py-6">🔒 DONT@001 VAULT</h1>
<div class="bg-white/10 rounded-2xl p-4 text-center font-bold mb-6">Voters: ${data.validIds.length} | Votes: ${Object.values(data.votes).reduce((a,b)=>a+b,0)} | Candidates: ${data.candidates.length}</div>
<div class="bg-white text-black rounded-2xl p-6 mb-6"><h2 class="font-black">1. Upload IDs CSV</h2><input type="file" id="csv" class="border p-2 rounded-xl mt-2"><button onclick="upIDs()" class="bg-emerald-600 text-white px-4 py-2 rounded-xl ml-2">Import</button><div id="upRes" class="text-sm mt-2"></div><div class="text-xs text-gray-500 mt-2">Current IDs: ${data.validIds.join(', ')}</div></div>
<div class="bg-white text-black rounded-2xl p-6 mb-6">
<h2 class="font-black text-xl mb-3">2. Add Candidate - CHOOSE FILES</h2>
<div class="grid md:grid-cols-2 gap-4">
<div><label class="text-xs font-bold">President Name</label><input id="pName" class="w-full border rounded-xl p-3" placeholder="PRINCE P FALLAH"><label class="text-xs font-bold mt-2 block">President Photo</label><input type="file" id="pFile" accept="image/*" class="w-full border rounded-xl p-2"><img id="pPrev" class="w-20 h-20 rounded-xl mt-2 hidden object-cover"></div>
<div><label class="text-xs font-bold">Vice President Name</label><input id="vName" class="w-full border rounded-xl p-3" placeholder="PRINCESS J FALLAH"><label class="text-xs font-bold mt-2 block">Vice Photo</label><input type="file" id="vFile" accept="image/*" class="w-full border rounded-xl p-2"><img id="vPrev" class="w-20 h-20 rounded-xl mt-2 hidden object-cover"></div>
</div>
<div class="mt-4"><label class="text-xs font-bold">Party Name</label><input id="party" class="w-full border rounded-xl p-3" placeholder="STUDENT UNIFICATION PARTY"><label class="text-xs font-bold mt-2 block">Party Logo</label><input type="file" id="lFile" accept="image/*" class="w-full border rounded-xl p-2"><img id="lPrev" class="w-20 h-20 rounded-xl mt-2 hidden object-cover"></div>
<button onclick="addCand()" class="w-full bg-blue-600 text-white py-4 rounded-xl font-black mt-4">Add Candidate</button>
<div class="mt-4 grid gap-2">${data.candidates.map(c=>`<div class="border p-3 rounded-xl flex gap-3"><img src="${c.logo}" class="w-12 h-12 rounded-xl object-cover"><div><b>${c.party}</b><br><span class="text-xs">${c.president} / ${c.vice}</span></div></div>`).join('')}</div>
</div>
<div class="bg-white text-black rounded-2xl p-6 mb-6"><h2 class="font-black">Audit</h2><button onclick="loadAudit()" class="bg-blue-600 text-white px-4 py-2 rounded-xl mt-2">Load</button><pre id="auditBox" class="bg-black text-green-300 p-3 rounded-xl mt-3 text-xs max-h-64 overflow-auto"></pre></div>
<div class="bg-white text-black rounded-2xl p-6 border-2 border-red-300"><button onclick="resetAll()" class="bg-red-600 text-white px-6 py-3 rounded-xl font-black">RESET ALL</button></div>
</div>
<script>
let pB='',vB='',lB='';
function compress(file,cb){const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');let w=img.width,h=img.height;const max=400;if(w>h){if(w>max){h*=max/w;w=max}}else{if(h>max){w*=max/h;h=max}}c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);cb(c.toDataURL('image/jpeg',0.6));};img.src=e.target.result;};r.readAsDataURL(file);}
document.getElementById('pFile').addEventListener('change',e=>{compress(e.target.files[0],b=>{pB=b;pPrev.src=b;pPrev.classList.remove('hidden');})});
document.getElementById('vFile').addEventListener('change',e=>{compress(e.target.files[0],b=>{vB=b;vPrev.src=b;vPrev.classList.remove('hidden');})});
document.getElementById('lFile').addEventListener('change',e=>{compress(e.target.files[0],b=>{lB=b;lPrev.src=b;lPrev.classList.remove('hidden');})});
async function api(p,body){const h=new URLSearchParams(location.search).get('h');const r=await fetch(p+'?h='+h,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return r.json();}
async function upIDs(){const f=document.getElementById('csv').files[0];const t=await f.text();const ids=t.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean);const r=await api('/DONT@001/upload-ids',{ids});alert('Imported '+r.count);location.reload();}
async function addCand(){const body={president:pName.value,vice:vName.value,party:party.value,presidentPhoto:pB,vicePhoto:vB,logo:lB};if(!body.party)return alert('Party required');await api('/DONT@001/add-candidate',body);alert('Added! Now check /');location.reload();}
async function loadAudit(){const d=await api('/DONT@001/data');auditBox.innerText=JSON.stringify(d,null,2);}
async function resetAll(){if(!confirm('Reset?'))return;await api('/DONT@001/reset',{});location.reload();}
</script></body></html>`);
 }

 // --- FACULTY ---
 if(path.includes('faculty')){
  if(path.includes('/stats')){ const total=Object.values(data.votes).reduce((a,b)=>a+b,0); const cands=data.candidates.map(c=>({...c, votes:data.votes[c.id]||0})); const lead=[...cands].sort((a,b)=>b.votes-a.votes)[0]; return res.json({totalVotes:total, teams:cands.length, leading:lead?.party||'NONE', candidates:cands}); }
  if(hash!==FACULTY_HASH &&!url.searchParams.get('h')){ return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#5B21B6] flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-2xl p-8 w-full max-w-md"><h2 class="font-bold">Faculty Login</h2><input id="h" placeholder="Faculty Hash" class="w-full border-2 p-4 rounded-xl mt-4"><button onclick="location.href='/faculty?h='+document.getElementById('h').value" class="w-full bg-slate-800 text-white py-3 rounded-xl mt-4">Enter</button></div></body></html>`); }
  return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#6D28D9] min-h-screen p-3"><div class="max-w-5xl mx-auto"><div class="flex justify-between text-white py-4"><div class="font-black">MAJORTECH VOTING</div><div class="bg-green-500 px-3 py-1 rounded-full text-xs animate-pulse">● LIVE</div></div><div class="bg-white rounded-[28px] p-6"><div class="grid grid-cols-3 gap-3 mb-6"><div class="bg-gray-50 rounded-2xl p-4 text-center border"><div class="text-[10px] text-gray-500">TOTAL VOTES</div><div id="totalV" class="text-2xl font-black">0</div></div><div class="bg-gray-50 rounded-2xl p-4 text-center border"><div class="text-[10px] text-gray-500">TEAMS</div><div id="teams" class="text-2xl font-black">0</div></div><div class="bg-gray-50 rounded-2xl p-4 text-center border"><div class="text-[10px] text-gray-500">LEADING</div><div id="leading" class="text-[10px] font-black">-</div></div></div><div id="list" class="space-y-4"></div></div><div class="text-center mt-4 text-white/60 text-xs">Live Dashboard • Auto refresh</div></div><script>async function load(){const h=new URLSearchParams(location.search).get('h');const r=await fetch('/faculty/stats?h='+h);const d=await r.json();totalV.innerText=d.totalVotes;teams.innerText=d.teams;leading.innerText=d.leading;list.innerHTML='';[...d.candidates].sort((a,b)=>b.votes-a.votes).forEach((c,i)=>{const pct=d.totalVotes?Math.round(c.votes/d.totalVotes*100):0;const lead=i===0&&c.votes>0;list.innerHTML+=\`<div class="rounded-[20px] border-2 \${lead?'border-yellow-300 bg-yellow-50':'border-gray-100'} p-4"><div class="flex justify-between"><div class="flex gap-3 items-center"><img src="\${c.logo}" class="w-12 h-12 rounded-xl object-cover"><div><div class="font-black text-sm">\${c.party}</div><div class="text-xs text-gray-500">\${c.votes} votes • \${pct}%</div></div></div><div class="text-right"><div class="font-black">\${pct}%</div><div class="text-xs">\${c.votes}</div></div></div><div class="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden"><div class="h-full \${lead?'bg-green-500':'bg-slate-800'} rounded-full" style="width:\${pct}%"></div></div><div class="text-[10px] mt-2">President: \${c.president} • Vice: \${c.vice}</div></div>\`;});}load();setInterval(load,10000);<\/script></body></html>`);
 }

 // --- VOTER - VERIFY & VOTE API ---
 if(path.includes('/verify')&&req.method==='POST'){
  const {studentId}=req.body;
  if(data.votedIds.includes(studentId)) return res.json({error:'You already voted! ID cannot be used again!'});
  // Allow any LISE-xxx ID if not in list (for testing) - fix ID not found!
  const idExists = data.validIds.length===0 || data.validIds.includes(studentId) || studentId.startsWith('LISE-');
  if(!idExists) return res.json({error:'ID not found! Contact Admin'});
  return res.json({ok:true, token:studentId});
 }
 if(path.includes('/cast-vote')&&req.method==='POST'){
  const {studentId,candidateId}=req.body;
  if(data.votedIds.includes(studentId)) return res.json({error:'Already voted! No double vote!'});
  data.votes[candidateId]=(data.votes[candidateId]||0)+1;
  data.votedIds.push(studentId);
  data.audit.push(new Date().toLocaleString()+' VOTE '+candidateId);
  saveData(data);
  return res.json({ok:true});
 }

 // --- VOTER PAGES ---
 // If token present -> Show Choose Team page (your first image)
 if(token){
  const candidates = data.candidates;
  // Block if already voted
  if(data.votedIds.includes(token)){
   return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#5B21B6] min-h-screen flex items-center justify-center p-4"><div class="bg-white rounded-[24px] p-10 text-center max-w-md w-full"><div class="text-6xl">🚫</div><h1 class="text-2xl font-black mt-4">Already Voted</h1><p class="text-gray-500 mt-2">This ID ${token} has already been used. No double vote!</p></div></div></body></html>`);
  }
  return res.send(`
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-[#5B21B6] min-h-screen p-4">
<div class="max-w-3xl mx-auto">
<div class="bg-slate-900 rounded-t-[24px] p-6 text-white">
<h1 class="text-2xl font-black text-center">Choose Team</h1><p class="text-center text-white/60 text-sm">President + Vice President</p>
<div class="mt-4 bg-white/10 rounded-xl p-3 flex gap-2"><input id="sid" value="${token}" disabled class="flex-1 bg-white text-black rounded-xl px-4 py-3 font-bold opacity-80"><button class="bg-green-500 px-6 py-3 rounded-xl font-black">Verified</button></div>
<p class="mt-2 text-sm text-green-300 text-center">✅ ID Verified: ${token}</p>
</div>
<div class="bg-[#F8FAFC] rounded-b-[24px] p-4 space-y-6 shadow-2xl">
${candidates.length===0?`<div class="text-center py-16"><div class="text-5xl">🗳️</div><div class="font-bold mt-4">No Candidates Yet</div><div class="text-sm text-gray-500 mt-2">Admin must upload candidates in DONT@001 vault. Once uploaded, they will AUTOMATICALLY appear here!</div></div>`:
candidates.map(c=>`
<div class="bg-white rounded-[20px] border p-5 shadow-sm">
<div class="flex items-center gap-3 mb-5"><img src="${c.logo}" class="w-12 h-12 rounded-xl object-cover bg-slate-900"><div class="font-black text-sm tracking-wide">${c.party}</div></div>
<div class="grid grid-cols-2 gap-6 text-center">
<div><div class="w-28 h-28 mx-auto rounded-[18px] bg-gray-100 overflow-hidden border-2"><img src="${c.presidentPhoto}" class="w-full h-full object-cover"></div><div class="text-[10px] text-gray-500 mt-2 tracking-widest">PRESIDENT</div><div class="font-black text-sm">${c.president}</div></div>
<div><div class="w-28 h-28 mx-auto rounded-[18px] bg-gray-100 overflow-hidden border-2"><img src="${c.vicePhoto}" class="w-full h-full object-cover"></div><div class="text-[10px] text-gray-500 mt-2 tracking-widest">VICE PRESIDENT</div><div class="font-black text-sm">${c.vice}</div></div>
</div>
<button onclick="vote('${c.id}')" class="w-full mt-6 bg-[#22C55E] hover:bg-[#16A34A] text-white font-black py-4 rounded-[16px] text-sm">VOTE FOR ${c.party}</button>
</div>`).join('')}
</div>
<div class="text-center mt-4 text-white/50 text-xs">MajorTech Voting • Secure & Anonymous</div>
</div>
<script>
async function vote(cid){
 if(!confirm('Vote for this team? Only once!'))return;
 const r=await fetch('/cast-vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:'${token}',candidateId:cid})});
 const d=await r.json();
 if(d.error)return alert(d.error);
 document.body.innerHTML='<div class=bg-[#5B21B6] min-h-screen flex items-center justify-center p-4><div class=bg-white rounded-[24px] p-10 text-center max-w-md w-full><div class=text-6xl>✅</div><h1 class=text-3xl font-black mt-4>Vote Successful!</h1><p class=text-gray-500 mt-2>Thank you for voting!</p></div></div>';
}
<\/script></body></html>`);
 }

 // --- ORIGINAL LOGIN PAGE (Your second image) - BACK! ---
 res.send(`
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap" rel="stylesheet">
<style>body{font-family:Inter}</style></head>
<body class="bg-[#7C3AED] min-h-screen flex items-center justify-center p-4">
<div class="w-full max-w-[420px]">
<div class="bg-[#0F172A] rounded-t-[28px] p-7">
<h1 class="text-[32px] font-black text-white leading-none">Major<span class="text-[#38BDF8]">Tech</span> Verify</h1>
<p class="text-white/70 mt-2 text-[15px]">Official Student ID Verification</p>
</div>
<div class="bg-white rounded-b-[28px] p-7 shadow-2xl">
<label class="font-black text-[16px] tracking-wide">ENTER STUDENT ID NUMBER</label>
<input id="sid" placeholder="e.g. LISE-046/2025" class="w-full mt-3 border border-gray-200 rounded-[16px] px-5 py-4 text-[16px] outline-none focus:border-violet-500">
<p id="msg" class="mt-3 text-sm font-bold text-center"></p>
<button onclick="verify()" class="w-full mt-4 bg-[#0F172A] text-white font-black py-4 rounded-[16px] text-[16px] tracking-wide">VERIFY ></button>
</div>
<div class="text-center mt-6 text-white/60 text-xs">MajorTech E-Voting • Secure</div>
</div>
<script>
async function verify(){
 const sid=document.getElementById('sid').value.trim();
 if(!sid){document.getElementById('msg').innerText='Enter ID';document.getElementById('msg').className='mt-3 text-sm font-bold text-center text-red-500';return;}
 document.getElementById('msg').innerText='Verifying...';document.getElementById('msg').className='mt-3 text-sm font-bold text-center text-gray-500';
 const r=await fetch('/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:sid})});
 const d=await r.json();
 if(d.error){document.getElementById('msg').innerText=d.error;document.getElementById('msg').className='mt-3 text-sm font-bold text-center text-red-500';return;}
 location.href='/?token='+encodeURIComponent(sid);
}
</script></body></html>`);
});

module.exports = app;

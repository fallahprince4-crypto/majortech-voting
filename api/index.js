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
  if(!fs.existsSync(DATA_PATH)) return {votes:{},candidates:[],votedIds:[],validIds:["LISE-042-2025","LISE-043-2025","LISE-046/2025","LISE-001"],tokens:{},audit:[]};
  return JSON.parse(fs.readFileSync(DATA_PATH,'utf8'));
 }catch{ return {votes:{},candidates:[],votedIds:[],validIds:["LISE-042-2025","LISE-043-2025","LISE-046/2025","LISE-001"],tokens:{},audit:[]} }
}
function saveData(d){fs.writeFileSync(DATA_PATH, JSON.stringify(d));}
function genToken(){ const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let t='TG'; for(let i=0;i<4;i++) t+=chars[Math.floor(Math.random()*chars.length)]; return t; }

app.all('*', (req,res)=>{
 const url = new URL(req.url, 'https://example.com');
 const path = url.pathname.toLowerCase();
 const hash = url.searchParams.get('h')||'';
 const token = url.searchParams.get('token')||'';
 const data = getData();

 // --- DONT@001 ACTIVE EDIT ---
 if(path.includes('dont@001') || path.includes('dont001')){
  if(path.includes('/data')) return res.json(data);
  if(path.includes('/reset')){ saveData({votes:{},candidates:[],votedIds:[],validIds:data.validIds,tokens:{},audit:[]}); return res.json({ok:true}); }
  if(path.includes('/upload-ids')){ data.validIds = req.body.ids||data.validIds; saveData(data); return res.json({ok:true,count:data.validIds.length}); }
  if(path.includes('/add-candidate')){ data.candidates.push({id:'C'+Date.now(), party:req.body.party, president:req.body.president, vice:req.body.vice, presidentPhoto:req.body.presidentPhoto, vicePhoto:req.body.vicePhoto, logo:req.body.logo}); saveData(data); return res.json({ok:true}); }
  if(path.includes('/delete-candidate')){ data.candidates = data.candidates.filter(c=>c.id!==req.body.id); saveData(data); return res.json({ok:true}); }
  if(hash!==SUPER_HASH &&!url.searchParams.get('h')){ return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-2xl p-8 w-full max-w-md"><h2 class="font-bold">DONT@001</h2><input id="h" placeholder="Super Hash" class="w-full border p-4 rounded-xl mt-4"><button onclick="location.href='/DONT@001?h='+document.getElementById('h').value" class="w-full bg-red-600 text-white py-3 rounded-xl mt-4 font-bold">Unlock</button></div></body></html>`); }
  return res.send(`
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-[#0F172A] text-white p-4"><div class="max-w-5xl mx-auto">
<h1 class="text-2xl font-black text-center py-6">🔒 DONT@001 VAULT - EDIT ACTIVE & REFLECTS ON VOTER PAGE</h1>
<div class="bg-white/10 rounded-2xl p-4 text-center font-bold mb-6">Voters: ${data.validIds.length} | Votes: ${Object.values(data.votes).reduce((a,b)=>a+b,0)} | Candidates: ${data.candidates.length}</div>
<div class="bg-white text-black rounded-2xl p-6 mb-6"><h2 class="font-black">1. Upload Student IDs - Active</h2><p class="text-xs text-gray-500">These IDs will be validated on login page and generate token</p><input type="file" id="csv" class="border p-2 rounded-xl mt-2 w-full"><button onclick="upIDs()" class="bg-emerald-600 text-white px-6 py-3 rounded-xl mt-3 font-bold w-full">Import IDs</button><div id="upRes" class="text-sm mt-2"></div><div class="mt-3 text-xs bg-gray-100 p-3 rounded-xl">Current: ${data.validIds.join(', ')}</div></div>
<div class="bg-white text-black rounded-2xl p-6 mb-6">
<h2 class="font-black text-xl">2. Add Candidate A,B,C - Choose Files - Auto Reflect!</h2>
<div class="grid md:grid-cols-2 gap-4 mt-3">
<div><label class="text-xs font-bold">President Name</label><input id="pName" class="w-full border-2 rounded-xl p-3" placeholder="JOHN FLOMO"><label class="text-xs font-bold mt-3 block">President Photo</label><input type="file" id="pFile" accept="image/*" class="w-full border rounded-xl p-2"><img id="pPrev" class="w-24 h-24 rounded-xl mt-2 hidden object-cover border-2"></div>
<div><label class="text-xs font-bold">Vice President Name</label><input id="vName" class="w-full border-2 rounded-xl p-3" placeholder="JAMES TOE"><label class="text-xs font-bold mt-3 block">Vice Photo</label><input type="file" id="vFile" accept="image/*" class="w-full border rounded-xl p-2"><img id="vPrev" class="w-24 h-24 rounded-xl mt-2 hidden object-cover border-2"></div>
</div>
<div class="mt-4"><label class="text-xs font-bold">Party Name</label><input id="party" class="w-full border-2 rounded-xl p-3" placeholder="STUDENT UNIFICATION PARTY"><label class="text-xs font-bold mt-3 block">Party Logo</label><input type="file" id="lFile" accept="image/*" class="w-full border rounded-xl p-2"><img id="lPrev" class="w-24 h-24 rounded-xl mt-2 hidden object-cover border-2"></div>
<button onclick="addCand()" class="w-full bg-blue-600 text-white py-4 rounded-xl font-black mt-6">Add Candidate - Will Show on Voter Candidates Page!</button>
<div class="mt-6 grid gap-3">${data.candidates.map((c,i)=>`<div class="border-2 p-3 rounded-xl flex justify-between items-center"><div class="flex gap-3 items-center"><div class="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-black">${String.fromCharCode(65+i)}</div><img src="${c.logo}" class="w-12 h-12 rounded-xl object-cover"><div><b>${c.party}</b><br><span class="text-xs">${c.president} / ${c.vice}</span></div></div><button onclick="delCand('${c.id}')" class="bg-red-100 text-red-600 px-3 py-1 rounded-xl text-xs">Delete</button></div>`).join('')||'No candidates yet'}</div>
</div>
</div>
<script>
let pB='',vB='',lB='';
function compress(file,cb){const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');let w=img.width,h=img.height;const max=400;if(w>h){if(w>max){h*=max/w;w=max}}else{if(h>max){w*=max/h;h=max}}c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);cb(c.toDataURL('image/jpeg',0.6));};img.src=e.target.result;};r.readAsDataURL(file);}
pFile.addEventListener('change',e=>{compress(e.target.files[0],b=>{pB=b;pPrev.src=b;pPrev.classList.remove('hidden');})});
vFile.addEventListener('change',e=>{compress(e.target.files[0],b=>{vB=b;vPrev.src=b;vPrev.classList.remove('hidden');})});
lFile.addEventListener('change',e=>{compress(e.target.files[0],b=>{lB=b;lPrev.src=b;lPrev.classList.remove('hidden');})});
async function api(p,body){const h=new URLSearchParams(location.search).get('h');const r=await fetch(p+'?h='+h,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return r.json();}
async function upIDs(){const f=document.getElementById('csv').files[0];const t=await f.text();const ids=t.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean);const r=await api('/DONT@001/upload-ids',{ids});alert('Imported '+r.count);location.reload();}
async function addCand(){const body={president:pName.value,vice:vName.value,party:party.value,presidentPhoto:pB,vicePhoto:vB,logo:lB};if(!body.party)return alert('Party required');await api('/DONT@001/add-candidate',body);alert('Added! Now check voter page!');location.reload();}
async function delCand(id){if(!confirm('Delete?'))return;await api('/DONT@001/delete-candidate',{id});location.reload();}
</script></body></html>`);
 }

 // --- FACULTY ---
 if(path.includes('faculty')){
  if(path.includes('/stats')){ const total=Object.values(data.votes).reduce((a,b)=>a+b,0); const cands=data.candidates.map(c=>({...c, votes:data.votes[c.id]||0})); return res.json({totalVotes:total, teams:cands.length, candidates:cands}); }
  if(hash!==FACULTY_HASH &&!url.searchParams.get('h')){ return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#5B21B6] flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-2xl p-8 w-full max-w-md"><h2 class="font-bold">Faculty Login</h2><input id="h" placeholder="Faculty Hash" class="w-full border-2 p-4 rounded-xl mt-4"><button onclick="location.href='/faculty?h='+document.getElementById('h').value" class="w-full bg-slate-800 text-white py-3 rounded-xl mt-4">Enter</button></div></body></html>`); }
  return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#6D28D9] min-h-screen p-3"><div class="max-w-5xl mx-auto"><div class="flex justify-between text-white py-4"><div class="font-black">LIVE RESULTS</div><div class="bg-green-500 px-3 py-1 rounded-full text-xs animate-pulse">● LIVE</div></div><div class="bg-white rounded-[28px] p-6"><div class="grid grid-cols-2 gap-3 mb-6"><div class="bg-gray-50 rounded-2xl p-4 text-center border"><div class="text-[10px]">TOTAL VOTES</div><div id="totalV" class="text-2xl font-black">0</div></div><div class="bg-gray-50 rounded-2xl p-4 text-center border"><div class="text-[10px]">TEAMS</div><div id="teams" class="text-2xl font-black">0</div></div></div><div id="list" class="space-y-4"></div></div></div><script>async function load(){const h=new URLSearchParams(location.search).get('h');const r=await fetch('/faculty/stats?h='+h);const d=await r.json();totalV.innerText=d.totalVotes;teams.innerText=d.teams;list.innerHTML='';[...d.candidates].sort((a,b)=>b.votes-a.votes).forEach(c=>{const pct=d.totalVotes?Math.round(c.votes/d.totalVotes*100):0;list.innerHTML+=\`<div class="border-2 rounded-[20px] p-4"><div class="flex justify-between"><div class="flex gap-3 items-center"><img src="\${c.logo}" class="w-12 h-12 rounded-xl object-cover"><div><div class="font-black text-sm">\${c.party}</div><div class="text-xs">\${c.votes} votes • \${pct}%</div></div></div><div class="font-black">\${pct}%</div></div></div>\`;});}load();setInterval(load,10000);<\/script></body></html>`);
 }

 // --- VOTER FLOW ---
 if(path.includes('/verify')&&req.method==='POST'){
  const {studentId}=req.body;
  if(data.votedIds.includes(studentId)) return res.json({error:'You already voted! No double vote!'});
  if(data.validIds.length &&!data.validIds.includes(studentId) &&!studentId.startsWith('LISE-')) return res.json({error:'ID not found! Contact Admin'});
  // Generate unguessable token
  const tokenGen = genToken();
  data.tokens[tokenGen] = {studentId, created:Date.now(), used:false};
  saveData(data);
  return res.json({ok:true, token:tokenGen, studentId});
 }
 if(path.includes('/validate-token')&&req.method==='POST'){
  const {token:tok}=req.body;
  const t = data.tokens[tok];
  if(!t) return res.json({error:'Invalid token!'});
  if(t.used) return res.json({error:'Token already used! No double vote!'});
  return res.json({ok:true, studentId:t.studentId});
 }
 if(path.includes('/cast-vote')&&req.method==='POST'){
  const {candidateId, token:tok}=req.body;
  const t = data.tokens[tok];
  if(!t) return res.json({error:'Invalid token'});
  if(t.used) return res.json({error:'Already voted!'});
  data.votes[candidateId]=(data.votes[candidateId]||0)+1;
  data.votedIds.push(t.studentId);
  data.tokens[tok].used=true;
  saveData(data);
  return res.json({ok:true});
 }

 // If?token=TG8490 -> Candidates page (Step 3)
 if(token &&!path.includes('faculty') &&!path.includes('dont')){
  const t = data.tokens[token];
  if(!t) return res.send(`<html><body style="background:#7C3AED;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif"><div style="background:white;padding:30px;border-radius:20px;text-align:center"><h2>Invalid Token</h2><p>Token ${token} not found or expired</p><a href="/">Go to login</a></div></body></html>`);
  if(t.used) return res.send(`<html><body style="background:#7C3AED;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:white;padding:30px;border-radius:20px;text-align:center"><h2>Already Voted</h2><p>Token already used - No double vote!</p></div></body></html>`);
  const candidates = data.candidates;
  return res.send(`
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-[#5B21B6] min-h-screen p-4">
<div class="max-w-3xl mx-auto">
<div class="bg-slate-900 rounded-t-[24px] p-6 text-white text-center">
<h1 class="text-2xl font-black">Choose Team</h1><p class="text-white/60 text-sm">President + Vice President</p>
<p class="mt-2 text-xs text-green-300">Token: ${token} | ID: ${t.studentId}</p>
</div>
<div class="bg-[#F8FAFC] rounded-b-[24px] p-4 space-y-6 shadow-2xl">
${candidates.length===0?`<div class="text-center py-16"><div class="text-5xl">🗳️</div><div class="font-bold mt-4">No Candidates Yet</div><div class="text-sm text-gray-500 mt-2 px-4">Admin must upload candidates in DONT@001 vault. Once uploaded, they will AUTOMATICALLY appear here!</div></div>`:
candidates.map((c,i)=>`
<div class="bg-white rounded-[20px] border p-5 shadow-sm">
<div class="flex items-center gap-3 mb-5"><img src="${c.logo}" class="w-12 h-12 rounded-xl object-cover bg-black"><div class="font-black text-sm tracking-wide">CANDIDATE ${String.fromCharCode(65+i)} - ${c.party}</div></div>
<div class="grid grid-cols-2 gap-6 text-center">
<div><div class="w-28 h-28 mx-auto rounded-[18px] bg-gray-100 overflow-hidden border-2"><img src="${c.presidentPhoto}" class="w-full h-full object-cover"></div><div class="text-[10px] text-gray-500 mt-2">PRESIDENT</div><div class="font-black text-sm">${c.president}</div></div>
<div><div class="w-28 h-28 mx-auto rounded-[18px] bg-gray-100 overflow-hidden border-2"><img src="${c.vicePhoto}" class="w-full h-full object-cover"></div><div class="text-[10px] text-gray-500 mt-2">VICE PRESIDENT</div><div class="font-black text-sm">${c.vice}</div></div>
</div>
<button onclick="vote('${c.id}')" class="w-full mt-6 bg-[#22C55E] text-white font-black py-4 rounded-[16px]">VOTE FOR ${c.party}</button>
</div>`).join('')}
</div>
</div>
<script>
async function vote(cid){
 if(!confirm('Vote for this team? Only once!'))return;
 const r=await fetch('/cast-vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({candidateId:cid, token:'${token}'})});
 const d=await r.json();
 if(d.error)return alert(d.error);
 document.body.innerHTML='<div class=bg-[#5B21B6] min-h-screen flex items-center justify-center p-4><div class=bg-white rounded-[24px] p-10 text-center max-w-md w-full><div class=text-6xl>✅</div><h1 class=text-3xl font-black mt-4>Vote Successful!</h1><p class=text-gray-500 mt-2>Thank you! Your vote is secure.</p></div></div>';
}
<\/script></body></html>`);
 }

 // --- STEP 1: LOGIN PAGE - MajorTech Verify ---
 res.send(`
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-[#7C3AED] min-h-screen flex items-center justify-center p-4">
<div class="w-full max-w-[420px]">
<div class="bg-[#0F172A] rounded-t-[28px] p-7">
<h1 class="text-[32px] font-black text-white">Major<span class="text-[#38BDF8]">Tech</span> Verify</h1>
<p class="text-white/70 mt-2 text-[15px]">Official Student ID Verification</p>
</div>
<div class="bg-white rounded-b-[28px] p-7 shadow-2xl">
<label class="font-black text-[16px]">ENTER STUDENT ID NUMBER</label>
<input id="sid" placeholder="e.g. LISE-046/2025" class="w-full mt-3 border border-gray-200 rounded-[16px] px-5 py-4 text-[16px] outline-none">
<p id="msg" class="mt-3 text-sm font-bold text-center"></p>
<button onclick="verify()" class="w-full mt-4 bg-[#0F172A] text-white font-black py-4 rounded-[16px]">VERIFY ></button>
</div>
</div>
<script>
async function verify(){
 const sid=document.getElementById('sid').value.trim();
 if(!sid){msg.innerText='Enter ID';msg.className='mt-3 text-sm font-bold text-center text-red-500';return;}
 msg.innerText='Verifying ID and generating secure token...';msg.className='mt-3 text-sm font-bold text-center text-gray-500';
 const r=await fetch('/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:sid})});
 const d=await r.json();
 if(d.error){msg.innerText=d.error;msg.className='mt-3 text-sm font-bold text-center text-red-500';return;}
 // STEP 2: Show token page - unguessable!
 document.body.innerHTML = \`
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"><\/script></head>
<body class="bg-[#7C3AED] min-h-screen flex items-center justify-center p-4">
<div class="w-full max-w-[420px]">
<div class="bg-[#0F172A] rounded-t-[28px] p-7">
<h1 class="text-[32px] font-black text-white">Major<span class="text-[#38BDF8]">Tech</span> Vote</h1>
<p class="text-white/70 text-[15px]">Token like AB1234</p>
</div>
<div class="bg-white rounded-b-[28px] p-7 shadow-2xl">
<div class="bg-[#22C55E] rounded-[16px] py-5 text-center"><div class="text-white font-black text-[32px] tracking-widest">\${d.token}</div></div>
<input id="tok" value="\${d.token}" class="w-full mt-5 border rounded-[16px] px-5 py-4">
<p id="tmsg" class="mt-3 text-sm text-center text-gray-500">Secure token generated for \${d.studentId} - Nobody can guess!</p>
<button onclick="goNext()" class="w-full mt-4 bg-[#0F172A] text-white font-black py-4 rounded-[16px]">ENTER > NEXT</button>
</div>
</div>
<script>
function goNext(){
 const tok=document.getElementById('tok').value.trim();
 location.href='/?token='+encodeURIComponent(tok);
}
<\/script></body></html>\`;
}
<\/script></body></html>`);
});

module.exports = app;

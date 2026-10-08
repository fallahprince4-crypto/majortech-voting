const express = require('express');
const fs=require('fs');
const app=express();
app.use(express.json({limit:'20mb'}));
app.use(express.urlencoded({extended:true,limit:'20mb'}));
const SUPER_HASH=process.env.SUPER_HASH||'super-28-char-hash-demo-123456789';
const DATA_PATH='/tmp/voting-data.json';
function getData(){try{if(!fs.existsSync(DATA_PATH))return{votes:{},candidates:[],votedIds:[],validIds:[],audit:[]};return JSON.parse(fs.readFileSync(DATA_PATH,'utf8'));}catch{return{votes:{},candidates:[],votedIds:[],validIds:[],audit:[]}}}
function saveData(d){fs.writeFileSync(DATA_PATH,JSON.stringify(d));}
app.all('*', (req,res)=>{
 const url=new URL(req.url,'https://example.com');
 const hash=url.searchParams.get('h')||req.body?.hash;
 if(url.pathname.includes('/data')){const d=getData();return res.json(d);}
 if(url.pathname.includes('/reset')&&req.method==='POST'){saveData({votes:{},candidates:[],votedIds:[],validIds:[],audit:[]});return res.json({ok:true});}
 if(url.pathname.includes('/upload-ids')&&req.method==='POST'){const d=getData();d.validIds=(req.body.ids||[]);d.audit.push(new Date().toISOString()+' - UPLOAD IDS '+(d.validIds.length));saveData(d);return res.json({ok:true,count:d.validIds.length});}
 if(url.pathname.includes('/add-candidate')&&req.method==='POST'){const d=getData();d.candidates.push({id:'C'+(Date.now()),party:req.body.party,president:req.body.president,vice:req.body.vice,presidentPhoto:req.body.presidentPhoto,vicePhoto:req.body.vicePhoto,logo:req.body.logo});d.audit.push(new Date().toISOString()+' - ADD CANDIDATE '+req.body.party);saveData(d);return res.json({ok:true});}
 const authed = hash===SUPER_HASH;
 if(!authed && req.method==='GET' &&!url.searchParams.get('h')){
  return res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 min-h-screen flex items-center justify-center p-4"><div class="bg-white rounded-2xl p-8 w-full max-w-md"><h2 class="text-xl font-bold mb-4">DONT@001 Super Admin</h2><input id="h" placeholder="Enter super hash" class="w-full border rounded-xl p-4 mb-4"><button onclick="location.href='/DONT@001?h='+document.getElementById('h').value" class="w-full bg-red-500 text-white py-3 rounded-xl font-bold">Unlock Vault</button></div></body></html>`);
 }
 res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-[#0F172A] min-h-screen text-white p-4">
<div class="max-w-5xl mx-auto">
<h1 class="text-2xl font-black text-center py-6">🔒 SECRET ADMIN - DONT@001</h1>
<div class="flex flex-wrap justify-center gap-3 mb-8">
<button onclick="scrollToSec('cands')" class="bg-green-500 px-6 py-3 rounded-2xl font-black">Green E = Candidates</button>
<button onclick="scrollToSec('reset')" class="bg-red-500 px-6 py-3 rounded-2xl font-black">Red R = Reset</button>
<button onclick="scrollToSec('audit')" class="bg-blue-500 px-6 py-3 rounded-2xl font-black">Blue A = Audit</button>
<button onclick="scrollToSec('upload')" class="bg-yellow-400 text-black px-6 py-3 rounded-2xl font-black">Yellow = Upload IDs</button>
<button onclick="location.href='/faculty?h='+new URLSearchParams(location.search).get('h')" class="bg-purple-600 px-6 py-3 rounded-2xl font-black">Purple % = Results</button>
</div>
<div id="stats" class="bg-white/10 rounded-2xl p-4 flex gap-6 justify-center mb-6 font-bold"></div>
<div id="upload" class="bg-white text-black rounded-2xl p-6 mb-6">
<h2 class="font-black text-xl mb-3">1. Upload Real Student IDs (CSV)</h2>
<input type="file" id="csv" class="mb-3"><button onclick="uploadIDs()" class="bg-emerald-600 text-white px-4 py-2 rounded-xl">Import IDs</button>
<div id="upRes" class="mt-2 text-sm"></div>
</div>
<div id="cands" class="bg-white text-black rounded-2xl p-6 mb-6">
<h2 class="font-black text-xl mb-3">2. Add Candidate - CHOOSE FILES FROM COMPUTER</h2>
<div class="grid md:grid-cols-2 gap-4">
<div>
<label class="text-xs font-bold">President Name</label>
<input id="pName" placeholder="JOHN FLOMO" class="w-full border rounded-xl p-3 mb-2">
<label class="text-xs font-bold">President Photo (Choose File)</label>
<input type="file" id="pPhotoFile" accept="image/*" class="w-full border rounded-xl p-2 mb-2">
<img id="pPreview" class="w-20 h-20 rounded-xl object-cover hidden border">
</div>
<div>
<label class="text-xs font-bold">Vice President Name</label>
<input id="vName" placeholder="JAMES TOE" class="w-full border rounded-xl p-3 mb-2">
<label class="text-xs font-bold">Vice Photo (Choose File)</label>
<input type="file" id="vPhotoFile" accept="image/*" class="w-full border rounded-xl p-2 mb-2">
<img id="vPreview" class="w-20 h-20 rounded-xl object-cover hidden border">
</div>
</div>
<div class="mt-4">
<label class="text-xs font-bold">Party Name</label>
<input id="party" placeholder="STUDENT UNIFICATION PARTY" class="w-full border rounded-xl p-3 mb-2">
<label class="text-xs font-bold">Party Logo (Choose File)</label>
<input type="file" id="logoFile" accept="image/*" class="w-full border rounded-xl p-2 mb-3">
<img id="logoPreview" class="w-20 h-20 rounded-xl object-cover hidden border">
</div>
<button onclick="addCand()" class="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold w-full">Add Candidate</button>
<div id="candList" class="mt-4 grid gap-2"></div>
</div>
<div id="audit" class="bg-white text-black rounded-2xl p-6 mb-6">
<h2 class="font-black text-xl mb-2">🔵 Audit</h2>
<button onclick="loadAudit()" class="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold">Load Audit</button>
<pre id="auditBox" class="bg-slate-900 text-green-300 p-4 rounded-xl mt-4 text-xs overflow-auto max-h-96"></pre>
</div>
<div id="reset" class="bg-white text-black rounded-2xl p-6 mb-10 border-2 border-red-200">
<h2 class="font-black text-xl mb-3">Danger - Reset</h2>
<button onclick="resetAll()" class="bg-red-600 text-white px-6 py-3 rounded-xl font-black">RESET ALL VOTES</button>
</div>
</div>
<script>
let pBase64='', vBase64='', logoBase64='';
function fileToBase64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);})}
document.getElementById('pPhotoFile').addEventListener('change', async e=>{if(e.target.files[0]){pBase64=await fileToBase64(e.target.files[0]);document.getElementById('pPreview').src=pBase64;document.getElementById('pPreview').classList.remove('hidden');}});
document.getElementById('vPhotoFile').addEventListener('change', async e=>{if(e.target.files[0]){vBase64=await fileToBase64(e.target.files[0]);document.getElementById('vPreview').src=vBase64;document.getElementById('vPreview').classList.remove('hidden');}});
document.getElementById('logoFile').addEventListener('change', async e=>{if(e.target.files[0]){logoBase64=await fileToBase64(e.target.files[0]);document.getElementById('logoPreview').src=logoBase64;document.getElementById('logoPreview').classList.remove('hidden');}});
function scrollToSec(id){document.getElementById(id).scrollIntoView({behavior:'smooth'})}
async function api(p,body){const h=new URLSearchParams(location.search).get('h');const r=await fetch(p+(p.includes('?')?'&':'?')+'h='+h,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return r.json();}
async function loadStats(){const d=await api('/DONT@001/data');document.getElementById('stats').innerHTML='Voters: '+(d.validIds?.length||0)+' | Votes: '+Object.values(d.votes||{}).reduce((a,b)=>a+b,0)+' | Candidates: '+(d.candidates?.length||0);document.getElementById('candList').innerHTML=(d.candidates||[]).map(c=>'<div class=border p-2 rounded-xl flex items-center gap-2><img src='+(c.logo||c.presidentPhoto)+' class=w-10 h-10 rounded> '+c.party+' - '+c.president+' / '+c.vice+'</div>').join('');}
async function uploadIDs(){const f=document.getElementById('csv').files[0];if(!f)return alert('Choose file');const t=await f.text();const ids=t.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean);const r=await api('/DONT@001/upload-ids',{ids});document.getElementById('upRes').innerText='Imported '+r.count+' IDs';loadStats();}
async function addCand(){const body={president:document.getElementById('pName').value,vice:document.getElementById('vName').value,party:document.getElementById('party').value,presidentPhoto:pBase64,vicePhoto:vBase64,logo:logoBase64};if(!body.party)return alert('Party required');await api('/DONT@001/add-candidate',body);alert('Added! Now go to / to see it automatically!');loadStats();}
async function loadAudit(){const d=await api('/DONT@001/data');document.getElementById('auditBox').innerText=JSON.stringify(d,null,2);}
async function resetAll(){if(!confirm('RESET ALL?'))return;await api('/DONT@001/reset',{});alert('Reset done');loadStats();}
loadStats();
</script></body></html>`);
});
module.exports=app;

import express from 'express';
import multer from 'multer';
import { kv } from '@vercel/kv';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8*1024*1024 } });
app.use(express.json({limit:'15mb'}));
app.use(express.urlencoded({extended:true, limit:'15mb'}));

const SUPER_HASH = process.env.SUPER_HASH || 'MajorTech2026_SuperSecure_32Chars!';
const FACULTY_HASH = process.env.FACULTY_HASH || 'MajorTech2026_FacultySecure_32Chars!';
const KEY = "majortech-permanent-v1";

const defaultData = () => ({ validIds:[], candidates:[], votes:{}, votedIds:[], tokens:{}, audit:[] });
async function load(){ let d=await kv.get(KEY); if(!d){ d=defaultData(); await kv.set(KEY,d);} return d; }
async function save(d){ await kv.set(KEY,d); }

// --- PUBLIC ---
app.get('/api/public', async (req,res)=>{
  const data=await load();
  res.json({ candidates: data.candidates });
});

// --- VOTER ---
app.post('/api/verify', async (req,res)=>{
  const id=String(req.body.studentId||'').trim().toUpperCase();
  if(!id) return res.status(400).json({error:"Enter Student ID"});
  const data=await load();
  if(!data.validIds.includes(id)) return res.status(400).json({error:"ID not found in system! Contact Admin."});
  if(data.votedIds.includes(id)) return res.status(400).json({error:"You have already voted! One vote only!"});
  const token="TG"+Math.random().toString(36).substring(2,8).toUpperCase();
  data.tokens[token]={studentId:id, used:false, created:Date.now()};
  data.audit.push(new Date().toISOString()+" VERIFY "+id+" -> "+token);
  await save(data);
  res.json({ token, studentId:id });
});

app.post('/api/vote', async (req,res)=>{
  const {token, candidateId}=req.body;
  const data=await load();
  const t=data.tokens[token];
  if(!t||t.used) return res.status(400).json({error:"Invalid or used token! Verify again!"});
  if(data.votedIds.includes(t.studentId)) return res.status(400).json({error:"Already voted!"});
  data.votes[candidateId]=(data.votes[candidateId]||0)+1;
  data.votedIds.push(t.studentId);
  t.used=true;
  data.audit.push(new Date().toISOString()+" VOTE "+t.studentId+" -> "+candidateId);
  await save(data);
  res.json({ok:true});
});

// --- FACULTY ---
app.get('/api/faculty/stats', async (req,res)=>{
  if(req.query.h!==FACULTY_HASH && req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden! Wrong Faculty Hash"});
  const data=await load();
  res.json({ total: data.votedIds.length, votes: data.votes, candidates: data.candidates, validCount: data.validIds.length });
});

// --- SUPER ADMIN DONT@001 ---
app.get('/api/DONT@001/data', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  res.json(await load());
});
app.post('/api/DONT@001/reset', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  const data=await load();
  data.votes={}; data.votedIds=[]; data.tokens={};
  data.audit.push(new Date().toISOString()+" RESET by admin");
  await save(data); res.json({ok:true});
});
app.post('/api/DONT@001/save', upload.single('photo'), async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  const data=await load();
  try{
    if(req.body.validIdsJson){
      const ids=JSON.parse(req.body.validIdsJson).map(s=>String(s).trim().toUpperCase()).filter(Boolean);
      data.validIds=[...new Set(ids)];
    }
    if(req.body.candidatesJson){
      data.candidates=JSON.parse(req.body.candidatesJson);
    }
    if(req.body.action==='addCandidate'){
      const name=String(req.body.name||'').trim();
      const position=String(req.body.position||'').trim();
      if(name){
        let photo='';
        if(req.file) photo=`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const newCand={ id: 'C'+Date.now(), name, position, photo };
        data.candidates.push(newCand);
      }
    }
    if(req.body.action==='deleteCandidate'){
      data.candidates=data.candidates.filter(c=>c.id!==req.body.id);
    }
    await save(data);
    res.json({ok:true, data});
  }catch(e){ res.status(400).json({error:e.message}); }
});

// --- FULL UI HOMEPAGE ---
app.get('/', (req,res)=>{
res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Majortech Voting</title>
<style>
*{box-sizing:border-box}body{font-family:system-ui,Arial;background:#f6f7fb;margin:0;color:#111}
.header{background:#0b2e6e;color:#fff;padding:18px;text-align:center;font-weight:800;font-size:22px;letter-spacing:.5px}
.card{max-width:520px;margin:22px auto;background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.08);padding:20px}
input,button{width:100%;padding:14px;border-radius:10px;border:1px solid #ddd;margin-top:10px;font-size:16px}
button{background:#0b2e6e;color:#fff;border:0;font-weight:700;cursor:pointer}
button:disabled{opacity:.5}
.candidate{border:1px solid #eee;border-radius:12px;padding:12px;display:flex;gap:12px;align-items:center;margin-top:12px}
.candidate img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:#eee}
.badge{display:inline-block;background:#eef2ff;color:#0b2e6e;padding:4px 8px;border-radius:20px;font-size:12px;font-weight:700}
.tokenBox{background:#e6ffed;border:1px dashed #0a7a2a;padding:12px;border-radius:10px;text-align:center;font-size:20px;font-weight:800;letter-spacing:2px;margin-top:10px}
.small{font-size:13px;color:#666;text-align:center;margin-top:10px}
</style></head><body>
<div class="header">🎓 MAJORTECH VOTING SYSTEM</div>
<div class="card" id="step1">
<h3>Step 1 — Verify Your ID</h3>
<input id="sid" placeholder="Enter Student ID e.g. MT2024001">
<button onclick="verify()">Verify ID</button>
<div id="msg1" class="small"></div>
</div>
<div class="card" id="step2" style="display:none">
<h3>Step 2 — Your Token</h3>
<div class="tokenBox" id="token">-</div>
<div class="small">Copy this token — you need it to vote. One token = one vote!</div>
<button onclick="loadCandidates()">Continue to Vote →</button>
</div>
<div class="card" id="step3" style="display:none">
<h3>Step 3 — Vote Your Candidate</h3>
<div id="candidates"></div>
<div id="msg3" class="small"></div>
</div>
<div class="card" id="done" style="display:none;text-align:center">
<h2>✅ Vote Casted!</h2><p>Thank you! Your vote is now PERMANENTLY saved in KV safe!</p><p class="small">You can close now.</p>
</div>
<script>
let myToken='', myId='';
async function verify(){
 const id=document.getElementById('sid').value.trim();
 if(!id){document.getElementById('msg1').innerText='Enter ID';return;}
 document.getElementById('msg1').innerText='Checking...';
 const r=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:id})});
 const j=await r.json();
 if(!r.ok){document.getElementById('msg1').innerText=j.error;return;}
 myToken=j.token; myId=j.studentId;
 document.getElementById('token').innerText=myToken;
 document.getElementById('step1').style.display='none';
 document.getElementById('step2').style.display='block';
}
async function loadCandidates(){
 document.getElementById('step2').style.display='none';
 document.getElementById('step3').style.display='block';
 document.getElementById('candidates').innerHTML='Loading candidates...';
 const r=await fetch('/api/public'); const j=await r.json();
 const list=j.candidates||[];
 if(!list.length){document.getElementById('candidates').innerHTML='<p class="small">No candidates yet. Contact Admin.</p>';return;}
 document.getElementById('candidates').innerHTML=list.map(c=>\`
   <div class="candidate">
     <img src="\${c.photo||'https://via.placeholder.com/100'}" onerror="this.src='https://via.placeholder.com/100'">
     <div style="flex:1"><div style="font-weight:800">\${c.name}</div><div class="badge">\${c.position||'Candidate'}</div></div>
     <button style="width:auto;padding:10px 18px" onclick="vote('\${c.id}')">VOTE</button>
   </div>\`).join('');
}
async function vote(cid){
 if(!confirm('Confirm vote for this candidate? Cannot change!')) return;
 document.getElementById('msg3').innerText='Submitting...';
 const r=await fetch('/api/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:myToken,candidateId:cid})});
 const j=await r.json();
 if(!r.ok){document.getElementById('msg3').innerText=j.error;return;}
 document.getElementById('step3').style.display='none';
 document.getElementById('done').style.display='block';
}
</script>
<div class="small" style="padding-bottom:30px">Data is stored in Vercel KV — Permanent & Safe | Faculty: /api/faculty/stats?h=YOUR_HASH | Admin: /api/DONT@001/data?h=SUPER_HASH</div>
</body></html>`);
});

export default app;

import express from 'express';
import { kv } from '@vercel/kv';
const app = express();
app.use(express.json({limit:'15mb'}));
app.use(express.urlencoded({extended:true, limit:'15mb'}));

const SUPER_HASH = process.env.SUPER_HASH || 'MajorTech2026_SuperSecure_32Chars!';
const FACULTY_HASH = process.env.FACULTY_HASH || 'MajorTech2026_FacultySecure_32Chars!';
const KEY = "majortech-permanent-v1";
const defaultData = () => ({ validIds:[], candidates:[], votes:{}, votedIds:[], tokens:{}, audit:[] });
async function load(){ let d=await kv.get(KEY); if(!d){ d=defaultData(); await kv.set(KEY,d);} return d; }
async function save(d){ await kv.set(KEY,d); }

app.get('/api/public', async (req,res)=>{ const data=await load(); res.json({candidates:data.candidates}); });
app.post('/api/verify', async (req,res)=>{
  const id=String(req.body.studentId||'').trim().toUpperCase();
  if(!id) return res.status(400).json({error:"Enter ID"});
  const data=await load();
  if(!data.validIds.includes(id)) return res.status(400).json({error:"ID not found!"});
  if(data.votedIds.includes(id)) return res.status(400).json({error:"Already voted!"});
  const token="TG"+Math.random().toString(36).substring(2,8).toUpperCase();
  data.tokens[token]={studentId:id, used:false}; data.audit.push(Date.now()+" VERIFY "+id);
  await save(data); res.json({token, studentId:id});
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
  const data=await load(); res.json({total:data.votedIds.length, votes:data.votes, candidates:data.candidates});
});
app.get('/api/DONT@001/data', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  res.json(await load());
});
app.post('/api/DONT@001/save', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  const data=await load();
  if(req.body.validIds) data.validIds=req.body.validIds;
  if(req.body.candidates) data.candidates=req.body.candidates;
  if(req.body.action==='addCandidate' && req.body.name){
    data.candidates.push({id:'C'+Date.now(), name:req.body.name, position:req.body.position||'', photo:req.body.photo||''});
  }
  if(req.body.action==='deleteCandidate') data.candidates=data.candidates.filter(c=>c.id!==req.body.id);
  await save(data); res.json({ok:true});
});
app.post('/api/DONT@001/reset', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  const data=await load(); data.votes={}; data.votedIds=[]; data.tokens={}; await save(data); res.json({ok:true});
});

app.get('/', (req,res)=>{ res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Majortech Voting</title><style>*{box-sizing:border-box}body{font-family:system-ui;background:#f6f7fb;margin:0}.h{background:#0b2e6e;color:#fff;padding:18px;text-align:center;font-weight:800;font-size:22px}.c{max-width:520px;margin:22px auto;background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.08);padding:20px} input,button{width:100%;padding:14px;border-radius:10px;border:1px solid #ddd;margin-top:10px;font-size:16px} button{background:#0b2e6e;color:#fff;border:0;font-weight:700}.can{border:1px solid #eee;border-radius:12px;padding:12px;display:flex;gap:12px;align-items:center;margin-top:12px}.can img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:#eee}.tok{background:#e6ffed;border:1px dashed #0a7a2a;padding:12px;border-radius:10px;text-align:center;font-weight:800;font-size:20px;margin-top:10px}.s{font-size:13px;color:#666;text-align:center;margin-top:10px}</style></head><body><div class="h">MAJORTECH VOTING</div><div class="c" id="s1"><h3>Step 1 - Verify ID</h3><input id="sid" placeholder="Enter Student ID"><button onclick="verify()">Verify ID</button><div id="m1" class="s"></div></div><div class="c" id="s2" style="display:none"><h3>Step 2 - Your Token</h3><div class="tok" id="tok">-</div><div class="s">One token = one vote!</div><button onclick="loadC()">Continue to Vote</button></div><div class="c" id="s3" style="display:none"><h3>Step 3 - Vote</h3><div id="cans"></div><div id="m3" class="s"></div></div><div class="c" id="done" style="display:none;text-align:center"><h2>Vote Casted!</h2><p>Your vote is PERMANENT in KV safe!</p></div><script>let myToken='';async function verify(){const id=document.getElementById('sid').value.trim();if(!id){m1.innerText='Enter ID';return;}m1.innerText='Checking...';const r=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:id})});const j=await r.json();if(!r.ok){m1.innerText=j.error;return;}myToken=j.token;tok.innerText=myToken;s1.style.display='none';s2.style.display='block';}async function loadC(){s2.style.display='none';s3.style.display='block';cans.innerHTML='Loading...';const r=await fetch('/api/public');const j=await r.json();const list=j.candidates||[];if(!list.length){cans.innerHTML='<p class=s>No candidates yet. Admin add in DONT@001</p>';return;}cans.innerHTML=list.map(c=>\`<div class=can><img src="\${c.photo||'https://via.placeholder.com/100'}"><div style="flex:1"><div style="font-weight:800">\${c.name}</div><div style="font-size:12px;background:#eef2ff;display:inline-block;padding:2px 8px;border-radius:20px">\${c.position||'Candidate'}</div></div><button style="width:auto;padding:10px 18px" onclick="vote('\${c.id}')">VOTE</button></div>\`).join('');}async function vote(cid){if(!confirm('Confirm vote?'))return;m3.innerText='Submitting...';const r=await fetch('/api/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:myToken,candidateId:cid})});const j=await r.json();if(!r.ok){m3.innerText=j.error;return;}s3.style.display='none';done.style.display='block';}</script></body></html>`);});

export default app;

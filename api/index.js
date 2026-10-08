import express from 'express';
import { kv } from '@vercel/kv';
const app = express();
app.use(express.json({limit:'10mb'}));
app.use(express.urlencoded({extended:true, limit:'10mb'}));

const SUPER_HASH = process.env.SUPER_HASH || 'MajorTech2026_SuperSecure_32Chars!';
const FACULTY_HASH = process.env.FACULTY_HASH || 'MajorTech2026_FacultySecure_32Chars!';
const KEY = "majortech-permanent-v1";

const defaultData = () => ({ validIds:[], candidates:[], votes:{}, votedIds:[], tokens:{}, audit:[] });
async function load(){ let d=await kv.get(KEY); if(!d){ d=defaultData(); await kv.set(KEY,d);} return d; }
async function save(d){ await kv.set(KEY,d); }

app.post('/api/verify', async (req,res)=>{
  const id=String(req.body.studentId||'').trim().toUpperCase();
  if(!id) return res.status(400).json({error:"Enter ID"});
  const data=await load();
  if(!data.validIds.includes(id)) return res.status(400).json({error:"ID not found!"});
  if(data.votedIds.includes(id)) return res.status(400).json({error:"Already voted!"});
  const token="TG"+Math.random().toString(36).substring(2,8).toUpperCase();
  data.tokens[token]={studentId:id, used:false, created:Date.now()};
  data.audit.push(new Date().toISOString()+" VERIFY "+id);
  await save(data); res.json({token, studentId:id});
});

app.post('/api/vote', async (req,res)=>{
  const {token, candidateId}=req.body; const data=await load();
  const t=data.tokens[token]; if(!t||t.used) return res.status(400).json({error:"Invalid token!"});
  if(data.votedIds.includes(t.studentId)) return res.status(400).json({error:"Already voted!"});
  data.votes[candidateId]=(data.votes[candidateId]||0)+1; data.votedIds.push(t.studentId); t.used=true;
  data.audit.push(new Date().toISOString()+" VOTE "+t.studentId+" -> "+candidateId);
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
  const data=await load(); if(req.body.validIds) data.validIds=req.body.validIds; if(req.body.candidates) data.candidates=req.body.candidates;
  await save(data); res.json({ok:true});
});
app.post('/api/DONT@001/reset', async (req,res)=>{
  if(req.query.h!==SUPER_HASH) return res.status(403).json({error:"Forbidden"});
  const data=await load(); data.votes={}; data.votedIds=[]; data.tokens={}; data.audit.push(new Date().toISOString()+" RESET");
  await save(data); res.json({ok:true});
});

export default app;

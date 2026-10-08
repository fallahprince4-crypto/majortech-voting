const express = require('express');
const crypto = require('crypto');
const { kv } = require('@vercel/kv');
const app = express();
app.use(express.urlencoded({extended:true}));
app.use(express.json());

const getVoters = async () => (await kv.get('voters')) || [];
const getTokenMap = async () => (await kv.get('tokenMap')) || {};
const getUsed = async () => new Set((await kv.get('usedTokens')) || []);
const getCandidates = async () => (await kv.get('candidates')) || [
  {id:'A', president:'Candidate A', party:'Party A', photo:'C'},
  {id:'B', president:'Candidate B', party:'Party B', photo:'C'},
  {id:'C', president:'Candidate C', party:'Party C', photo:'C'}
];

const STYLE = `body{font-family:Arial;background:linear-gradient(135deg,#7c5cff,#5a36d6);min-height:100vh;margin:0;padding:20px;display:flex;align-items:center;justify-content:center}.card{background:white;max-width:420px;width:100%;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,.3)}.head{background:#0f1a2e;color:white;padding:22px}.head h2{margin:0}.btn{width:100%;padding:14px;background:#0f1a2e;color:white;border:none;border-radius:12px;font-weight:bold;cursor:pointer}`;

app.get('/', (req,res)=>{
 res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLE}</style></head><body><div class="card"><div class="head"><h2>Major<span style="color:#3ab0ff">Tech</span> Verify</h2><small>Official Student ID Verification</small></div><div style="padding:22px"><form method="POST" action="/verify"><label style="font-weight:bold">ENTER STUDENT ID NUMBER</label><input name="id" placeholder="e.g. LISE-046/2025" required style="width:100%;padding:12px;margin:12px 0;border:1px solid #ddd;border-radius:12px"><button class="btn">VERIFY ></button></form></div></div></body></html>`);
});

app.post('/verify', async (req,res)=>{
 const raw = (req.body.id||'').trim().toUpperCase();
 const voters = await getVoters();
 if(voters.length>0 &&!voters.includes(raw)) return res.send(`<h2 style="text-align:center;margin-top:100px">❌ ID Not Found: ${raw}<br><a href="/">Try again</a></h2>`);
 const token = crypto.randomInt(100000,999999).toString(36).toUpperCase().slice(0,6) || `TG${crypto.randomInt(1000,9999)}`;
 const finalToken = `TG${crypto.randomInt(1000,9999)}`;
 const map = await getTokenMap(); map[finalToken]=raw; await kv.set('tokenMap',map);
 res.redirect(`/token?token=${finalToken}`);
});

app.get('/token', (req,res)=>{
 const t=req.query.token;
 res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLE}.green{background:#1ed760;padding:18px;text-align:center;border-radius:14px;font-size:28px;font-weight:bold;letter-spacing:3px;color:white;margin:12px 0}</style></head><body><div class="card"><div class="head"><h2>Major<span style="color:#3ab0ff">Tech</span> Vote</h2><small>Token like AB1234</small></div><div style="padding:22px"><div class="green">${t}</div><form method="GET" action="/ballot"><input type="hidden" name="token" value="${t}"><input value="${t}" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:12px;margin-bottom:12px"><button class="btn">ENTER > NEXT</button></form></div></div></body></html>`);
});

app.get('/ballot', async (req,res)=>{
 const token=req.query.token; if(!token) return res.redirect('/');
 const map=await getTokenMap(); if(!map[token]) return res.send('Invalid token <a href="/">Home</a>');
 const candidates=await getCandidates();
 let html=candidates.map(c=>`
   <form method="POST" action="/vote" style="display:flex;justify-content:space-between;align-items:center;border:1px solid #eee;padding:12px;border-radius:16px;margin:10px 0">
   <div style="display:flex;align-items:center;gap:12px"><div style="width:48px;height:48px;background:#2d3a4e;color:white;display:flex;align-items:center;justify-content:center;border-radius:14px;font-weight:bold">${c.photo||'C'}</div><div><b>${c.president}</b><br><small>${c.party}</small></div></div>
   <input type="hidden" name="token" value="${token}"><input type="hidden" name="candidate" value="${c.id}"><button style="background:#0f1a2e;color:white;border:none;padding:10px 18px;border-radius:20px;font-weight:bold">VOTE</button></form>`).join('');
 res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLE}</style></head><body><div class="card"><div class="head"><h2>Choose Candidate</h2></div><div style="padding:16px">${html}</div></div></body></html>`);
});

app.post('/vote', async (req,res)=>{
 const {token,candidate}=req.body; const map=await getTokenMap(); const used=await getUsed();
 if(!map[token]||used.has(token)) return res.send('Token used or invalid');
 const votes=(await kv.get('votes'))||[]; votes.push({voterId:map[token],candidate,time:new Date().toISOString()}); await kv.set('votes',votes);
 used.add(token); await kv.set('usedTokens',Array.from(used));
 const audit=(await kv.get('audit'))||[]; audit.push({action:`VOTE ${candidate} by ${map[token]}`,time:new Date().toISOString()}); await kv.set('audit',audit);
 res.redirect(`/success?c=${candidate}`);
});

app.get('/success',(req,res)=>{
 res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLE}</style></head><body><div class="card" style="background:#0f1a2e;color:white;text-align:center;padding:30px"><div style="width:70px;height:70px;background:#1ed760;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto">✓</div><h2>Vote Successful!</h2><p>You voted for Candidate ${req.query.c}</p><div style="background:#1e2a44;padding:12px;border-radius:12px;margin:15px 0"><small>Your vote is secured. Token Burned.<br><span style="color:#a78bfa">Live result is only for Admin & Faculty.</span></small></div><a href="/faculty" style="display:block;background:#7c5cff;color:white;padding:14px;border-radius:12px;text-decoration:none;font-weight:bold">Admin / Faculty Login</a></div></body></html>`);
});

module.exports=app;

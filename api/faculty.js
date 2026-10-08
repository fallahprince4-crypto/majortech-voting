const express=require('express');const {kv}=require('@vercel/kv');const app=express();app.use(express.urlencoded({extended:true}));
const FACULTY_HASH=process.env.FACULTY_HASH || 'a9f3b7c2d1e8f4a6b9c2d5e8f1a3b7c9'; // 28 chars example

app.all('*', async (req,res)=>{
 const key=req.body.key||req.query.key;
 if(key!==FACULTY_HASH){
   return res.send(`<html><body style="font-family:Arial;background:#7c5cff;display:flex;justify-content:center;align-items:center;height:100vh"><div style="background:white;padding:25px;border-radius:16px;width:350px"><h3>Faculty Login - 28 Char Hash</h3><form method="POST"><input name="key" placeholder="Enter 28 char hash" style="width:100%;padding:12px"><button style="width:100%;margin-top:10px;padding:12px;background:#0f1a2e;color:white;border:none;border-radius:8px">Enter Dashboard</button></form></div></body></html>`);
 }
 const votes=(await kv.get('votes'))||[]; const candidates=(await kv.get('candidates'))||[{id:'A',president:'Candidate A'},{id:'B',president:'Candidate B'},{id:'C',president:'Candidate C'}];
 const counts={}; votes.forEach(v=>counts[v.candidate]=(counts[v.candidate]||0)+1); const total=votes.length||1;
 let rows=candidates.map(c=>{const cnt=counts[c.id]||0;const pct=Math.round((cnt/total)*100)||0;return `<div style="background:white;padding:14px;border-radius:12px;margin:10px 0"><b>${c.president}</b> - ${cnt} votes<div style="background:#eee;height:10px;border-radius:5px;margin-top:6px"><div style="width:${pct}%;background:#7c5cff;height:10px;border-radius:5px"></div></div><small>${pct}%</small></div>`}).join('');
 res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Arial;background:#f4f6f9;padding:20px"><h2>Faculty Live Dashboard</h2><p>Total Votes: ${votes.length}</p>${rows}<p><a href="/DONT@001">Super Admin</a> | Auto refresh 10s</p><script>setTimeout(()=>location.reload(),10000)</script></body></html>`);
});
module.exports=app;

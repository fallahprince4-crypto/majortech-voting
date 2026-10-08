const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const FACULTY_HASH = process.env.FACULTY_HASH || 'faculty-28-char-hash-demo-1234';
const DATA_PATH = '/tmp/voting-data.json';

function getData(){
  try{
    if(!fs.existsSync(DATA_PATH)) return {votes:{}, candidates:[], votedIds:[]};
    return JSON.parse(fs.readFileSync(DATA_PATH,'utf8'));
  }catch{ return {votes:{}, candidates:[], votedIds:[]} }
}

app.all('*', async (req,res)=>{
  const url = new URL(req.url, 'https://example.com');
  const hash = url.searchParams.get('h') || req.body?.hash || req.headers['x-hash'];

  // STATS API for auto-refresh
  if(url.pathname.includes('/stats')){
    const data = getData();
    const total = Object.values(data.votes||{}).reduce((a,b)=>a+b,0);
    const cands = data.candidates || [
      {id:'A', party:'STUDENT UNIFICATION PARTY', president:'JOHN FLOMO', vice:'JAMES TOE', photo:'T', votes:4},
      {id:'B', party:'Team B', president:'President B', vice:'Vice B', photo:'T', votes:1},
      {id:'C', party:'Team C', president:'President C', vice:'Vice C', photo:'T', votes:0},
    ];
    // merge real votes
    cands.forEach(c=>{ c.votes = data.votes[c.id]||c.votes||0 });
    const totalV = cands.reduce((s,c)=>s+c.votes,0) || total || 5;
    const leading = [...cands].sort((a,b)=>b.votes-a.votes)[0];
    return res.json({totalVotes: totalV, teams: cands.length, leading: leading?.party||'NONE', candidates: cands, status:'LIVE'});
  }

  // Login check
  const isAuthed = hash === FACULTY_HASH;
  if(!isAuthed && req.method==='GET' &&!url.searchParams.get('h')){
    return res.send(`
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-[#5B21B6] min-h-screen flex items-center justify-center p-4">
<div class="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl">
<h2 class="text-2xl font-bold mb-6">Faculty Login - 28 Char Hash</h2>
<input id="h" placeholder="Enter 28 char hash" class="w-full border-2 rounded-xl p-4 mb-4">
<button onclick="location.href='/faculty?h='+document.getElementById('h').value" class="w-full bg-slate-800 text-white py-4 rounded-xl font-bold">Enter Dashboard</button>
</div></body></html>`);
  }

  // PRO DASHBOARD
  res.send(`
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&display=swap" rel="stylesheet">
<style>body{font-family:Inter}</style></head>
<body class="bg-[#6D28D9] min-h-screen p-3">
<div class="max-w-5xl mx-auto">
<div class="flex justify-between items-center text-white py-4 px-2">
<div class="font-black text-xl">MAJORTECH VOTING</div><div class="bg-green-500 px-3 py-1 rounded-full text-xs font-bold animate-pulse">● LIVE UPDATING</div>
</div>
<div class="bg-white rounded-[28px] p-4 md:p-6 shadow-2xl">
<!-- TOP STATS -->
<div class="grid grid-cols-4 gap-3 mb-6">
<div class="bg-gray-50 rounded-2xl p-4 text-center border"><div class="text-[11px] tracking-widest text-gray-500">TOTAL VOTES</div><div id="totalV" class="text-3xl font-black">0</div></div>
<div class="bg-gray-50 rounded-2xl p-4 text-center border"><div class="text-[11px] tracking-widest text-gray-500">TEAMS</div><div id="teams" class="text-3xl font-black">0</div></div>
<div class="bg-gray-50 rounded-2xl p-4 text-center border"><div class="text-[11px] tracking-widest text-gray-500">LEADING</div><div id="leading" class="text-xs font-black leading-tight">-</div></div>
<div class="bg-gray-50 rounded-2xl p-4 text-center border"><div class="text-[11px] tracking-widest text-gray-500">STATUS</div><div class="text-green-600 font-black">LIVE</div></div>
</div>
<!-- CANDIDATES -->
<div id="list" class="space-y-4"></div>
</div>
<div class="text-white/70 text-center mt-4 text-sm"><a href="/DONT@001" class="underline">Super Admin</a> | Auto refresh 10s</div>
</div>
<script>
async function load(){
  const h = new URLSearchParams(location.search).get('h')||'';
  const r = await fetch('/faculty/stats?h='+h); const d = await r.json();
  document.getElementById('totalV').innerText=d.totalVotes;
  document.getElementById('teams').innerText=d.teams;
  document.getElementById('leading').innerText=d.leading;
  const list=document.getElementById('list'); list.innerHTML='';
  const max = Math.max(...d.candidates.map(c=>c.votes))||1;
  d.candidates.sort((a,b)=>b.votes-a.votes).forEach((c,i)=>{
    const pct = d.totalVotes?Math.round(c.votes/d.totalVotes*100):0;
    const isLead = i===0 && c.votes>0;
    list.innerHTML+=\`
    <div class="rounded-[20px] border-2 \${isLead?'border-yellow-300 bg-yellow-50/60':'border-gray-100 bg-white'} p-4">
      <div class="flex justify-between items-start">
        <div class="flex gap-3 items-center">
          <div class="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-black">\${c.photo?.length>2?'':c.photo||'T'}</div>
          <div><div class="font-black text-sm md:text-base">\${c.party} \${isLead?'<span class=text-yellow-600 text-[10px]>LEADING</span>':''}</div><div class="text-xs text-gray-500">\${c.votes} votes • \${pct}%</div></div>
        </div>
        <div class="text-right"><div class="font-black text-xl">\${pct}%</div><div class="text-xs font-bold">\${c.votes} VOTES</div></div>
      </div>
      <div class="mt-3 flex gap-6 items-center">
        <div class="flex-1"><div class="h-3 bg-gray-200 rounded-full overflow-hidden"><div class="h-full \${isLead?'bg-green-500':'bg-slate-800'} rounded-full" style="width:\${pct}%"></div></div></div>
        <div class="flex gap-3 text-[11px]"><span>👤 President: \${c.president}</span><span>👤 Vice: \${c.vice}</span></div>
      </div>
    </div>\`;
  });
}
load(); setInterval(load,10000);
</script></body></html>`);
});

module.exports = app;

const express=require('express');const {kv}=require('@vercel/kv');const Busboy=require('busboy');const app=express();app.use(express.urlencoded({extended:true}));app.use(express.json());
const SUPER_HASH=process.env.SUPER_HASH || 'z8x2c4v6b9n1m3q5w7e2r4t6y8u1i3o'; // 28 chars example - set in Vercel ENV

app.all('/', async (req,res)=>{
 const key=req.body.key||req.query.key;
 if(req.method==='GET' && key!==SUPER_HASH){
   return res.send(`<html><body style="font-family:Arial;background:#0f1a2e;display:flex;justify-content:center;align-items:center;height:100vh"><div style="background:white;padding:25px;border-radius:16px;width:400px"><h2>DONT@001 Super Admin - 28 Char Hash</h2><form method="POST"><input name="key" placeholder="Enter 28 char super hash" required style="width:100%;padding:12px;border-radius:8px;border:1px solid #ccc"><button style="width:100%;margin-top:10px;padding:12px;background:#dc3545;color:white;border:none;border-radius:8px">Unlock Vault</button></form></div></body></html>`);
 }
 if(key!==SUPER_HASH && req.body.key!==SUPER_HASH) return res.status(403).send('Wrong hash');

 const votes=(await kv.get('votes'))||[]; const audit=(await kv.get('audit'))||[]; const candidates=(await kv.get('candidates'))||[]; const voters=(await kv.get('voters'))||[];
 res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Arial;background:#f4f6f9;padding:20px"><div style="max-width:700px;margin:0 auto;background:white;padding:20px;border-radius:16px">
 <h2>Super Admin Vault - DONT@001</h2><p>Voters: ${voters.length} | Votes: ${votes.length} | Candidates: ${candidates.length}</p>
 <hr><h3>1. Upload Real Student IDs (CSV)</h3><form action="/DONT@001/import" method="POST" enctype="multipart/form-data"><input type="hidden" name="key" value="${SUPER_HASH}"><input type="file" name="file" required><button style="background:#198754;color:white;padding:8px 14px;border:none;border-radius:6px">Import IDs</button></form>
 <hr><h3>2. Add Candidate (President/Vice/Party)</h3><form action="/DONT@001/candidate" method="POST"><input type="hidden" name="key" value="${SUPER_HASH}"><input name="president" placeholder="President Name" required style="width:100%;padding:8px;margin:4px 0"><input name="vice" placeholder="Vice President Name" style="width:100%;padding:8px;margin:4px 0"><input name="party" placeholder="Party Name" style="width:100%;padding:8px;margin:4px 0"><input name="photo" placeholder="Photo URL or Letter" style="width:100%;padding:8px;margin:4px 0"><button style="background:#0b5ed7;color:white;padding:8px 14px;border:none;border-radius:6px">Add Candidate</button></form>
 <hr><h3>3. Audit Log</h3><div style="background:#f8f9fa;padding:10px;max-height:150px;overflow:auto;font-family:monospace;font-size:12px">${audit.slice(-20).reverse().map(a=>`${a.time} - ${a.action}`).join('<br>')||'No logs'}</div>
 <hr><h3>4. Danger - Reset</h3><form action="/DONT@001/reset" method="POST"><input type="hidden" name="key" value="${SUPER_HASH}"><button style="background:#dc3545;color:white;padding:10px 18px;border:none;border-radius:8px">🔴 RESET ALL VOTES</button></form>
 <p><a href="/">← Voter Home</a> | <a href="/faculty?key=${SUPER_HASH}">Faculty View</a></p>
 </div></body></html>`);
});

app.post('/DONT@001/import',(req,res)=>{
 const busboy=Busboy({headers:req.headers});let fileContent='';let key='';
 busboy.on('field',(n,v)=>{if(n==='key')key=v}); busboy.on('file',(n,file)=>{file.on('data',d=>fileContent+=d.toString())});
 busboy.on('finish',async()=>{if(key!==SUPER_HASH)return res.send('Wrong hash');const ids=fileContent.split(/[\n,\r,]+/).map(s=>s.trim().toUpperCase()).filter(s=>s.startsWith('LISE-'));await kv.set('voters',ids);await kv.set('tokenMap',{});await kv.set('usedTokens',[]);await kv.set('votes',[]);const audit=(await kv.get('audit'))||[];audit.push({action:`Imported ${ids.length} voters`,time:new Date().toISOString()});await kv.set('audit',audit);res.redirect('/DONT@001?key='+SUPER_HASH);});req.pipe(busboy);
});
app.post('/DONT@001/candidate',async(req,res)=>{
 if(req.body.key!==SUPER_HASH)return res.send('Wrong hash');
 const candidates=(await kv.get('candidates'))||[];candidates.push({id:Date.now().toString(),president:req.body.president,vice:req.body.vice,party:req.body.party,photo:req.body.photo||'C'});await kv.set('candidates',candidates);res.redirect('/DONT@001?key='+SUPER_HASH);
});
app.post('/DONT@001/reset',async(req,res)=>{
 if(req.body.key!==SUPER_HASH)return res.send('Wrong hash');await kv.set('votes',[]);await kv.set('usedTokens',[]);await kv.set('tokenMap',{});const audit=(await kv.get('audit'))||[];audit.push({action:'RESET ALL',time:new Date().toISOString()});await kv.set('audit',audit);res.redirect('/DONT@001?key='+SUPER_HASH);
});

module.exports=app;

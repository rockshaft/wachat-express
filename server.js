const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || 'https://wachat-app.onrender.com';
const SECRET = process.env.AGENCY_DASHBOARD_SECRET || 'rockshaft2024';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <html><body style="font-family:sans-serif;padding:40px;text-align:center">
    <div style="width:60px;height:60px;background:#25D366;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </div>
    <h1 style="color:#111">WA Chat Widget ✅</h1>
    <p style="color:#666;margin:8px 0">Server is running</p>
    <a href="/agency?token=${SECRET}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#25D366;color:white;border-radius:8px;text-decoration:none;font-weight:600">Open Agency Dashboard</a>
    </body></html>
  `);
});

// ── Widget JS served to merchant stores ──────────────────────────────────────
app.get('/widget.js', async (req, res) => {
  const shop = req.query.shop || '';
  try {
    const store = await prisma.store.findUnique({ where: { shop } });
    if (!store || !store.whatsappNumber) {
      return res.type('js').send('// WA Chat: not configured');
    }
    const number = store.whatsappNumber.replace(/\D/g, '');
    const color = store.buttonColor || '#25D366';
    const name = store.agentName || 'Support';
    const msg = (store.preMessage || 'Hi!').replace(/`/g, "'");
    const pos = store.position || 'right';
    const initials = name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
    const encodedMsg = encodeURIComponent(store.preMessage || 'Hi!');

    const script = `(function(){
  if(${store.mobileOnly}&&window.innerWidth>768)return;
  if(${store.hideOnCheckout}&&window.location.pathname.includes('/checkouts'))return;
  var s=document.createElement('style');
  s.textContent='#wachat{position:fixed;${pos==='left'?'left:20px':'right:20px'};bottom:20px;z-index:2147483647;font-family:-apple-system,sans-serif}#wb{width:56px;height:56px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);transition:transform .2s;border:none;outline:none}#wb:hover{transform:scale(1.1)}#wb svg{width:30px;height:30px;fill:white}#wc{display:none;position:absolute;${pos==='left'?'left:0':'right:0'};bottom:68px;width:280px;background:white;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.18)}#wc.open{display:block}.wh{background:${color};padding:16px;display:flex;align-items:center;gap:12px;position:relative}.wa{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:15px;flex-shrink:0}.wn{color:white;font-weight:700;font-size:15px}.wst{color:rgba(255,255,255,.85);font-size:12px}.wdot{width:7px;height:7px;border-radius:50%;background:#a5f3b8;display:inline-block;margin-right:4px}.wbd{padding:16px}.wmsg{background:#f0f0f0;border-radius:4px 14px 14px 14px;padding:12px 14px;font-size:13px;color:#333;line-height:1.55;margin-bottom:14px}.wbtn{display:block;text-align:center;background:${color};color:white;padding:13px;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none}.wcl{position:absolute;top:10px;right:10px;background:rgba(255,255,255,.2);border:none;border-radius:50%;width:26px;height:26px;cursor:pointer;color:white;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center}#wbadge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#ff3b30;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700}';
  document.head.appendChild(s);
  var waUrl='https://wa.me/${number}?text=${encodedMsg}';
  var r=document.createElement('div');r.id='wachat';
  r.innerHTML='<div id="wc"><div class="wh"><div class="wa">${initials}</div><div><div class="wn">${name}</div><div class="wst"><span class="wdot"></span>Online now</div></div><button class="wcl" onclick="document.getElementById(\\'wc\\').classList.remove(\\'open\\')">×</button></div><div class="wbd"><div class="wmsg">${msg}</div><a class="wbtn" href="'+waUrl+'" target="_blank" rel="noopener">💬 Chat on WhatsApp</a></div></div><button id="wb" aria-label="Chat on WhatsApp"><span id="wbadge">1</span><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></button>';
  document.body.appendChild(r);
  document.getElementById('wb').onclick=function(){
    document.getElementById('wc').classList.toggle('open');
    document.getElementById('wbadge').style.display='none';
    fetch('${APP_URL}/api/click?shop=${shop}',{method:'POST',keepalive:true}).catch(function(){});
  };
  document.querySelector('.wbtn').onclick=function(){
    fetch('${APP_URL}/api/chat?shop=${shop}',{method:'POST',keepalive:true}).catch(function(){});
  };
  ${store.autoOpen ? `setTimeout(function(){document.getElementById('wc').classList.add('open');},${store.autoOpenDelay}000);` : ''}
})();`;

    res.type('js').set('Cache-Control', 'public, max-age=120').send(script);
  } catch (err) {
    console.error(err);
    res.type('js').send('// WA Chat: error loading widget');
  }
});

// ── Analytics tracking ────────────────────────────────────────────────────────
app.post('/api/click', async (req, res) => { await track(req.query.shop, 'click'); res.send('ok'); });
app.post('/api/chat', async (req, res) => { await track(req.query.shop, 'chat'); res.send('ok'); });

async function track(shop, type) {
  try {
    const store = await prisma.store.findUnique({ where: { shop } });
    if (!store) return;
    const today = new Date(); today.setHours(0,0,0,0);
    await prisma.analytics.upsert({
      where: { storeId_date: { storeId: store.id, date: today } },
      create: { storeId: store.id, date: today, clicks: type==='click'?1:0, chats: type==='chat'?1:0, pageViews: 0 },
      update: type==='click' ? { clicks: { increment:1 } } : { chats: { increment:1 } }
    });
  } catch(e) { console.error(e); }
}

// ── Setup page — add/edit client store ───────────────────────────────────────
app.get('/setup', async (req, res) => {
  if (req.query.token !== SECRET) return res.status(401).send('Unauthorized');
  const { shop } = req.query;
  let store = null;
  if (shop) store = await prisma.store.findUnique({ where: { shop } });

  res.send(`<!DOCTYPE html><html><head><title>Setup Store</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#f8f9fa;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:white;border-radius:16px;padding:32px;width:100%;max-width:500px;box-shadow:0 2px 16px rgba(0,0,0,.08)}
  h1{font-size:20px;font-weight:700;margin-bottom:4px}p{color:#666;font-size:14px;margin-bottom:24px}
  label{font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:5px;margin-top:12px}
  input,select{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;outline:none}
  input:focus,select:focus{border-color:#25D366}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  button{width:100%;padding:12px;background:#25D366;color:white;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:20px}
  .msg{display:none;padding:12px 16px;border-radius:8px;margin-top:12px;font-size:13px}
  .success{background:#f0fff6;color:#065f46;border:1px solid #25D366}
  .code{background:#f5f5f5;padding:12px;border-radius:6px;font-family:monospace;font-size:11px;word-break:break-all;margin-top:8px;line-height:1.6}
  a.back{display:inline-block;margin-bottom:16px;color:#25D366;text-decoration:none;font-size:13px;font-weight:600}
  </style></head><body><div class="card">
  <a class="back" href="/agency?token=${SECRET}">← Back to dashboard</a>
  <h1>${store ? 'Edit store' : 'Add new store'}</h1>
  <p>Configure WhatsApp widget for a client store</p>
  <form id="f">
    <label>Store domain</label>
    <input name="shop" placeholder="clientstore.myshopify.com" value="${store?.shop||''}" ${store?'readonly':''} required>
    <label>WhatsApp number (with country code)</label>
    <input name="whatsappNumber" placeholder="+91 98765 43210" value="${store?.whatsappNumber||''}" required>
    <label>Agent name</label>
    <input name="agentName" placeholder="Support" value="${store?.agentName||'Support'}">
    <label>Pre-filled message</label>
    <input name="preMessage" value="${store?.preMessage||'Hi! I have a question 👋'}">
    <div class="row">
      <div>
        <label>Button color</label>
        <select name="buttonColor">
          <option value="#25D366" ${store?.buttonColor==='#25D366'?'selected':''}>WhatsApp Green</option>
          <option value="#075E54" ${store?.buttonColor==='#075E54'?'selected':''}>Dark Green</option>
          <option value="#1A1A2E" ${store?.buttonColor==='#1A1A2E'?'selected':''}>Dark Navy</option>
          <option value="#E53935" ${store?.buttonColor==='#E53935'?'selected':''}>Red</option>
          <option value="#1565C0" ${store?.buttonColor==='#1565C0'?'selected':''}>Blue</option>
        </select>
      </div>
      <div>
        <label>Position</label>
        <select name="position">
          <option value="right" ${store?.position==='right'?'selected':''}>Bottom Right</option>
          <option value="left" ${store?.position==='left'?'selected':''}>Bottom Left</option>
        </select>
      </div>
    </div>
    <div class="row">
      <div>
        <label>Plan</label>
        <select name="plan">
          <option value="starter" ${store?.plan==='starter'?'selected':''}>Starter (Free)</option>
          <option value="growth" ${store?.plan==='growth'?'selected':''}>Growth (₹299/mo)</option>
          <option value="pro" ${store?.plan==='pro'?'selected':''}>Pro (₹599/mo)</option>
        </select>
      </div>
      <div>
        <label>Auto-open popup</label>
        <select name="autoOpen">
          <option value="false" ${!store?.autoOpen?'selected':''}>No</option>
          <option value="true" ${store?.autoOpen?'selected':''}>Yes</option>
        </select>
      </div>
    </div>
    <button type="submit">Save & generate widget code</button>
  </form>
  <div class="msg success" id="result">
    <strong>✅ Store saved!</strong><br>
    Add this snippet just before &lt;/body&gt; in theme.liquid:<br>
    <div class="code" id="snippet"></div>
  </div>
  </div>
  <script>
  document.getElementById('f').onsubmit=async function(e){
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.target));
    data.autoOpen=data.autoOpen==='true';
    const r=await fetch('/api/store?token=${SECRET}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const store=await r.json();
    document.getElementById('snippet').textContent='<script src="${APP_URL}/widget.js?shop='+store.shop+'" defer><\\/script>';
    document.getElementById('result').style.display='block';
  };
  </script>
  </body></html>`);
});

// ── Store API ─────────────────────────────────────────────────────────────────
app.get('/api/store', async (req, res) => {
  if (req.query.token !== SECRET) return res.status(401).json({ error: 'Unauthorized' });
  const store = await prisma.store.findUnique({ where: { shop: req.query.shop } });
  res.json(store);
});

app.post('/api/store', async (req, res) => {
  if (req.query.token !== SECRET) return res.status(401).json({ error: 'Unauthorized' });
  const { shop, ...data } = req.body;
  try {
    const store = await prisma.store.upsert({
      where: { shop },
      create: { shop, ...data },
      update: data
    });
    res.json(store);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Agency Dashboard ──────────────────────────────────────────────────────────
app.get('/agency', async (req, res) => {
  if (req.query.token !== SECRET) return res.status(401).send('<h2>Unauthorized</h2>');

  const stores = await prisma.store.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      analytics: { where: { date: { gte: new Date(Date.now()-30*24*60*60*1000) } } }
    }
  });

  const mrr = stores.reduce((s,st)=>s+(st.plan==='growth'?299:st.plan==='pro'?599:0),0);
  const totalClicks = stores.reduce((s,st)=>s+st.analytics.reduce((a,b)=>a+b.clicks,0),0);
  const totalChats = stores.reduce((s,st)=>s+st.analytics.reduce((a,b)=>a+b.chats,0),0);

  const rows = stores.map(st=>{
    const clicks=st.analytics.reduce((a,b)=>a+b.clicks,0);
    const chats=st.analytics.reduce((a,b)=>a+b.chats,0);
    const conv=clicks>0?Math.round((chats/clicks)*100):0;
    const pc=st.plan==='growth'?'#25D366':st.plan==='pro'?'#1a73e8':'#888';
    return `<tr style="border-top:1px solid #f0f0f0">
      <td style="padding:12px 16px"><b>${st.shop.replace('.myshopify.com','')}</b><br><small style="color:#999">${st.shop}</small></td>
      <td style="padding:12px 16px">${st.whatsappNumber||'<span style="color:#ccc">Not set</span>'}</td>
      <td style="padding:12px 16px"><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${pc}20;color:${pc}">${st.plan}</span></td>
      <td style="padding:12px 16px;font-weight:600">${clicks}</td>
      <td style="padding:12px 16px;font-weight:600">${chats}</td>
      <td style="padding:12px 16px;color:${conv>=40?'#25D366':conv>=20?'#f59e0b':'#ef4444'};font-weight:600">${conv}%</td>
      <td style="padding:12px 16px;color:#666">${new Date(st.createdAt).toLocaleDateString('en-IN')}</td>
      <td style="padding:12px 16px"><a href="/setup?token=${SECRET}&shop=${st.shop}" style="color:#25D366;font-size:12px;font-weight:600;text-decoration:none">Edit →</a></td>
    </tr>`;
  }).join('');

  res.send(`<!DOCTYPE html><html><head><title>Agency Dashboard — WA Chat</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#f8f9fa;color:#111}
  .header{background:white;padding:16px 32px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between}
  .logo{display:flex;align-items:center;gap:10px}.logo-icon{width:36px;height:36px;background:#25D366;border-radius:10px;display:flex;align-items:center;justify-content:center}
  .logo-icon svg{width:20px;height:20px;fill:white}
  .content{padding:32px;max-width:1100px;margin:0 auto}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
  .stat{background:white;border-radius:12px;padding:16px 20px;border:1px solid #eee}
  .stat-l{font-size:12px;color:#666;margin-bottom:4px}.stat-v{font-size:26px;font-weight:700}.stat-s{font-size:12px;color:#999;margin-top:2px}
  .card{background:white;border-radius:12px;border:1px solid #eee;overflow:hidden;margin-bottom:16px}
  .card-h{padding:16px 20px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center}
  .card-h h2{font-size:15px;font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:13px}th{padding:10px 16px;text-align:left;font-weight:600;color:#555;font-size:12px;background:#fafafa}
  .add{padding:8px 16px;background:#25D366;color:white;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600}
  .mrr{padding:16px;background:#f0fff6;border-radius:10px;font-size:13px;color:#065f46}
  </style></head><body>
  <div class="header">
    <div class="logo"><div class="logo-icon"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></div>
    <div><h1 style="font-size:17px;font-weight:700">WA Chat Agency</h1><p style="font-size:12px;color:#666">${stores.length} stores</p></div></div>
  </div>
  <div class="content">
    <div class="stats">
      <div class="stat"><div class="stat-l">Monthly Revenue</div><div class="stat-v">₹${mrr.toLocaleString('en-IN')}</div><div class="stat-s">MRR</div></div>
      <div class="stat"><div class="stat-l">Total stores</div><div class="stat-v">${stores.length}</div><div class="stat-s">${stores.filter(s=>s.plan!=='starter').length} paid</div></div>
      <div class="stat"><div class="stat-l">Widget clicks</div><div class="stat-v">${totalClicks}</div><div class="stat-s">Last 30 days</div></div>
      <div class="stat"><div class="stat-l">Chats started</div><div class="stat-v">${totalChats}</div><div class="stat-s">${totalClicks>0?Math.round((totalChats/totalClicks)*100):0}% conv.</div></div>
    </div>
    <div class="card">
      <div class="card-h"><h2>All client stores</h2><a class="add" href="/setup?token=${SECRET}">+ Add store</a></div>
      <table><thead><tr><th>Store</th><th>WhatsApp #</th><th>Plan</th><th>Clicks</th><th>Chats</th><th>Conv.</th><th>Added</th><th></th></tr></thead>
      <tbody>${rows||'<tr><td colspan="8" style="padding:40px;text-align:center;color:#999">No stores yet. Click "+ Add store" to get started!</td></tr>'}</tbody></table>
    </div>
    <div class="mrr"><strong>Revenue:</strong> Growth ₹299 × ${stores.filter(s=>s.plan==='growth').length} + Pro ₹599 × ${stores.filter(s=>s.plan==='pro').length} = <strong>₹${mrr.toLocaleString('en-IN')}/month</strong></div>
  </div>
  </body></html>`);
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`WA Chat server running on port ${PORT}`);
  console.log(`Agency dashboard: ${APP_URL}/agency?token=${SECRET}`);
});
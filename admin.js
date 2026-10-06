function sTap(){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='square'; o.frequency.setValueAtTime(480,ctx.currentTime);
    g.gain.setValueAtTime(0.07,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.07);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.08);
  }catch(e){}
}

let opened = false;
let authed = false;
const root = document.getElementById('root');
function screen(html){ root.innerHTML = '<div class="screen">'+html+'</div>'; }

async function api(path, opts={}){
  const res = await fetch(path, {
    method: opts.method||'GET',
    headers: { 'Content-Type':'application/json', ...(opts.headers||{}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || 'حصل خطأ');
  return data;
}
function adminHeaders(){ return { 'x-admin-password': sessionStorage.getItem('gate_admin_pw')||'' }; }

async function boot(){
  const saved = sessionStorage.getItem('gate_admin_pw');
  if(saved){
    try{ await api('/api/admin/verify', { headers:adminHeaders() }); authed=true; }
    catch(e){ sessionStorage.removeItem('gate_admin_pw'); }
  }
  const s = await fetch('/api/state').then(r=>r.json()).catch(()=>({opened:false}));
  opened = !!s.opened;

  const socket = io();
  socket.on('state-updated', s=>{ opened = !!s.opened; if(authed) render(); });

  render();
}

function render(){
  if(!authed) return renderLogin();
  screen(`
    <div class="panel" style="text-align:center;">
      <div class="status ${opened?'open':'closed'}">${opened? '● اللعبة مفتوحة للجمهور دلوقتي' : '○ اللعبة مقفولة — الجمهور مستني'}</div>
      <p class="muted">دوس الزرار وقت ما تحب اللعبة تتفتح لكل الحضور في نفس اللحظة</p>
      <button class="btn" onclick="toggle()">${opened ? 'قفل اللعبة' : 'افتح اللعبة دلوقتي'}</button>
    </div>
  `);
}

function renderLogin(){
  screen(`
    <div class="panel">
      <h2>باسورد المخرج</h2>
      <input type="password" id="ap" placeholder="الباسورد اللي حطيته في ADMIN_PASSWORD">
      <button class="btn" onclick="doLogin()">دخول</button>
      <div id="err" class="muted" style="color:#d99; margin-top:.5em;"></div>
    </div>
  `);
}

async function doLogin(){
  const password = document.getElementById('ap').value;
  try{
    await api('/api/admin/login', {method:'POST', body:{password}});
    sessionStorage.setItem('gate_admin_pw', password);
    authed = true; sTap();
    render();
  }catch(e){
    document.getElementById('err').textContent = e.message;
  }
}

async function toggle(){
  sTap();
  try{
    const s = await api('/api/admin/toggle', {method:'POST', headers:adminHeaders()});
    opened = s.opened;
    render();
  }catch(e){ alert(e.message); }
}

boot();

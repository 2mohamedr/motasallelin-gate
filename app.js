/* ---------- sound (synthesized, no files) ---------- */
let actx;
function audio(){ if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)(); return actx; }
function tone(freq,dur,type,vol,delay){
  try{
    const ctx=audio(); const t0=ctx.currentTime+(delay||0);
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type||'sine'; o.frequency.setValueAtTime(freq,t0);
    g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(vol||0.14,t0+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0+dur+0.05);
  }catch(e){}
}
const sTap = ()=> tone(480,0.07,'square',0.07);
const sOpen = ()=>{ tone(420,0.14,'triangle',0.12); tone(640,0.16,'triangle',0.11,0.08); tone(900,0.2,'triangle',0.1,0.18); };
const sWhistle = ()=>{
  try{
    const ctx=audio(); const t0=ctx.currentTime;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='square'; o.frequency.setValueAtTime(1800,t0);
    o.frequency.linearRampToValueAtTime(2300,t0+0.15); o.frequency.linearRampToValueAtTime(1800,t0+0.32);
    g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(0.18,t0+0.03);
    g.gain.setValueAtTime(0.18,t0+0.28); g.gain.exponentialRampToValueAtTime(0.0001,t0+0.4);
    o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0+0.45);
  }catch(e){}
};
const sResult = ()=>{ tone(300,0.25,'sine',0.1); tone(220,0.35,'sine',0.09,0.1); };

/* ---------- game content ---------- */
const roles = [
  { id:'love', role:'إله الحب', who:'الغني اللي اتربى من غير حب',
    setup:'اتولدت في بيت فيه كل حاجة غير الحب. أبوك علّمك إن الفلوس بتشتري كل حاجة، وإن العاطفة ضعف.',
    declare:'أنا إله الحب',
    result:'الناس فضلت بعيدة. اشتريت كل حاجة… إلا اللي كنت محتاجه فعلاً.',
    question:'ليه محسسنيش ولا مرة؟' },
  { id:'mercy', role:'إله المحبة', who:'القوي اللي اتعلم إن الضعف عيب',
    setup:'بدراعك بس قدرت تعمل كل حاجة. اتعلمت إن اللي معاه قوة محتاجش حد.',
    declare:'أنا إله المحبة',
    result:'قويت… وقويت… وقعدت لوحدك. القوة مادتش لك ولا صاحب بيسأل عليك بجد.',
    question:'ليه حرمنا من الحب؟' },
  { id:'health', role:'إله الصحة', who:'التعبانة اللي بتبيع ترمس وابنها كرهها',
    setup:'خدمتِ ابنك بكل اللي تقدري عليه، ومرض بعينه وانتي اللي مشيتِ عشان عنوانه، وكرهك من يومها.',
    declare:'أنا إله الصحة',
    result:'المرض والتعب هما اللي قربوك من ابنك… وهما نفسهم اللي بعدوه عنك.',
    question:'ليه الفرق ده؟ ليه غيري عايش في قصور وأنا نايمة على رصيف؟' },
  { id:'money', role:'إله الفلوس', who:'الغلبان اللي شحت طول عمره',
    setup:'من عشة فقيرة و١١ ولد، اتعلمت إن كل حاجة في الدنيا سواد.',
    declare:'أنا إله الفلوس',
    result:'بقى معاك الفلوس… بس اكتشفت إنها مش بتشتري اللي انت فعلاً كنت عايزه.',
    question:'ياريت لو راحت كل الفلوس ورجعت صحتي.' },
  { id:'justice', role:'إله العدل', who:'الأب اللي حكم على حد بحياته',
    setup:'شفت بنتك بتهرب مع واحد مش راضي عنه، وفي لحظة غضب، حكمت… وقتلت.',
    declare:'أنا إله العدل',
    result:'حكمت بسرعة، وانحكم عليك بسرعة. العدل من غير رحمة بيرجعلك بنفس القسوة.',
    question:'معقول نتمرد على اللي خلقنا؟' },
  { id:'patience', role:'إله الصبر', who:'الأم اللي استحملت كل حاجة',
    setup:'جوزك مات، بنتك اتسجنت، وانتي فضلتي واقفة تستحملي كل اللي حواليكي.',
    declare:'أنا إله الصبر',
    result:'اتكرستي وهتكملي بقية حياتك تعيسة وحزينة… والصبر لوحده مش بيداوي.',
    question:'أنا هقولها بعد كده؟' }
];

/* ---------- state ---------- */
let opened = false;
let current = null;
const root = document.getElementById('root');
function screen(html){ root.innerHTML = '<div class="screen">'+html+'</div>'; }

async function boot(){
  try{
    const r = await fetch('/api/state');
    const s = await r.json();
    opened = !!s.opened;
  }catch(e){}
  render();

  const socket = io();
  socket.on('state-updated', s=>{
    const wasOpened = opened;
    opened = !!s.opened;
    if(!wasOpened && opened){ sOpen(); }
    render();
  });
}

function render(){
  if(!opened) return renderWaiting();
  return renderSelect();
}

function renderWaiting(){
  screen(`
    <div class="panel" style="text-align:center;">
      <div class="dot"></div>
      <h2 style="margin-top:1em;">استنى شوية...</h2>
      <p class="muted">اللعبة هتتفتح في لحظة معينة من العرض. لحد ما يحصل كده، خد بالك إزاي هتلعب:</p>
      <p style="text-align:right; line-height:2;">
        🎭 لما تتفتح، هتختار <b>تبقى إله إيه</b> من شخصيات العرض<br>
        💭 هتشوف قصته باختصار، وتعلن "أنا إله كذا"<br>
        ⚖️ وبعدين هتشوف مصيره... وهو بيسأل سؤال واحد بس
      </p>
      <p class="muted">سيب الموبايل في إيدك.</p>
    </div>
  `);
}

function renderSelect(){
  screen(`
    <div class="badge">اللعبة اتفتحت 🎉</div>
    <h2>اختار... هتبقى إله إيه؟</h2>
    <div class="cards">
      ${roles.map(r=>`
        <div class="card" onclick="pick('${r.id}')">
          <div class="t">${r.role}</div>
          <div class="s">${r.who}</div>
        </div>`).join('')}
    </div>
  `);
}

function pick(id){
  sTap();
  current = roles.find(r=>r.id===id);
  screen(`
    <div class="panel">
      <div class="badge">${current.who}</div>
      <p>${current.setup}</p>
      <button class="btn" onclick="declare()">"${current.declare}"</button>
    </div>
  `);
}

function declare(){
  sWhistle();
  screen(`
    <div class="panel" style="text-align:center;">
      <div style="font-size:2rem;">🟨</div>
      <h2>تصفيرة!</h2>
      <p><b>المخرج:</b> ممنوع تطلب معونة. انت إله نفسك.</p>
      <button class="btn" onclick="result()">كمّل</button>
    </div>
  `);
}

function result(){
  sResult();
  screen(`
    <div class="panel">
      <div class="badge">${current.role}</div>
      <p>${current.result}</p>
      <p class="muted">"${current.question}"</p>
      <button class="btn" onclick="renderSelect()">جرب إله تاني</button>
    </div>
  `);
}

boot();

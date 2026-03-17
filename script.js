/* Binary Lab — Spotify Edition · script.js */

// ── STATE ──────────────────────────────────
let bits      = [0,0,0,0,0,0,0,0];
const pows    = [128,64,32,16,8,4,2,1];
let quizLevel = 'easy', quizMode = 'b2d';
let qScore = 0, qTotal = 0, qStreak = 0, qAnswered = false;
let curOp     = 'AND', curQuiz = null, toastTimer;

// ── TABS ───────────────────────────────────
function showTab(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const idx = ['t1','t2','t3','t4'].indexOf(id);
  document.querySelectorAll('.tab-btn')[idx].classList.add('active');
}

// ── BIT SIMULATOR ──────────────────────────
function initBits() {
  const wrap = document.getElementById('bit-container');
  wrap.innerHTML = '';

  pows.forEach((p, i) => {
    if (i === 4) {
      const sep = document.createElement('div');
      sep.className = 'bit-sep';
      wrap.appendChild(sep);
    }
    const unit = document.createElement('div');
    unit.className = 'bit-unit';
    unit.innerHTML = `
      <div class="bit-pow">2<sup>${7-i}</sup></div>
      <button class="bit-btn" id="b${i}" onmouseenter="dragOn(${i})">0</button>
      <div class="bit-val-label">${p}</div>`;
    wrap.appendChild(unit);
  });

  // single mousedown — fixes left-click double-toggle bug
  wrap.addEventListener('mousedown', e => {
    const btn = e.target.closest('.bit-btn');
    if (!btn) return;
    isDrag = true;
    flip(parseInt(btn.id.slice(1)));
    e.preventDefault();
  });

  renderBits();
}

let isDrag = false;
document.addEventListener('mouseup', () => isDrag = false);
function dragOn(i) { if (isDrag) flip(i); }

function flip(i) {
  bits[i] ^= 1;
  const btn = document.getElementById('b' + i);
  btn.textContent = bits[i];
  btn.className = 'bit-btn' + (bits[i] ? ' on' : '');
  renderBits();
}

function renderBits() {
  const dec = bits.reduce((s,b,i) => s + b*pows[i], 0);
  const bin = bits.join('');
  document.getElementById('r-bin').textContent = bin;
  document.getElementById('r-dec').textContent = dec;
  document.getElementById('r-hex').textContent = '0x' + dec.toString(16).toUpperCase().padStart(2,'0');
  document.getElementById('r-oct').textContent = '0o' + dec.toString(8).padStart(3,'0');

  const on = bits.map((b,i) => b ? pows[i] : null).filter(Boolean);
  const box = document.getElementById('r-step');
  if (!on.length) {
    box.innerHTML = 'Semua bit <span class="h1">0</span> — nilai = 0';
  } else {
    box.innerHTML =
      on.map(v => `<span class="h1">${v}</span>`).join(' + ') +
      ` = <span class="h2">${dec}</span>\n\n` +
      `Biner: ${bin}  ·  Desimal: ${dec}  ·  Hex: 0x${dec.toString(16).toUpperCase()}`;
  }
}

function setVal(n) {
  n = Math.max(0, Math.min(255, n));
  bits = n.toString(2).padStart(8,'0').split('').map(Number);
  bits.forEach((b,i) => {
    const btn = document.getElementById('b'+i);
    if (btn) { btn.textContent = b; btn.className = 'bit-btn'+(b?' on':''); }
  });
  renderBits();
}

function resetBits()  { setVal(0);   toast('Semua bit direset ke 0'); }
function randomBits() { setVal(Math.floor(Math.random()*256)); toast('Random bits!'); }

// ── DEC ↔ BIN CONVERTER ────────────────────
function d2bConvert() {
  const raw = document.getElementById('d2b-input').value;
  const n   = parseInt(raw);
  const res = document.getElementById('conv2-results');
  const box = document.getElementById('d2b-steps');

  if (raw==='' || isNaN(n) || n<0 || n>255) {
    box.innerHTML = 'Masukkan angka 0–255.';
    res.style.display = 'none'; return;
  }
  document.getElementById('b2d-input').value = '';
  const pad = n.toString(2).padStart(8,'0');
  let steps = `<span class="h1">Metode bagi-2</span> — baca sisa dari bawah:\n\n`;
  let cur = n, rems = [];

  if (n===0) {
    steps += '0 ÷ 2 = 0  sisa <span class="h1">0</span>';
  } else {
    while (cur > 0) {
      const r = cur%2, q = Math.floor(cur/2);
      steps += `${cur} ÷ 2 = ${q}  sisa <span class="h1">${r}</span>\n`;
      rems.unshift(r); cur = q;
    }
    steps += `\n→ Baca bawah ke atas: <span class="h2">${rems.join('')}</span>`;
    steps += `\n→ 8-bit: <span class="h3">${pad}</span>`;
  }

  box.innerHTML = steps;
  res.style.display = 'grid';
  res.innerHTML = `
    <div class="stat-cell"><div class="stat-label">Biner</div><div class="stat-val sm">${pad}</div></div>
    <div class="stat-cell"><div class="stat-label">Desimal</div><div class="stat-val">${n}</div></div>
    <div class="stat-cell"><div class="stat-label">Hex</div><div class="stat-val blue">0x${n.toString(16).toUpperCase().padStart(2,'0')}</div></div>
    <div class="stat-cell"><div class="stat-label">Octal</div><div class="stat-val amber">0o${n.toString(8).padStart(3,'0')}</div></div>`;
  setVal(n);
}

function b2dConvert() {
  const raw = document.getElementById('b2d-input').value.trim();
  const res = document.getElementById('conv2-results');
  const box = document.getElementById('d2b-steps');

  if (!/^[01]+$/.test(raw)) {
    box.innerHTML = 'Hanya karakter 0 dan 1 yang valid.';
    res.style.display = 'none'; return;
  }
  document.getElementById('d2b-input').value = '';
  const n = parseInt(raw,2), pad = raw.padStart(8,'0');
  let parts = [], sum = 0;
  pad.slice(-8).split('').forEach((b,i) => {
    if(b==='1') { parts.push(`<span class="h1">${pows[i]}</span>`); sum+=pows[i]; }
  });

  let steps = `<span class="h1">Nilai tempat (pangkat 2):</span>\n\n`;
  steps += parts.length ? `${parts.join(' + ')} = <span class="h2">${sum}</span>` : 'Semua bit 0 → nilai 0';

  box.innerHTML = steps;
  res.style.display = 'grid';
  res.innerHTML = `
    <div class="stat-cell"><div class="stat-label">Biner</div><div class="stat-val sm">${pad}</div></div>
    <div class="stat-cell"><div class="stat-label">Desimal</div><div class="stat-val">${n}</div></div>
    <div class="stat-cell"><div class="stat-label">Hex</div><div class="stat-val blue">0x${n.toString(16).toUpperCase().padStart(2,'0')}</div></div>
    <div class="stat-cell"><div class="stat-label">Octal</div><div class="stat-val amber">0o${n.toString(8)}</div></div>`;
  setVal(n);
}

// ── OPERATIONS ─────────────────────────────
const OP_INFO = {
  AND: '<strong>AND</strong> — Output <code>1</code> hanya jika kedua bit = 1. Buat masking. Contoh: <code>1100 AND 1010 = 1000</code>',
  OR:  '<strong>OR</strong>  — Output <code>1</code> jika salah satu bit = 1. Contoh: <code>1100 OR 1010 = 1110</code>',
  XOR: '<strong>XOR</strong> — Output <code>1</code> jika bit berbeda. Buat toggle & enkripsi. Contoh: <code>1100 XOR 1010 = 0110</code>',
  NOT: '<strong>NOT</strong> — Flip semua bit. Contoh: <code>NOT 10110011 = 01001100</code>',
  SHL: '<strong>Shift Left (&lt;&lt;)</strong> — Geser kiri, isi kanan dengan 0. Efek = ×2. Contoh: <code>00000101 &lt;&lt; 1 = 00001010</code>',
  SHR: '<strong>Shift Right (&gt;&gt;)</strong> — Geser kanan, buang bit terakhir. Efek = ÷2. Contoh: <code>00001010 &gt;&gt; 1 = 00000101</code>',
};

function setOp(op) {
  curOp = op;
  document.querySelectorAll('.op-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.op-tab')[['AND','OR','XOR','NOT','SHL','SHR'].indexOf(op)].classList.add('active');
  document.getElementById('op-info').innerHTML = OP_INFO[op];
  document.getElementById('op-b-wrap').style.display = ['NOT','SHL','SHR'].includes(op) ? 'none' : 'block';
  calcOp(); drawTruth();
}

function calcOp() {
  const aRaw = document.getElementById('op-a').value.trim() || '00000000';
  const bRaw = document.getElementById('op-b').value.trim() || '00000000';
  const disp = document.getElementById('op-visual');

  if (!/^[01]{1,8}$/.test(aRaw)) { disp.innerHTML='<span style="color:var(--red);font-family:var(--mono);font-size:13px">Input A harus 1–8 digit biner</span>'; return; }
  if (['AND','OR','XOR'].includes(curOp) && !/^[01]{1,8}$/.test(bRaw)) { disp.innerHTML='<span style="color:var(--red);font-family:var(--mono);font-size:13px">Input B harus 1–8 digit biner</span>'; return; }

  const a=parseInt(aRaw,2), b=parseInt(bRaw,2);
  const aP=aRaw.padStart(8,'0'), bP=bRaw.padStart(8,'0');
  let res, sym;
  switch(curOp){
    case'AND':res=a&b;sym='AND';break; case'OR':res=a|b;sym='OR';break;
    case'XOR':res=a^b;sym='XOR';break; case'NOT':res=(~a)&0xFF;sym='NOT';break;
    case'SHL':res=(a<<1)&0xFF;sym='<<';break; case'SHR':res=(a>>1)&0xFF;sym='>>';break;
  }
  const rB = res.toString(2).padStart(8,'0');
  const cb = s => s.split('').map((x,i) => i>0&&i%4===0 ? `<span style="color:var(--bg3)"> </span>${x==='1'?`<span class="b1">${x}</span>`:`<span class="b0">${x}</span>`} ` : (x==='1'?`<span class="b1">${x}</span>`:`<span class="b0">${x}</span>`)).join('');

  const noB = ['NOT','SHL','SHR'].includes(curOp);
  let html = `
    <div class="op-row"><span class="op-key">A</span><span class="op-val" style="letter-spacing:.12em">${cb(aP)}</span></div>
    ${!noB ? `<div class="op-row"><span class="op-key">B</span><span class="op-val" style="letter-spacing:.12em">${cb(bP)}</span></div>` : ''}
    <div class="op-row"><span class="op-key" style="color:var(--text3);font-size:11px">${sym}</span><div class="op-divline"></div></div>
    <div class="op-row"><span class="op-key">=</span><span class="op-res" style="letter-spacing:.12em">${cb(rB)}</span></div>
    <div style="margin-top:12px;font-size:12px;color:var(--text3)">${a} ${sym} ${noB?'':b} = <span style="color:var(--accent);font-weight:600">${res}</span> &nbsp;·&nbsp; hex 0x${res.toString(16).toUpperCase()} &nbsp;·&nbsp; bin ${rB}</div>`;
  disp.innerHTML = html;

  let exp='';
  if(curOp==='AND') exp=`Setiap posisi: (1 AND 1)=1, semua lain=0\nA: ${aP}\nB: ${bP}\n= ${rB} (${res})`;
  else if(curOp==='OR')  exp=`Setiap posisi: (0 OR 0)=0, semua lain=1\nA: ${aP}\nB: ${bP}\n= ${rB} (${res})`;
  else if(curOp==='XOR') exp=`Setiap posisi: sama=0, beda=1\nA: ${aP}\nB: ${bP}\n= ${rB} (${res})`;
  else if(curOp==='NOT') exp=`Flip semua bit — 0→1, 1→0\nA:   ${aP}\nNOT: ${rB} (${res})`;
  else if(curOp==='SHL') exp=`Geser kiri 1 posisi, isi kanan dengan 0\nA:   ${aP} (${a})\n<<:  ${rB} (${res}) =${a}×2${res!==a*2?' ⚠ overflow':''}`;
  else if(curOp==='SHR') exp=`Geser kanan 1 posisi, buang bit paling kanan\nA:   ${aP} (${a})\n>>:  ${rB} (${res}) = floor(${a}÷2)`;
  document.getElementById('op-exp').textContent = exp;
}

function drawTruth() {
  const w = document.getElementById('truth-wrap');
  if (['AND','OR','XOR'].includes(curOp)) {
    w.innerHTML = `<table class="t-table"><thead><tr><th>A</th><th>B</th><th>${curOp}</th></tr></thead><tbody>
      ${[[0,0],[0,1],[1,0],[1,1]].map(([a,b])=>{
        const r=curOp==='AND'?a&b:curOp==='OR'?a|b:a^b;
        return `<tr><td class="${a?'c1':'r0'}">${a}</td><td class="${b?'c1':'r0'}">${b}</td><td class="${r?'g1':'r0'}">${r}</td></tr>`;
      }).join('')}</tbody></table>`;
  } else if (curOp==='NOT') {
    w.innerHTML = `<table class="t-table"><thead><tr><th>A</th><th>NOT A</th></tr></thead><tbody>
      <tr><td class="r0">0</td><td class="g1">1</td></tr>
      <tr><td class="c1">1</td><td class="r0">0</td></tr></tbody></table>`;
  } else {
    w.innerHTML = `<div class="step-box">Shift tidak memiliki tabel kebenaran konvensional — lihat visualisasi di atas.</div>`;
  }
}

// ── QUIZ ───────────────────────────────────
function setLevel(l) {
  quizLevel=l;
  ['easy','med','hard'].forEach(x=>document.getElementById('lvl-'+x).classList.remove('active'));
  document.getElementById('lvl-'+l).classList.add('active');
  nextQ();
}
function setMode(m) {
  quizMode=m;
  ['b2d','d2b','mix'].forEach(x=>document.getElementById('mode-'+x).classList.remove('active'));
  document.getElementById('mode-'+m).classList.add('active');
  nextQ();
}

function randN() {
  if(quizLevel==='easy') return Math.floor(Math.random()*16);
  if(quizLevel==='med')  return Math.floor(Math.random()*64);
  return Math.floor(Math.random()*256);
}

function nextQ() {
  qAnswered=false;
  document.getElementById('next-btn').style.display='none';
  document.getElementById('quiz-fb').className='quiz-fb';

  const n=randN(), doB2D=quizMode==='mix'?Math.random()>0.5:quizMode==='b2d';
  curQuiz={n,type:doB2D?'b2d':'d2b'};
  const bin=n.toString(2).padStart(8,'0');
  const qEl=document.getElementById('quiz-q-text');

  document.getElementById('quiz-eyebrow').textContent = doB2D ? 'Biner → Desimal' : 'Desimal → Biner';
  if(doB2D) {
    qEl.innerHTML=`Berapa nilai <strong>desimal</strong> dari bilangan biner ini?<span class="q-code">${bin}</span>`;
  } else {
    qEl.innerHTML=`Angka <strong>${n}</strong> dalam desimal — binernya apa?<span class="q-code" style="font-size:24px;letter-spacing:.06em">${n}</span>`;
  }

  let choices=[];
  if(doB2D){
    choices=[n];
    while(choices.length<4){let r=n+Math.floor(Math.random()*30)-15;r=Math.max(0,Math.min(255,r));if(!choices.includes(r))choices.push(r);}
  } else {
    choices=[bin];
    while(choices.length<4){let r=n+Math.floor(Math.random()*20)-10;r=Math.max(0,Math.min(255,r));const rb=r.toString(2).padStart(8,'0');if(!choices.includes(rb))choices.push(rb);}
  }
  choices=choices.sort(()=>Math.random()-.5);

  const opts=document.getElementById('quiz-opts');
  opts.innerHTML='';
  choices.forEach(c=>{
    const btn=document.createElement('button');
    btn.className='quiz-opt'; btn.textContent=c;
    btn.onclick=()=>checkQ(c,btn);
    opts.appendChild(btn);
  });
}

function checkQ(chosen,btn){
  if(qAnswered) return;
  qAnswered=true; qTotal++;
  const {n,type}=curQuiz;
  const correct=type==='b2d'?n:n.toString(2).padStart(8,'0');
  const ok=String(chosen)===String(correct);

  if(ok){qScore++;qStreak++;btn.className='quiz-opt correct';}
  else{
    qStreak=0;btn.className='quiz-opt wrong';
    document.querySelectorAll('.quiz-opt').forEach(b=>{if(String(b.textContent)===String(correct))b.className='quiz-opt revealed';});
  }

  const fb=document.getElementById('quiz-fb');
  fb.textContent=ok?`✓ Benar! ${n} = ${n.toString(2).padStart(8,'0')} (biner) = ${n} (desimal)`:`✗ Jawaban benar: ${correct}`;
  fb.className='quiz-fb show '+(ok?'ok':'no');

  document.getElementById('q-score').textContent=qScore;
  document.getElementById('q-total').textContent=qTotal;
  document.getElementById('streak').textContent=`🔥 Streak ${qStreak}`;
  document.getElementById('header-score').textContent=qScore;
  document.getElementById('next-btn').style.display='inline-block';
  updateScore();
}

function updateScore(){
  const pct=qTotal>0?Math.round(qScore/qTotal*100):0;
  document.getElementById('prog-inner').style.width=pct+'%';
  document.getElementById('ring-fill').style.strokeDashoffset=207.3-(207.3*pct/100);
  document.getElementById('ring-pct').textContent=pct+'%';
}

function resetQuiz(){
  qScore=qTotal=qStreak=0;
  ['q-score','q-total'].forEach(id=>document.getElementById(id).textContent='0');
  document.getElementById('streak').textContent='🔥 Streak 0';
  document.getElementById('header-score').textContent='0';
  updateScore(); nextQ(); toast('Skor direset');
}

// ── CHEATSHEET ──────────────────────────────
function initCheat(){
  const g=document.getElementById('pow-grid');
  [0,1,2,3,4,5,6,7,8,9,10,16,32].forEach(e=>{
    const c=document.createElement('div');c.className='pow-cell';
    c.innerHTML=`<div class="p-exp">2<sup>${e}</sup></div><div class="p-val">${Math.pow(2,e).toLocaleString()}</div>`;
    g.appendChild(c);
  });
  const notes={0:'basis',8:'1 byte',16:'2 bytes',32:'4 bytes'};
  const tbl=document.getElementById('ref-table');
  tbl.innerHTML=`<thead><tr><th>Dec</th><th>Biner</th><th>Hex</th><th>Note</th></tr></thead><tbody></tbody>`;
  const tb=tbl.querySelector('tbody');
  for(let i=0;i<=31;i++){
    const tr=document.createElement('tr');
    tr.innerHTML=`<td class="d">${i}</td><td class="b">${i.toString(2).padStart(8,'0')}</td><td class="h">${i.toString(16).toUpperCase().padStart(2,'0')}</td><td class="n">${notes[i]||''}</td>`;
    tb.appendChild(tr);
  }
}

// ── TOAST ───────────────────────────────────
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='toast show';
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.className='toast',2500);
}

// ── INIT ────────────────────────────────────
initBits();
initCheat();
setOp('AND');
nextQ();
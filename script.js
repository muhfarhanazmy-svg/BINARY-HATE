/* =============================================
   BINARY LAB — Ghibli Forest Edition
   script.js  (bug fixed: no double-toggle)
   ============================================= */

// ==============================
// FLOATING SOOT SPRITES
// ==============================
(function () {
  const bg = document.getElementById('spirits-bg');
  if (!bg) return;
  const count = 18;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    const size = 8 + Math.random() * 16;
    s.className = 'soot-particle';
    s.style.cssText = `
      position: absolute;
      width:  ${size}px;
      height: ${size}px;
      left:   ${Math.random() * 100}%;
      animation-delay:    ${Math.random() * 12}s;
      animation-duration: ${10 + Math.random() * 10}s;
      opacity: 0;
    `;
    bg.appendChild(s);
  }
})();

// ==============================
// GLOBAL STATE
// ==============================
let bits       = [0, 0, 0, 0, 0, 0, 0, 0];
const pows     = [128, 64, 32, 16, 8, 4, 2, 1];
let quizLevel  = 'easy';
let quizMode   = 'b2d';
let qScore     = 0, qTotal = 0, qStreak = 0, qAnswered = false;
let currentOp  = 'AND';
let curQuizData = null;
let toastTimer;

// ==============================
// TAB SYSTEM
// ==============================
function showTab(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const idx = ['t1', 't2', 't3', 't4'].indexOf(id);
  document.querySelectorAll('.tab-btn')[idx].classList.add('active');
}

// ==============================
// BIT SIMULATOR — soot sprites
// ==============================
function initBitSim() {
  const cont = document.getElementById('bit-container');
  cont.innerHTML = '';

  pows.forEach((p, i) => {
    // separator between high nibble & low nibble
    if (i === 4) {
      const sep = document.createElement('div');
      sep.className = 'bit-sep';
      cont.appendChild(sep);
    }

    const unit = document.createElement('div');
    unit.className = 'bit-unit';
    unit.innerHTML = `
      <div class="bit-pow">2<sup>${7 - i}</sup></div>
      <button class="bit-btn" id="b${i}" onmouseenter="dragToggle(${i})"></button>
      <div class="bit-val-label">${p}</div>`;
    cont.appendChild(unit);
  });

  // mousedown listener — single source of truth (fixes double-toggle bug)
  const bc = document.getElementById('bit-container');
  bc.addEventListener('mousedown', e => {
    const btn = e.target.closest('.bit-btn');
    if (!btn) return;
    isDragging = true;
    const i = parseInt(btn.id.replace('b', ''));
    toggleBit(i);
    e.preventDefault();
  });

  updateBitDisplay();
}

let isDragging = false;
document.addEventListener('mouseup', () => isDragging = false);

function dragToggle(i) {
  if (isDragging) toggleBit(i);
}

function toggleBit(i) {
  bits[i] = bits[i] ? 0 : 1;
  const btn = document.getElementById('b' + i);
  btn.className = 'bit-btn' + (bits[i] ? ' on' : '');
  updateBitDisplay();
}

function updateBitDisplay() {
  const dec    = bits.reduce((s, b, i) => s + b * pows[i], 0);
  const binStr = bits.join('');

  document.getElementById('r-bin').textContent = binStr;
  document.getElementById('r-dec').textContent = dec;
  document.getElementById('r-hex').textContent = '0x' + dec.toString(16).toUpperCase().padStart(2, '0');
  document.getElementById('r-oct').textContent = '0o' + dec.toString(8).padStart(3, '0');

  const active = bits.map((b, i) => b ? pows[i] : null).filter(v => v !== null);
  const box = document.getElementById('r-step');
  if (active.length === 0) {
    box.innerHTML = 'Semua roh tertidur... nilai = <span class="hl">0</span>';
  } else {
    box.innerHTML =
      `<span class="hl">${active.join('</span> + <span class="hl">')}</span>` +
      ` = <span class="hl2">${dec}</span>\n\nBiner: ${binStr}  |  Desimal: ${dec}  |  Hex: 0x${dec.toString(16).toUpperCase()}`;
  }
}

function setBitsFromVal(n) {
  n = Math.max(0, Math.min(255, n));
  bits = n.toString(2).padStart(8, '0').split('').map(Number);
  bits.forEach((b, i) => {
    const btn = document.getElementById('b' + i);
    if (btn) btn.className = 'bit-btn' + (b ? ' on' : '');
  });
  updateBitDisplay();
}

function resetBits()  { setBitsFromVal(0);   showToast('✦ Semua roh kembali tidur'); }
function randomBits() { setBitsFromVal(Math.floor(Math.random() * 256)); showToast('✦ Roh-roh muncul secara acak!'); }

// ==============================
// DEC ↔ BIN CONVERTER
// ==============================
function d2bConvert() {
  const raw = document.getElementById('d2b-input').value;
  const n   = parseInt(raw);

  if (raw === '' || isNaN(n) || n < 0 || n > 255) {
    document.getElementById('d2b-steps').innerHTML = 'Masukkan angka antara 0 dan 255.';
    document.getElementById('conv2-results').style.display = 'none';
    return;
  }

  document.getElementById('b2d-input').value = '';
  const padded = n.toString(2).padStart(8, '0');
  let steps = `<span class="hl">Metode Pembagian 2 — baca sisa dari bawah ke atas:</span>\n\n`;
  let cur = n, rems = [];

  if (n === 0) {
    steps += '0 ÷ 2 = 0  sisa <span class="hl">0</span>';
  } else {
    while (cur > 0) {
      const rem = cur % 2, q = Math.floor(cur / 2);
      steps += `${cur} ÷ 2 = ${q}  sisa <span class="hl">${rem}</span>\n`;
      rems.unshift(rem);
      cur = q;
    }
    steps += `\n→ Baca dari bawah: <span class="hl2">${rems.join('')}</span>\n`;
    steps += `→ 8-bit: <span class="hl3">${padded}</span>  =  <span class="hl2">${n}</span>`;
  }

  document.getElementById('d2b-steps').innerHTML = steps;

  const r = document.getElementById('conv2-results');
  r.style.display = 'grid';
  r.innerHTML = `
    <div class="result-card"><div class="result-label">Biner</div><div class="result-value sm">${padded}</div></div>
    <div class="result-card"><div class="result-label">Desimal</div><div class="result-value">${n}</div></div>
    <div class="result-card"><div class="result-label">Hex</div><div class="result-value sky">0x${n.toString(16).toUpperCase().padStart(2,'0')}</div></div>
    <div class="result-card"><div class="result-label">Octal</div><div class="result-value earth">0o${n.toString(8).padStart(3,'0')}</div></div>`;
  setBitsFromVal(n);
}

function b2dConvert() {
  const raw = document.getElementById('b2d-input').value.trim();
  if (!/^[01]+$/.test(raw)) {
    document.getElementById('d2b-steps').innerHTML = 'Hanya karakter 0 dan 1 yang valid.';
    document.getElementById('conv2-results').style.display = 'none';
    return;
  }

  document.getElementById('d2b-input').value = '';
  const n      = parseInt(raw, 2);
  const padded = raw.padStart(8, '0');
  let parts = [], sum = 0;

  padded.slice(-8).split('').forEach((b, i) => {
    if (b === '1') { parts.push(`<span class="hl">${pows[i]}</span>`); sum += pows[i]; }
  });

  let steps = `<span class="hl">Nilai Tempat (Pangkat 2):</span>\n\n`;
  steps += parts.length === 0
    ? 'Semua bit 0 → nilai = <span class="hl">0</span>'
    : `${parts.join(' + ')}\n= <span class="hl2">${sum}</span>`;

  document.getElementById('d2b-steps').innerHTML = steps;

  const r = document.getElementById('conv2-results');
  r.style.display = 'grid';
  r.innerHTML = `
    <div class="result-card"><div class="result-label">Biner</div><div class="result-value sm">${padded}</div></div>
    <div class="result-card"><div class="result-label">Desimal</div><div class="result-value">${n}</div></div>
    <div class="result-card"><div class="result-label">Hex</div><div class="result-value sky">0x${n.toString(16).toUpperCase().padStart(2,'0')}</div></div>
    <div class="result-card"><div class="result-label">Octal</div><div class="result-value earth">0o${n.toString(8)}</div></div>`;
  setBitsFromVal(n);
}

// ==============================
// BITWISE OPERATIONS
// ==============================
const opInfos = {
  AND: '<strong>AND</strong> — Output 1 hanya jika <strong>kedua</strong> bit = 1. Dipakai untuk masking. Contoh: <code>1100 AND 1010 = 1000</code>',
  OR:  '<strong>OR</strong>  — Output 1 jika <strong>salah satu</strong> bit = 1. Contoh: <code>1100 OR 1010 = 1110</code>',
  XOR: '<strong>XOR</strong> — Output 1 jika bit <strong>berbeda</strong>. Dipakai untuk enkripsi & toggle. Contoh: <code>1100 XOR 1010 = 0110</code>',
  NOT: '<strong>NOT</strong> — Flip <strong>semua bit</strong>. Contoh: <code>NOT 10110011 = 01001100</code>',
  SHL: '<strong>SHIFT LEFT (&lt;&lt;)</strong> — Geser ke kiri, isi kanan dengan 0. Efek = ×2. Contoh: <code>00000101 &lt;&lt; 1 = 00001010</code>',
  SHR: '<strong>SHIFT RIGHT (&gt;&gt;)</strong> — Geser ke kanan, buang bit terakhir. Efek = ÷2. Contoh: <code>00001010 &gt;&gt; 1 = 00000101</code>'
};

function setOp(op) {
  currentOp = op;
  document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('active'));
  const idx = ['AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR'].indexOf(op);
  document.querySelectorAll('.op-btn')[idx].classList.add('active');
  document.getElementById('op-info').innerHTML = opInfos[op];
  document.getElementById('op-b-wrap').style.display =
    (op === 'NOT' || op === 'SHL' || op === 'SHR') ? 'none' : 'block';
  calcOp();
  renderTruthTable();
}

function calcOp() {
  const aRaw = document.getElementById('op-a').value.trim() || '00000000';
  const bRaw = document.getElementById('op-b').value.trim() || '00000000';

  if (!/^[01]{1,8}$/.test(aRaw)) {
    document.getElementById('op-display').innerHTML = '<div style="color:var(--red);font-family:var(--mono);font-size:13px">Input A harus 1–8 digit biner</div>';
    return;
  }
  if (['AND','OR','XOR'].includes(currentOp) && !/^[01]{1,8}$/.test(bRaw)) {
    document.getElementById('op-display').innerHTML = '<div style="color:var(--red);font-family:var(--mono);font-size:13px">Input B harus 1–8 digit biner</div>';
    return;
  }

  const a = parseInt(aRaw, 2), b = parseInt(bRaw, 2);
  const aPad = aRaw.padStart(8, '0'), bPad = bRaw.padStart(8, '0');
  let result, opSym;

  switch (currentOp) {
    case 'AND': result = a & b;           opSym = 'AND'; break;
    case 'OR':  result = a | b;           opSym = 'OR';  break;
    case 'XOR': result = a ^ b;           opSym = 'XOR'; break;
    case 'NOT': result = (~a) & 0xFF;     opSym = 'NOT'; break;
    case 'SHL': result = (a << 1) & 0xFF; opSym = 'SHL'; break;
    case 'SHR': result = (a >> 1) & 0xFF; opSym = 'SHR'; break;
  }

  const resBin = result.toString(2).padStart(8, '0');

  function colorBin(s) {
    return s.split('').map(b =>
      b === '1'
        ? `<span class="bit-1">${b}</span>`
        : `<span class="bit-0">${b}</span>`
    ).join(' ');
  }

  const noB = ['NOT','SHL','SHR'].includes(currentOp);
  let html = `<div class="op-row"><span class="op-label-col" style="font-size:12px">A</span><span class="op-val">${colorBin(aPad)}</span></div>`;
  if (!noB) html += `<div class="op-row"><span class="op-label-col" style="font-size:12px">B</span><span class="op-val">${colorBin(bPad)}</span></div>`;
  html += `<div class="op-row"><span class="op-label-col" style="font-size:10px;color:var(--text3)">${opSym}</span><div class="op-line"></div></div>`;
  html += `<div class="op-row"><span class="op-label-col" style="font-size:12px">=</span><span class="op-result">${colorBin(resBin)}</span></div>`;
  html += `<div class="op-row" style="margin-top:10px">
    <span class="op-label-col" style="font-size:10px;color:var(--text3)">DEC</span>
    <span style="font-family:var(--mono);font-size:13px;color:var(--text2)">
      ${a} ${opSym} ${noB ? '' : b} = <span style="color:var(--earth);font-weight:700">${result}</span>
    </span></div>`;
  document.getElementById('op-display').innerHTML = html;

  let explain = '';
  if (currentOp==='AND') explain=`Setiap posisi: 1 AND 1 = 1, lainnya = 0\nA: ${aPad}\nB: ${bPad}\n= ${resBin} (${result})`;
  else if(currentOp==='OR')  explain=`Setiap posisi: 0 OR 0 = 0, lainnya = 1\nA: ${aPad}\nB: ${bPad}\n= ${resBin} (${result})`;
  else if(currentOp==='XOR') explain=`Setiap posisi: sama=0, beda=1\nA: ${aPad}\nB: ${bPad}\n= ${resBin} (${result})`;
  else if(currentOp==='NOT') explain=`Flip semua bit: 0→1, 1→0\nA:   ${aPad}\nNOT: ${resBin} (${result})`;
  else if(currentOp==='SHL') explain=`Geser kiri 1 posisi, isi kanan dengan 0\nA:   ${aPad} (${a})\nSHL: ${resBin} (${result}) = ${a}×2${result!==a*2?' ⚠ overflow!':''}`;
  else if(currentOp==='SHR') explain=`Geser kanan 1 posisi, buang bit paling kanan\nA:   ${aPad} (${a})\nSHR: ${resBin} (${result}) = floor(${a}÷2)`;
  document.getElementById('op-explain').textContent = explain;
}

function renderTruthTable() {
  const wrap = document.getElementById('truth-wrap');
  if (['AND','OR','XOR'].includes(currentOp)) {
    wrap.innerHTML = `<table class="truth-table">
      <thead><tr><th>A</th><th>B</th><th>${currentOp}(A,B)</th></tr></thead>
      <tbody>${[[0,0],[0,1],[1,0],[1,1]].map(([a,b])=>{
        const r = currentOp==='AND'?a&b:currentOp==='OR'?a|b:a^b;
        return `<tr><td class="${a?'c1':'r0'}">${a}</td><td class="${b?'c1':'r0'}">${b}</td><td class="${r?'g1':'r0'}">${r}</td></tr>`;
      }).join('')}</tbody></table>`;
  } else if (currentOp==='NOT') {
    wrap.innerHTML = `<table class="truth-table">
      <thead><tr><th>A</th><th>NOT A</th></tr></thead>
      <tbody>
        <tr><td class="r0">0</td><td class="g1">1</td></tr>
        <tr><td class="c1">1</td><td class="r0">0</td></tr>
      </tbody></table>`;
  } else {
    wrap.innerHTML = `<div class="scroll-box">Shift tidak punya tabel kebenaran konvensional — lihat visualisasi di atas.</div>`;
  }
}

// ==============================
// QUIZ
// ==============================
function setQuizLevel(l) {
  quizLevel = l;
  ['easy','med','hard'].forEach(x => document.getElementById('lvl-'+x).classList.remove('active'));
  document.getElementById('lvl-'+l).classList.add('active');
  nextQuestion();
}

function setQuizMode(m) {
  quizMode = m;
  ['b2d','d2b','mix'].forEach(x => document.getElementById('mode-'+x).classList.remove('active'));
  document.getElementById('mode-'+m).classList.add('active');
  nextQuestion();
}

function getRandN() {
  if (quizLevel==='easy') return Math.floor(Math.random()*16);
  if (quizLevel==='med')  return Math.floor(Math.random()*64);
  return Math.floor(Math.random()*256);
}

function nextQuestion() {
  qAnswered = false;
  document.getElementById('next-q-btn').style.display = 'none';
  document.getElementById('quiz-fb').className = 'quiz-feedback';

  const n      = getRandN();
  const doB2D  = quizMode==='mix' ? Math.random()>0.5 : quizMode==='b2d';
  curQuizData  = { n, type: doB2D ? 'b2d' : 'd2b' };
  const binStr = n.toString(2).padStart(8,'0');

  document.getElementById('quiz-label').textContent = doB2D
    ? '✦ Baca Roh Biner'
    : '✦ Tulis Roh Biner';

  const qEl = document.getElementById('quiz-q');
  if (doB2D) {
    qEl.innerHTML = `Berapa nilai <strong>desimal</strong> dari roh biner ini?<span class="q-code">${binStr}</span>`;
  } else {
    qEl.innerHTML = `Angka <strong>${n}</strong> — representasi binernya adalah?<span class="q-code" style="font-size:22px;letter-spacing:0.05em">${n}</span>`;
  }

  let choices = [];
  if (doB2D) {
    choices = [n];
    while (choices.length < 4) {
      let r = n + Math.floor(Math.random()*30) - 15;
      r = Math.max(0, Math.min(255, r));
      if (!choices.includes(r)) choices.push(r);
    }
  } else {
    choices = [binStr];
    while (choices.length < 4) {
      let r = n + Math.floor(Math.random()*20) - 10;
      r = Math.max(0, Math.min(255, r));
      const rb = r.toString(2).padStart(8,'0');
      if (!choices.includes(rb)) choices.push(rb);
    }
  }
  choices = choices.sort(() => Math.random() - 0.5);

  const opts = document.getElementById('quiz-opts');
  opts.innerHTML = '';
  choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.textContent = c;
    btn.onclick = () => checkAnswer(c, btn);
    opts.appendChild(btn);
  });
}

function checkAnswer(chosen, btn) {
  if (qAnswered) return;
  qAnswered = true; qTotal++;

  const { n, type } = curQuizData;
  const correct = type==='b2d' ? n : n.toString(2).padStart(8,'0');
  const isRight  = String(chosen) === String(correct);

  if (isRight) {
    qScore++; qStreak++;
    btn.className = 'quiz-opt correct';
  } else {
    qStreak = 0;
    btn.className = 'quiz-opt wrong';
    document.querySelectorAll('.quiz-opt').forEach(b => {
      if (String(b.textContent) === String(correct)) b.className = 'quiz-opt revealed';
    });
  }

  const fb = document.getElementById('quiz-fb');
  fb.textContent = isRight
    ? `✦ Benar! ${n} dalam biner = ${n.toString(2).padStart(8,'0')}`
    : `Jawaban yang benar: ${correct}`;
  fb.className = 'quiz-feedback show ' + (isRight ? 'ok' : 'no');

  document.getElementById('q-score').textContent  = qScore;
  document.getElementById('q-total').textContent  = qTotal;
  document.getElementById('streak-badge').textContent = `✦ Streak: ${qStreak}`;
  document.getElementById('next-q-btn').style.display = 'inline-block';
  document.getElementById('header-score').textContent = `Jiwa terkumpul: ${qScore}`;
  updateScoreUI();
}

function updateScoreUI() {
  const pct          = qTotal > 0 ? Math.round(qScore / qTotal * 100) : 0;
  const circumference = 207.3;
  document.getElementById('score-bar').style.width           = pct + '%';
  document.getElementById('ring-fill').style.strokeDashoffset = circumference - (circumference * pct / 100);
  document.getElementById('ring-pct').textContent             = pct + '%';
}

function resetQuiz() {
  qScore = 0; qTotal = 0; qStreak = 0;
  document.getElementById('q-score').textContent  = '0';
  document.getElementById('q-total').textContent  = '0';
  document.getElementById('streak-badge').textContent = '✦ Streak: 0';
  document.getElementById('header-score').textContent = 'Jiwa terkumpul: 0';
  updateScoreUI(); nextQuestion();
  showToast('Perjalanan dimulai dari awal...');
}

// ==============================
// CHEATSHEET & POWERS
// ==============================
function initCheatsheet() {
  const grid = document.getElementById('pow-grid');
  [0,1,2,3,4,5,6,7,8,9,10,16,32].forEach(e => {
    const card = document.createElement('div');
    card.className = 'pow-card';
    card.innerHTML = `<div class="p-exp">2<sup>${e}</sup></div><div class="p-val">${Math.pow(2,e).toLocaleString()}</div>`;
    grid.appendChild(card);
  });

  const notes = { 0:'(basis)', 8:'(1 byte)', 16:'(2 bytes)', 32:'(4 bytes)' };
  const table  = document.getElementById('cheat-table');
  table.innerHTML = `<thead><tr><th>Desimal</th><th>Biner</th><th>Hex</th><th>Keterangan</th></tr></thead><tbody></tbody>`;
  const tbody = table.querySelector('tbody');
  for (let i = 0; i <= 31; i++) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-dec">${i}</td>
      <td class="td-bin">${i.toString(2).padStart(8,'0')}</td>
      <td class="td-hex">${i.toString(16).toUpperCase().padStart(2,'0')}</td>
      <td class="td-note">${notes[i] || ''}</td>`;
    tbody.appendChild(tr);
  }
}

// ==============================
// TOAST
// ==============================
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast', 2800);
}

// ==============================
// INIT
// ==============================
initBitSim();
initCheatsheet();
setOp('AND');
nextQuestion();
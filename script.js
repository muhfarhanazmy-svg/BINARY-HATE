/* =============================================
   BINARY LAB — script.js
   ============================================= */

// ==============================
// MATRIX RAIN BACKGROUND
// ==============================
(function () {
  const c = document.getElementById('matrix-canvas');
  const ctx = c.getContext('2d');
  let cols, drops;

  function init() {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    cols = Math.floor(c.width / 20);
    drops = Array(cols).fill(1);
  }

  function draw() {
    ctx.fillStyle = 'rgba(3,11,15,0.05)';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#00e5ff';
    ctx.font = '14px Share Tech Mono';
    drops.forEach((y, i) => {
      const txt = Math.random() > 0.5 ? '1' : '0';
      ctx.fillText(txt, i * 20, y * 20);
      if (y * 20 > c.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }

  init();
  setInterval(draw, 60);
  window.addEventListener('resize', init);
})();

// ==============================
// GLOBAL STATE
// ==============================
let bits = [0, 0, 0, 0, 0, 0, 0, 0];
const pows = [128, 64, 32, 16, 8, 4, 2, 1];
let quizLevel = 'easy', quizMode = 'b2d';
let qScore = 0, qTotal = 0, qStreak = 0, qAnswered = false;
let currentOp = 'AND';
let curQuizData = null;
let toastTimer;

// ==============================
// TAB SYSTEM
// ==============================
function showTab(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const tabs = ['t1', 't2', 't3', 't4', 't5'];
  const idx = tabs.indexOf(id);
  document.querySelectorAll('.tab-btn')[idx].classList.add('active');
}

// ==============================
// BIT SIMULATOR
// ==============================
function initBitSim() {
  const cont = document.getElementById('bit-container');
  cont.innerHTML = '';

  pows.forEach((p, i) => {
    // separator between high nibble and low nibble
    if (i === 4) {
      const sep = document.createElement('div');
      sep.className = 'bit-sep';
      cont.appendChild(sep);
    }

    const unit = document.createElement('div');
    unit.className = 'bit-unit';
    const expText = 7 - i;
    unit.innerHTML = `
      <div class="bit-pow">2<sup>${expText}</sup></div>
      <button class="bit-btn" id="b${i}" onmouseenter="dragToggle(${i})">0</button>
      <div class="bit-val-label">${p}</div>`;
    cont.appendChild(unit);
  });

  updateBitDisplay();
}

// Drag-to-toggle support
let isDragging = false;
document.addEventListener('mouseup', () => isDragging = false);

function dragToggle(i) {
  if (isDragging) toggleBit(i);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('bit-container').addEventListener('mousedown', e => {
    if (e.target.classList.contains('bit-btn')) {
      isDragging = true;
      const i = parseInt(e.target.id.replace('b', ''));
      toggleBit(i);
      e.preventDefault();
    }
  });
});

function toggleBit(i) {
  bits[i] = bits[i] ? 0 : 1;
  const btn = document.getElementById('b' + i);
  btn.textContent = bits[i];
  btn.className = 'bit-btn' + (bits[i] ? ' on' : '');
  updateBitDisplay();
}

function updateBitDisplay() {
  const dec = bits.reduce((s, b, i) => s + b * pows[i], 0);
  const binStr = bits.join('');
  document.getElementById('r-bin').textContent = binStr;
  document.getElementById('r-dec').textContent = dec;
  document.getElementById('r-hex').textContent = '0x' + dec.toString(16).toUpperCase().padStart(2, '0');
  document.getElementById('r-oct').textContent = '0o' + dec.toString(8).padStart(3, '0');

  const active = bits.map((b, i) => b ? pows[i] : null).filter(v => v !== null);
  if (active.length === 0) {
    document.getElementById('r-step').innerHTML = 'Semua bit OFF → nilai = <span class="hl">0</span>';
  } else {
    const expr = active.join(' + ');
    document.getElementById('r-step').innerHTML =
      `<span class="hl">${active.join('</span> + <span class="hl">')}</span> = <span class="hl2">${dec}</span>\n\nBiner: ${binStr} | Desimal: ${dec} | Hex: 0x${dec.toString(16).toUpperCase()}`;
  }
}

function setBitsFromVal(n) {
  n = Math.max(0, Math.min(255, n));
  const binStr = n.toString(2).padStart(8, '0');
  bits = binStr.split('').map(Number);
  bits.forEach((b, i) => {
    const btn = document.getElementById('b' + i);
    if (btn) {
      btn.textContent = b;
      btn.className = 'bit-btn' + (b ? ' on' : '');
    }
  });
  updateBitDisplay();
}

function resetBits() {
  setBitsFromVal(0);
  showToast('RESET — semua bit OFF');
}

function randomBits() {
  setBitsFromVal(Math.floor(Math.random() * 256));
  showToast('RANDOM bits generated!');
}

// ==============================
// DEC ↔ BIN CONVERTER
// ==============================
function d2bConvert() {
  const raw = document.getElementById('d2b-input').value;
  const n = parseInt(raw);

  if (raw === '' || isNaN(n) || n < 0 || n > 255) {
    document.getElementById('d2b-steps').innerHTML = 'Masukkan angka desimal antara 0 dan 255.';
    document.getElementById('conv2-results').style.display = 'none';
    return;
  }

  document.getElementById('b2d-input').value = '';
  const binStr = n.toString(2);
  const padded = binStr.padStart(8, '0');

  let steps = `<span class="hl">Metode Pembagian 2 (Baca sisa dari bawah ke atas):</span>\n\n`;
  let cur = n, rems = [];

  if (n === 0) {
    steps += '0 ÷ 2 = 0 sisa <span class="hl">0</span>';
  } else {
    while (cur > 0) {
      const rem = cur % 2;
      const q = Math.floor(cur / 2);
      steps += `${cur} ÷ 2 = ${q} sisa <span class="hl">${rem}</span>\n`;
      rems.unshift(rem);
      cur = q;
    }
    steps += `\n→ Baca sisa dari bawah: <span class="hl2">${rems.join('')}</span>\n`;
    steps += `→ Pad 8-bit: <span class="hl3">${padded}</span> = <span class="hl2">${n}</span>`;
  }

  document.getElementById('d2b-steps').innerHTML = steps;

  const r = document.getElementById('conv2-results');
  r.style.display = 'grid';
  r.innerHTML = `
    <div class="result-card"><div class="result-label">BINER</div><div class="result-value sm">${padded}</div></div>
    <div class="result-card"><div class="result-label">DESIMAL</div><div class="result-value">${n}</div></div>
    <div class="result-card"><div class="result-label">HEX</div><div class="result-value green">0x${n.toString(16).toUpperCase().padStart(2, '0')}</div></div>
    <div class="result-card"><div class="result-label">OCTAL</div><div class="result-value amber">0o${n.toString(8).padStart(3, '0')}</div></div>
  `;
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
  const n = parseInt(raw, 2);
  const padded = raw.padStart(8, '0');
  const powsLocal = [128, 64, 32, 16, 8, 4, 2, 1];
  let parts = [], sum = 0;

  padded.slice(-8).split('').forEach((b, i) => {
    if (b === '1') { parts.push(`<span class="hl">${powsLocal[i]}</span>`); sum += powsLocal[i]; }
  });

  let steps = `<span class="hl">Metode Nilai Tempat (Pangkat 2):</span>\n\n`;
  if (parts.length === 0) {
    steps += 'Semua bit 0 → nilai = <span class="hl">0</span>';
  } else {
    steps += `Bit aktif: ${parts.join(' + ')}\n= <span class="hl2">${sum}</span>`;
  }

  document.getElementById('d2b-steps').innerHTML = steps;

  const r = document.getElementById('conv2-results');
  r.style.display = 'grid';
  r.innerHTML = `
    <div class="result-card"><div class="result-label">BINER INPUT</div><div class="result-value sm">${padded}</div></div>
    <div class="result-card"><div class="result-label">DESIMAL</div><div class="result-value">${n}</div></div>
    <div class="result-card"><div class="result-label">HEX</div><div class="result-value green">0x${n.toString(16).toUpperCase().padStart(2, '0')}</div></div>
    <div class="result-card"><div class="result-label">OCTAL</div><div class="result-value amber">0o${n.toString(8)}</div></div>
  `;
  setBitsFromVal(n);
}

// ==============================
// BITWISE OPERATIONS
// ==============================
const opInfos = {
  AND: '<strong>AND</strong> — Output 1 hanya jika <strong>kedua</strong> input = 1. Dipakai untuk bit masking. Contoh: <code>1100 AND 1010 = 1000</code>',
  OR:  '<strong>OR</strong> — Output 1 jika <strong>salah satu atau kedua</strong> input = 1. Dipakai untuk set bit. Contoh: <code>1100 OR 1010 = 1110</code>',
  XOR: '<strong>XOR</strong> (Exclusive OR) — Output 1 jika input <strong>berbeda</strong>. Dipakai untuk toggle bit & enkripsi. Contoh: <code>1100 XOR 1010 = 0110</code>',
  NOT: '<strong>NOT</strong> — Flip <strong>semua bit</strong> (bitwise complement). Cuma butuh 1 input. Contoh: <code>NOT 10110011 = 01001100</code>',
  SHL: '<strong>SHIFT LEFT (SHL / &lt;&lt;)</strong> — Geser bit ke kiri, isi kanan dengan 0. Efeknya = kalikan dengan 2. Contoh: <code>00000101 &lt;&lt; 1 = 00001010</code> (5 × 2 = 10)',
  SHR: '<strong>SHIFT RIGHT (SHR / &gt;&gt;)</strong> — Geser bit ke kanan, buang bit terakhir. Efeknya = bagi dengan 2. Contoh: <code>00001010 &gt;&gt; 1 = 00000101</code> (10 ÷ 2 = 5)'
};

function setOp(op) {
  currentOp = op;
  document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('active'));
  const idx = ['AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR'].indexOf(op);
  document.querySelectorAll('.op-btn')[idx].classList.add('active');
  document.getElementById('op-info').innerHTML = opInfos[op];

  const bWrap = document.getElementById('op-b-wrap');
  bWrap.style.display = (op === 'NOT' || op === 'SHL' || op === 'SHR') ? 'none' : 'block';

  calcOp();
  renderTruthTable();
}

function validateBin(s) {
  return /^[01]{1,8}$/.test(s);
}

function calcOp() {
  const aRaw = document.getElementById('op-a').value.trim() || '00000000';
  const bRaw = document.getElementById('op-b').value.trim() || '00000000';

  if (!validateBin(aRaw)) {
    document.getElementById('op-display').innerHTML = '<div style="color:var(--red);font-family:var(--mono);font-size:13px">Input A harus biner 1-8 bit</div>';
    return;
  }
  if ((currentOp === 'AND' || currentOp === 'OR' || currentOp === 'XOR') && !validateBin(bRaw)) {
    document.getElementById('op-display').innerHTML = '<div style="color:var(--red);font-family:var(--mono);font-size:13px">Input B harus biner 1-8 bit</div>';
    return;
  }

  const a = parseInt(aRaw, 2);
  const b = parseInt(bRaw, 2);
  const aPad = aRaw.padStart(8, '0');
  const bPad = bRaw.padStart(8, '0');

  let result, opSym;
  switch (currentOp) {
    case 'AND': result = a & b;          opSym = 'AND'; break;
    case 'OR':  result = a | b;          opSym = 'OR';  break;
    case 'XOR': result = a ^ b;          opSym = 'XOR'; break;
    case 'NOT': result = (~a) & 0xFF;    opSym = 'NOT'; break;
    case 'SHL': result = (a << 1) & 0xFF; opSym = 'SHL'; break;
    case 'SHR': result = (a >> 1) & 0xFF; opSym = 'SHR'; break;
  }

  const resultBin = result.toString(2).padStart(8, '0');

  function colorBin(s) {
    return s.split('').map(b => b === '1'
      ? `<span class="bit-1">${b}</span>`
      : `<span class="bit-0">${b}</span>`
    ).join(' ');
  }

  let html = `<div class="op-row"><span class="op-label-col" style="font-size:12px">A</span><span class="op-val">${colorBin(aPad)}</span></div>`;
  if (currentOp === 'AND' || currentOp === 'OR' || currentOp === 'XOR') {
    html += `<div class="op-row"><span class="op-label-col" style="font-size:12px">B</span><span class="op-val">${colorBin(bPad)}</span></div>`;
  }
  html += `<div class="op-row"><span class="op-label-col" style="font-size:10px;color:var(--text3)">${opSym}</span><div class="op-line" style="flex:1"></div></div>`;
  html += `<div class="op-row"><span class="op-label-col" style="font-size:12px">=</span><span class="op-result">${colorBin(resultBin)}</span></div>`;
  html += `<div class="op-row" style="margin-top:12px"><span class="op-label-col" style="font-size:10px;color:var(--text3)">DEC</span>
    <span style="font-family:var(--mono);font-size:13px;color:var(--text2)">
      ${a} ${opSym} ${(currentOp === 'NOT' || currentOp === 'SHL' || currentOp === 'SHR') ? '' : b} = 
      <span style="color:var(--green)">${result}</span>
    </span></div>`;

  document.getElementById('op-display').innerHTML = html;

  let explain = '';
  if (currentOp === 'AND') explain = `Setiap posisi bit: 1 AND 1 = 1, semua kombinasi lain = 0\nA: ${aPad}\nB: ${bPad}\n= ${resultBin} (${result})`;
  else if (currentOp === 'OR')  explain = `Setiap posisi bit: 0 OR 0 = 0, semua kombinasi lain = 1\nA: ${aPad}\nB: ${bPad}\n= ${resultBin} (${result})`;
  else if (currentOp === 'XOR') explain = `Setiap posisi bit: sama = 0, beda = 1\nA: ${aPad}\nB: ${bPad}\n= ${resultBin} (${result})`;
  else if (currentOp === 'NOT') explain = `Flip semua bit: setiap 0 → 1, setiap 1 → 0\nA:   ${aPad}\nNOT: ${resultBin} (${result})`;
  else if (currentOp === 'SHL') explain = `Geser semua bit 1 posisi ke kiri, isi kanan dengan 0\nA:   ${aPad} (${a})\nSHL: ${resultBin} (${result}) = ${a} × 2 = ${a * 2}${result !== a * 2 ? ' (overflow!)' : ''}`;
  else if (currentOp === 'SHR') explain = `Geser semua bit 1 posisi ke kanan, buang bit paling kanan\nA:   ${aPad} (${a})\nSHR: ${resultBin} (${result}) = floor(${a} ÷ 2) = ${Math.floor(a / 2)}`;

  document.getElementById('op-explain').textContent = explain;
}

function renderTruthTable() {
  const container = document.getElementById('truth-wrap');
  if (currentOp === 'AND' || currentOp === 'OR' || currentOp === 'XOR') {
    container.innerHTML = `<table class="truth-table">
      <thead><tr><th>A</th><th>B</th><th>${currentOp} (A, B)</th></tr></thead>
      <tbody>
        ${[[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => {
          let r = currentOp === 'AND' ? a & b : currentOp === 'OR' ? a | b : a ^ b;
          return `<tr><td class="${a ? 'c1' : 'r0'}">${a}</td><td class="${b ? 'c1' : 'r0'}">${b}</td><td class="${r ? 'g1' : 'r0'}">${r}</td></tr>`;
        }).join('')}
      </tbody>
    </table>`;
  } else if (currentOp === 'NOT') {
    container.innerHTML = `<table class="truth-table">
      <thead><tr><th>A</th><th>NOT A</th></tr></thead>
      <tbody>
        <tr><td class="r0">0</td><td class="g1">1</td></tr>
        <tr><td class="c1">1</td><td class="r0">0</td></tr>
      </tbody>
    </table>`;
  } else {
    container.innerHTML = `<div class="step-box">Shift tidak memiliki tabel kebenaran konvensional.<br>Lihat visualisasi di atas untuk melihat efek bit shift.</div>`;
  }
}

// ==============================
// ASCII ENCODER
// ==============================
function encodeText() {
  const txt = document.getElementById('ascii-input').value;
  const out = document.getElementById('bin-text-output');
  if (!txt) {
    out.innerHTML = '—';
    document.getElementById('asc-chars').textContent = '0';
    document.getElementById('asc-bytes').textContent = '0';
    document.getElementById('asc-bits').textContent = '0';
    return;
  }
  let html = '';
  txt.split('').forEach(ch => {
    const code = ch.charCodeAt(0);
    const bin = code.toString(2).padStart(8, '0');
    html += `<span class="text-bin-char">${ch}</span><span class="text-bin-sep"> = </span><span class="text-bin-bits">${bin}</span><span class="text-bin-sep">  </span>`;
  });
  out.innerHTML = html;
  document.getElementById('asc-chars').textContent = txt.length;
  document.getElementById('asc-bytes').textContent = txt.length;
  document.getElementById('asc-bits').textContent = txt.length * 8;
}

function copyBinText() {
  const txt = document.getElementById('ascii-input').value;
  if (!txt) { showToast('Ketik teks dulu!'); return; }
  const bin = txt.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
  navigator.clipboard.writeText(bin)
    .then(() => showToast('Binary text copied!'))
    .catch(() => showToast('Copy gagal'));
}

function initAsciiTable() {
  const grid = document.getElementById('ascii-table');
  grid.innerHTML = '';
  for (let i = 32; i <= 126; i++) {
    const ch = String.fromCharCode(i);
    const bin = i.toString(2).padStart(8, '0');
    const cell = document.createElement('div');
    cell.className = 'ascii-cell';
    const safeChar = ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch;
    cell.innerHTML = `
      <div class="ascii-char">${safeChar}</div>
      <div class="ascii-dec">dec:${i} hex:${i.toString(16).toUpperCase()}</div>
      <div class="ascii-bin">${bin}</div>`;
    cell.onclick = () => {
      document.querySelectorAll('.ascii-cell').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      setBitsFromVal(i);
      showTab('t1');
      showToast(`'${safeChar}' = ${i} = ${bin}`, 'green');
    };
    grid.appendChild(cell);
  }
}

// ==============================
// QUIZ
// ==============================
function setQuizLevel(l) {
  quizLevel = l;
  ['easy', 'med', 'hard'].forEach(x => document.getElementById('lvl-' + x).classList.remove('active'));
  document.getElementById('lvl-' + l).classList.add('active');
  nextQuestion();
}

function setQuizMode(m) {
  quizMode = m;
  ['b2d', 'd2b', 'mix'].forEach(x => document.getElementById('mode-' + x).classList.remove('active'));
  document.getElementById('mode-' + m).classList.add('active');
  nextQuestion();
}

function getRandN() {
  if (quizLevel === 'easy') return Math.floor(Math.random() * 16);
  if (quizLevel === 'med')  return Math.floor(Math.random() * 64);
  return Math.floor(Math.random() * 256);
}

function nextQuestion() {
  qAnswered = false;
  document.getElementById('next-q-btn').style.display = 'none';
  document.getElementById('quiz-fb').className = 'quiz-feedback';

  const n = getRandN();
  const doB2D = quizMode === 'mix' ? Math.random() > 0.5 : quizMode === 'b2d';
  curQuizData = { n, type: doB2D ? 'b2d' : 'd2b' };
  const binStr = n.toString(2).padStart(8, '0');

  const qEl = document.getElementById('quiz-q');
  if (doB2D) {
    qEl.innerHTML = `Berapa nilai <strong>desimal</strong> dari bilangan biner ini?<span class="q-code">${binStr}</span>`;
  } else {
    qEl.innerHTML = `Angka desimal <strong>${n}</strong>, representasi binernya adalah?<span class="q-code" style="font-size:20px;letter-spacing:0.05em">${n}</span>`;
  }

  let choices = [];
  if (doB2D) {
    choices = [n];
    while (choices.length < 4) {
      let r = n + Math.floor(Math.random() * 30) - 15;
      r = Math.max(0, Math.min(255, r));
      if (!choices.includes(r)) choices.push(r);
    }
  } else {
    const correct = binStr;
    choices = [correct];
    while (choices.length < 4) {
      let r = n + Math.floor(Math.random() * 20) - 10;
      r = Math.max(0, Math.min(255, r));
      const rb = r.toString(2).padStart(8, '0');
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
  qAnswered = true;
  qTotal++;

  const { n, type } = curQuizData;
  const correct = type === 'b2d' ? n : n.toString(2).padStart(8, '0');
  const isRight = String(chosen) === String(correct);

  if (isRight) {
    qScore++;
    qStreak++;
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
    ? `BENAR! ${n} dalam biner = ${n.toString(2).padStart(8, '0')} | Desimal = ${n}`
    : `Jawaban benar: ${correct}`;
  fb.className = 'quiz-feedback show ' + (isRight ? 'ok' : 'no');

  document.getElementById('q-score').textContent = qScore;
  document.getElementById('q-total').textContent = qTotal;
  document.getElementById('streak-badge').textContent = `🔥 STREAK: ${qStreak}`;
  document.getElementById('next-q-btn').style.display = 'inline-block';
  document.getElementById('session-score').textContent = `SCORE: ${qScore}`;
  updateScoreUI();
}

function updateScoreUI() {
  const pct = qTotal > 0 ? Math.round(qScore / qTotal * 100) : 0;
  document.getElementById('score-bar').style.width = pct + '%';
  const circumference = 207.3;
  document.getElementById('ring-fill').style.strokeDashoffset = circumference - (circumference * pct / 100);
  document.getElementById('ring-pct').textContent = pct + '%';
}

function resetQuiz() {
  qScore = 0; qTotal = 0; qStreak = 0;
  document.getElementById('q-score').textContent = '0';
  document.getElementById('q-total').textContent = '0';
  document.getElementById('streak-badge').textContent = '🔥 STREAK: 0';
  document.getElementById('session-score').textContent = 'SCORE: 0';
  updateScoreUI();
  nextQuestion();
  showToast('SKOR DIRESET');
}

// ==============================
// CHEATSHEET & POWERS TABLE
// ==============================
function initCheatsheet() {
  // Powers grid
  const grid = document.getElementById('pow-grid');
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 16, 32].forEach(e => {
    const card = document.createElement('div');
    card.className = 'pow-card';
    card.innerHTML = `<div class="p-exp">2<sup>${e}</sup></div><div class="p-val">${Math.pow(2, e).toLocaleString()}</div>`;
    grid.appendChild(card);
  });

  // Reference table
  const notes = { 0: '(basis)', 8: '(1 byte)', 16: '(2 bytes)', 32: '(4 bytes)' };
  const table = document.getElementById('cheat-table');
  table.innerHTML = `<thead><tr><th>DESIMAL</th><th>BINER</th><th>HEX</th><th>KETERANGAN</th></tr></thead><tbody></tbody>`;
  const tbody = table.querySelector('tbody');

  for (let i = 0; i <= 31; i++) {
    const tr = document.createElement('tr');
    const note = notes[i] || '';
    tr.innerHTML = `
      <td class="td-dec">${i}</td>
      <td class="td-bin">${i.toString(2).padStart(8, '0')}</td>
      <td class="td-hex">${i.toString(16).toUpperCase().padStart(2, '0')}</td>
      <td class="td-note">${note}</td>`;
    tbody.appendChild(tr);
  }
}

// ==============================
// TOAST NOTIFICATION
// ==============================
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast', 2500);
}


initBitSim();
initAsciiTable();
initCheatsheet();
setOp('AND');
encodeText();
nextQuestion();
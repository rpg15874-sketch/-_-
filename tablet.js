import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { getDatabase, ref, onValue, update } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js';
import { firebaseConfig } from './firebase-config.js';

const sessionId = new URLSearchParams(location.search).get('s') || '';
const canvas = document.getElementById('signaturePad');
const context = canvas.getContext('2d');
const signerSelect = document.getElementById('signer');
const signerName = document.getElementById('signerName');
const submitButton = document.getElementById('submitSignature');
const confirmSign = document.getElementById('confirmSign');
const placeholder = document.getElementById('canvasPlaceholder');
const resultMessage = document.getElementById('resultMessage');
const connectionState = document.getElementById('connectionState');
let drawing = false;
let hasInk = false;
let currentFields = {};
let signatures = {};
let db;

function renderContractPreview() {
  if (!window.renderContractHtml) return;
  const responsive = '.page{width:100%!important;min-height:0!important;padding:13px!important;margin:0 0 10px!important;page-break-after:auto!important}.page:last-child{page-break-after:auto!important}body{font-size:9pt!important}.footer{display:none!important}h1{font-size:17pt!important}h2{font-size:13pt!important}table{font-size:8pt!important}th,td{padding:5px!important}';
  document.getElementById('contractPreview').srcdoc = window.renderContractHtml(currentFields, signatures).replace('</style>', `${responsive}</style>`);
}

function signerField() {
  return signerSelect.value === 'landlord' ? 'landlordName' : signerSelect.value === 'tenant' ? 'tenantName' : 'brokerName';
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const saved = hasInk ? canvas.toDataURL('image/png') : null;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.lineWidth = 2.2;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#172533';
  context.fillStyle = '#fff';
  context.fillRect(0, 0, rect.width, rect.height);
  if (saved) {
    const image = new Image();
    image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height);
    image.src = saved;
  }
}

function drawNameDefaults() {
  document.getElementById('propertyAddress').textContent = currentFields.propertyAddress || '주택임대차 계약서';
  document.getElementById('landlordName').textContent = currentFields.landlordName || '—';
  document.getElementById('tenantName').textContent = currentFields.tenantName || '—';
  if (document.activeElement !== signerName) signerName.value = currentFields[signerField()] || '';
  const existing = signatures[signerSelect.value];
  resultMessage.textContent = existing?.dataUrl ? '이미 서명이 등록되어 있습니다. 다시 제출하면 새 서명으로 바뀝니다.' : '';
  renderContractPreview();
  updateSubmitState();
}

function updateSubmitState() {
  submitButton.disabled = !(hasInk && confirmSign.checked && signerName.value.trim());
}

function point(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function clearCanvas() {
  const rect = canvas.getBoundingClientRect();
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#fff';
  context.fillRect(0, 0, rect.width, rect.height);
  hasInk = false;
  placeholder.classList.remove('hidden');
}

canvas.addEventListener('pointerdown', event => {
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  drawing = true;
  placeholder.classList.add('hidden');
  const p = point(event);
  context.beginPath(); context.moveTo(p.x, p.y); context.lineTo(p.x + 0.2, p.y + 0.2); context.stroke();
  hasInk = true; updateSubmitState();
});
canvas.addEventListener('pointermove', event => {
  if (!drawing) return;
  event.preventDefault();
  const p = point(event); context.lineTo(p.x, p.y); context.stroke();
});
const stopDrawing = () => { drawing = false; context.beginPath(); };
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointercancel', stopDrawing);
canvas.addEventListener('lostpointercapture', stopDrawing);

document.getElementById('clearSignature').addEventListener('click', () => {
  clearCanvas(); resultMessage.textContent = ''; updateSubmitState();
});
signerSelect.addEventListener('change', drawNameDefaults);
signerName.addEventListener('input', updateSubmitState);
confirmSign.addEventListener('change', updateSubmitState);

async function start() {
  try {
    if (!sessionId || !/^[a-f0-9]{64}$/.test(sessionId)) throw new Error('QR 코드나 PC의 계약 연결 링크로 접속해 주세요.');
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('YOUR_') || firebaseConfig.databaseURL.includes('YOUR_PROJECT_ID')) {
      throw new Error('사이트 관리자가 Firebase 설정을 완료해야 계약 정보를 불러올 수 있습니다.');
    }
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    await signInAnonymously(auth);
    db = getDatabase(app);
    onValue(ref(db, `sessions/${sessionId}`), snapshot => {
      if (!snapshot.exists()) { connectionState.textContent = '계약 정보를 찾을 수 없습니다.'; return; }
      const session = snapshot.val();
      currentFields = session.fields || {};
      signatures = session.signatures || {};
      connectionState.textContent = '실시간 계약 연결됨';
      connectionState.classList.add('good');
      drawNameDefaults();
    }, error => {
      connectionState.textContent = `연결 오류: ${error.message}`;
      connectionState.classList.remove('good');
    });
  } catch (error) {
    connectionState.textContent = error.message;
    resultMessage.textContent = error.message;
    resultMessage.classList.add('error');
  }
}

submitButton.addEventListener('click', async () => {
  if (submitButton.disabled || !db) return;
  submitButton.disabled = true;
  submitButton.textContent = '전송 중…';
  resultMessage.classList.remove('error');
  resultMessage.textContent = '';
  try {
    const signature = {
      signerName: signerName.value.trim(),
      dataUrl: canvas.toDataURL('image/png'),
      signedAt: new Date().toISOString()
    };
    await update(ref(db, `sessions/${sessionId}/signatures`), { [signerSelect.value]: signature });
    signatures[signerSelect.value] = signature;
    resultMessage.textContent = '서명을 제출했습니다. 계약 작성 화면에 바로 반영됩니다.';
    confirmSign.checked = false;
    clearCanvas();
  } catch (error) {
    resultMessage.textContent = `서명을 전송하지 못했습니다: ${error.message}`;
    resultMessage.classList.add('error');
  } finally {
    submitButton.textContent = '서명 제출';
    updateSubmitState();
  }
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
start();

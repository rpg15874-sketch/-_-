import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { getDatabase, ref, set, update, onValue } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js';
import { firebaseConfig, googleClientId } from './firebase-config.js';

const form = document.getElementById('contractForm');
const saveState = document.getElementById('saveState');
const qrCode = document.getElementById('qrCode');
const tabletLink = document.getElementById('tabletLink');
const tabletStatus = document.getElementById('tabletStatus');
const signatureStatus = document.getElementById('signatureStatus');
const previewFrame = document.getElementById('previewFrame');
const cloudResult = document.getElementById('cloudResult');
const names = { landlord: '임대인', tenant: '임차인', broker: '개업공인중개사' };
let db;
let sessionId = '';
let sessionRef;
let unsubscribeSession;
let signatures = {};
let lastFieldsJson = '';
let saveTimer;
let previewTimer;
let driveAccessToken = '';
let driveTokenExpiresAt = 0;
let pendingTokenRequest;
let tokenClient;

function setSaveMessage(message, state = '') {
  saveState.textContent = message;
  saveState.className = `save-state ${state}`.trim();
}

function collectFields() {
  const fields = {};
  for (const element of form.querySelectorAll('[data-field]')) fields[element.dataset.field] = element.value;
  fields.contractCode = sessionId.slice(0, 8).toUpperCase();
  return fields;
}

function fillFields(fields = {}) {
  for (const element of form.querySelectorAll('[data-field]')) {
    if (element === document.activeElement) continue;
    const value = fields[element.dataset.field] ?? '';
    if (element.value !== value) element.value = value;
  }
}

function preview() {
  if (window.renderContractHtml && sessionId) previewFrame.srcdoc = window.renderContractHtml(collectFields(), signatures);
}

function queuePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(preview, 180);
}

function tabletUrl() {
  const url = new URL('tablet.html', location.href);
  url.searchParams.set('s', sessionId);
  return url.href;
}

function renderQrAndLink() {
  const url = tabletUrl();
  tabletLink.href = url;
  tabletLink.textContent = url;
  qrCode.replaceChildren();
  if (window.QRCode) new QRCode(qrCode, { text: url, width: 192, height: 192, correctLevel: QRCode.CorrectLevel.M });
  else qrCode.textContent = 'QR 코드 라이브러리를 불러오지 못했습니다. 아래 링크를 사용하세요.';
}

function renderSignatures() {
  const signedCount = Object.keys(signatures).filter(key => signatures[key]?.dataUrl).length;
  tabletStatus.textContent = signedCount ? `${signedCount}명 서명 완료` : '서명 대기 중';
  tabletStatus.classList.toggle('active', signedCount > 0);
  signatureStatus.replaceChildren();
  for (const [key, label] of Object.entries(names)) {
    const item = signatures[key];
    const row = document.createElement('div');
    row.className = `signature-item ${item?.dataUrl ? 'signed' : ''}`;
    const check = document.createElement('span'); check.className = 'check'; check.textContent = item?.dataUrl ? '✓' : '';
    const who = document.createElement('span'); who.textContent = item?.signerName ? `${label} · ${item.signerName}` : label;
    row.append(check, who);
    if (item?.signedAt) {
      const time = document.createElement('span'); time.className = 'time';
      time.textContent = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.signedAt));
      row.append(time);
      const download = document.createElement('a'); download.className = 'time';
      download.href = item.dataUrl; download.download = `서명_${label}_${item.signerName || ''}.png`; download.textContent = 'PNG';
      download.title = `${label} 서명 PNG 다운로드`; row.append(download);
    }
    signatureStatus.append(row);
  }
  queuePreview();
}

function applySession(session) {
  const fields = session?.fields || {};
  const json = JSON.stringify(fields);
  if (json !== lastFieldsJson) {
    lastFieldsJson = json;
    fillFields(fields);
    setSaveMessage('실시간으로 저장됨', 'good');
  }
  const nextSignatures = session?.signatures || {};
  if (JSON.stringify(nextSignatures) !== JSON.stringify(signatures)) {
    const hadSignature = Object.keys(signatures).length;
    signatures = nextSignatures;
    renderSignatures();
    if (Object.keys(signatures).length > hadSignature) setSaveMessage('태블릿 서명이 반영됨', 'good');
  }
  queuePreview();
}

async function createSession() {
  unsubscribeSession?.();
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  sessionId = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  sessionRef = ref(db, `sessions/${sessionId}`);
  signatures = {};
  lastFieldsJson = '';
  await set(sessionRef, { fields: {}, signatures: {}, createdAt: Date.now() });
  history.replaceState(null, '', `${location.pathname}?s=${encodeURIComponent(sessionId)}`);
  renderQrAndLink();
  renderSignatures();
  preview();
  watchSession();
}

function queueSave() {
  clearTimeout(saveTimer);
  setSaveMessage('저장 중…');
  queuePreview();
  saveTimer = setTimeout(async () => {
    if (!sessionRef) return;
    try {
      const fields = collectFields();
      lastFieldsJson = JSON.stringify(fields);
      await update(sessionRef, { fields });
      setSaveMessage('실시간으로 저장됨', 'good');
    } catch (error) {
      setSaveMessage(`저장 실패: ${error.message}`, 'bad');
    }
  }, 450);
}

async function connectSession() {
  const params = new URLSearchParams(location.search);
  const requestedId = params.get('s');
  if (requestedId && !/^[a-f0-9]{64}$/.test(requestedId)) throw new Error('계약 연결 주소가 올바르지 않습니다.');
  sessionId = requestedId || '';
  if (!sessionId) await createSession();
  else {
    sessionRef = ref(db, `sessions/${sessionId}`);
    renderQrAndLink();
    watchSession();
  }
}

function watchSession() {
  unsubscribeSession?.();
  unsubscribeSession = onValue(sessionRef, snapshot => {
    if (!snapshot.exists()) {
      setSaveMessage('계약 정보를 찾을 수 없습니다.', 'bad');
      return;
    }
    applySession(snapshot.val());
  }, error => setSaveMessage(`실시간 연결 오류: ${error.message}`, 'bad'));
}

function driveConfigured() {
  return googleClientId && !googleClientId.startsWith('YOUR_');
}

function setDriveMessage(message, state = '') {
  const status = document.getElementById('driveState');
  status.textContent = message;
  status.className = `provider-state ${state}`.trim();
}

function requestDriveToken() {
  if (!driveConfigured()) throw new Error('firebase-config.js에 Google OAuth 웹 클라이언트 ID를 입력하세요.');
  if (!window.google?.accounts?.oauth2) throw new Error('Google 로그인 모듈이 아직 준비되지 않았습니다. 잠시 뒤 다시 눌러 주세요.');
  return new Promise((resolve, reject) => {
    pendingTokenRequest = { resolve, reject };
    if (!tokenClient) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: response => {
          const pending = pendingTokenRequest;
          pendingTokenRequest = null;
          if (response.error) { pending?.reject(new Error(response.error_description || response.error)); return; }
          driveAccessToken = response.access_token;
          driveTokenExpiresAt = Date.now() + (Number(response.expires_in || 3600) - 60) * 1000;
          setDriveMessage('Google Drive 연결됨', 'good');
          document.getElementById('connectDrive').textContent = 'Google Drive 다시 연결';
          pending?.resolve(driveAccessToken);
        },
        error_callback: error => {
          const pending = pendingTokenRequest;
          pendingTokenRequest = null;
          pending?.reject(new Error(error.message || 'Google 계정 연결을 완료하지 못했습니다.'));
        }
      });
    }
    tokenClient.requestAccessToken({ prompt: driveAccessToken ? '' : 'consent' });
  });
}

async function driveFetch(path, options = {}) {
  const url = path.startsWith('https://') ? path : `https://www.googleapis.com/drive/v3/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${driveAccessToken}`, ...(options.headers || {}) }
  });
  if (!response.ok) {
    let message = `Google Drive 오류 (${response.status})`;
    try { message = (await response.json()).error?.message || message; } catch { /* Keep status message. */ }
    throw new Error(message);
  }
  return response.json();
}

async function ensureDriveFolder() {
  const query = "name = '주택임대차 계약서' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  const result = await driveFetch(`files?q=${encodeURIComponent(query)}&spaces=drive&pageSize=100&fields=files(id,name)`);
  if (result.files?.length) return result.files[0].id;
  const folder = await driveFetch('files?fields=id,name', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '주택임대차 계약서', mimeType: 'application/vnd.google-apps.folder' })
  });
  return folder.id;
}

function dataUrlToBlob(dataUrl) {
  const [header, content] = dataUrl.split(',');
  const mime = header.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream';
  const raw = atob(content);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
  return new Blob([bytes], { type: mime });
}

async function uploadDriveFile(folderId, name, blob, mimeType) {
  const boundary = `lease_${crypto.randomUUID().replaceAll('-', '')}`;
  const metadata = JSON.stringify({ name, mimeType, parents: [folderId] });
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`, blob, `\r\n--${boundary}--`
  ], { type: `multipart/related; boundary=${boundary}` });
  return driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST', headers: { 'Content-Type': body.type }, body
  });
}

function safeName(value) {
  return String(value || '').replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 60) || '미입력';
}

async function makePdfBlob() {
  if (!window.html2pdf) throw new Error('PDF 모듈을 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시 시도하세요.');
  await new Promise(resolve => {
    previewFrame.addEventListener('load', resolve, { once: true });
    previewFrame.srcdoc = window.renderContractHtml(collectFields(), signatures);
  });
  const element = previewFrame.contentDocument.body;
  return html2pdf().set({
    margin: 0,
    filename: '주택임대차_계약서.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  }).from(element).outputPdf('blob');
}

function showDriveFiles(files) {
  cloudResult.replaceChildren();
  const heading = document.createElement('strong'); heading.textContent = `${files.length}개 파일을 Drive에 저장했습니다.`;
  cloudResult.append(heading);
  for (const file of files) {
    const link = document.createElement('a'); link.href = file.webViewLink || `https://drive.google.com/open?id=${encodeURIComponent(file.id)}`;
    link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = file.name;
    cloudResult.append(link);
  }
}

async function saveToDrive() {
  const button = document.getElementById('saveCloud');
  cloudResult.replaceChildren();
  button.disabled = true;
  button.textContent = '파일 저장 중…';
  try {
    const accessToken = driveAccessToken && Date.now() < driveTokenExpiresAt ? driveAccessToken : await requestDriveToken();
    driveAccessToken = accessToken;
    clearTimeout(saveTimer);
    const fields = collectFields();
    await update(sessionRef, { fields });
    lastFieldsJson = JSON.stringify(fields);
    setSaveMessage('계약 정보 동기화 완료', 'good');
    const [folderId, pdf] = await Promise.all([ensureDriveFolder(), makePdfBlob()]);
    const address = safeName(fields.propertyAddress);
    const stamp = new Date().toISOString().slice(0, 10);
    const files = [await uploadDriveFile(folderId, `계약서_${address}_${stamp}.pdf`, pdf, 'application/pdf')];
    for (const [key, label] of Object.entries(names)) {
      const signature = signatures[key];
      if (signature?.dataUrl) {
        const file = await uploadDriveFile(folderId, `서명_${label}_${safeName(signature.signerName)}_${stamp}.png`, dataUrlToBlob(signature.dataUrl), 'image/png');
        files.push(file);
      }
    }
    showDriveFiles(files);
    setDriveMessage('Drive 저장 완료', 'good');
    setSaveMessage('계약서와 서명이 Drive에 저장됨', 'good');
  } catch (error) {
    const message = document.createElement('span'); message.textContent = error.message; cloudResult.append(message);
    setDriveMessage(error.message, 'bad');
    setSaveMessage('Drive 저장 실패', 'bad');
  } finally {
    button.disabled = false;
    button.textContent = 'PDF와 서명 PNG를 Drive에 저장';
  }
}

form.addEventListener('input', queueSave);
form.addEventListener('change', queueSave);
document.getElementById('refreshPreview').addEventListener('click', preview);
document.getElementById('connectDrive').addEventListener('click', async () => {
  try { await requestDriveToken(); }
  catch (error) { setDriveMessage(error.message, 'bad'); }
});
document.getElementById('saveCloud').addEventListener('click', saveToDrive);
document.getElementById('downloadPdf').addEventListener('click', async event => {
  event.preventDefault();
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = 'PDF 만드는 중…';
  try {
    clearTimeout(saveTimer);
    await update(sessionRef, { fields: collectFields() });
    const blob = await makePdfBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `주택임대차_계약서_${safeName(collectFields().propertyAddress)}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (error) { setSaveMessage(`PDF 생성 실패: ${error.message}`, 'bad'); }
  finally { button.disabled = false; button.textContent = '계약서 PDF 다운로드'; }
});
document.getElementById('newContract').addEventListener('click', async () => {
  if (!confirm('새 계약서를 시작할까요? 현재 계약은 Firebase에 저장되어 있습니다.')) return;
  clearTimeout(saveTimer);
  form.reset();
  cloudResult.replaceChildren();
  try { await createSession(); setSaveMessage('새 계약 준비 완료', 'good'); }
  catch (error) { setSaveMessage(error.message, 'bad'); }
});

async function start() {
  try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('YOUR_') || firebaseConfig.databaseURL.includes('YOUR_PROJECT_ID')) {
      throw new Error('firebase-config.js에 Firebase 웹 앱 설정을 입력한 뒤 GitHub Pages를 다시 배포하세요.');
    }
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    db = getDatabase(app);
    await signInAnonymously(auth);
    await connectSession();
    if (!driveConfigured()) setDriveMessage('Drive 저장을 사용하려면 firebase-config.js에 Google OAuth 클라이언트 ID를 입력하세요.');
  } catch (error) {
    setSaveMessage(error.message || '사이트를 초기화하지 못했습니다.', 'bad');
  }
}

start();

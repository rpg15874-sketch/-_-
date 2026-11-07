(function (root) {
  'use strict';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const text = (fields, key, fallback = '') => {
    const value = fields[key];
    return value === undefined || value === null || value === '' ? fallback : escapeHtml(value);
  };
  const mark = (fields, key, expected) => fields[key] === expected ? '☑' : '□';
  const signature = (signatures, who, label) => {
    const item = signatures?.[who];
    if (!item?.dataUrl) return `<div class="sign-image"></div><span class="sign-caption">${label}</span>`;
    return `<div class="sign-image"><img src="${escapeHtml(item.dataUrl)}" alt="${label} 서명"></div><span class="sign-caption">${escapeHtml(item.signerName || label)} · ${label}</span>`;
  };
  const blank = '<span class="blank">　　　　　　　　　</span>';

  function renderContractHtml(fields = {}, signatures = {}) {
    const propertyRows = [
      ['소재지 (도로명주소)', text(fields, 'propertyAddress', blank)],
      ['토지 지목 / 면적', `${text(fields, 'landType', blank)} / ${text(fields, 'landArea', blank)} ㎡`],
      ['건물 구조·용도 / 면적', `${text(fields, 'buildingStructure', blank)} / ${text(fields, 'buildingArea', blank)} ㎡`],
      ['임차할 부분 / 면적', `${text(fields, 'rentalPart', blank)} / ${text(fields, 'rentalArea', blank)} ㎡`]
    ].map(([key, value]) => `<tr><th>${key}</th><td>${value}</td></tr>`).join('');

    const specialLines = text(fields, 'specialTerms', '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const specialText = `<p>• 주택을 인도받은 임차인은 ${text(fields, 'moveInDate', '____년 __월 __일')}까지 주민등록(전입신고)과 주택임대차계약서상 확정일자를 받기로 하고, 임대인은 위 약정일자의 다음날까지 임차주택에 저당권 등 담보권을 설정할 수 없다.</p><p>• 임대인이 위 특약에 위반하여 임차주택에 저당권 등 담보권을 설정한 경우에는 임차인은 임대차계약을 해제 또는 해지할 수 있다. 이 경우 임대인은 임차인에게 위 특약 위반으로 인한 손해를 배상하여야 한다.</p><p>• 임대차계약을 체결한 임차인은 계약 체결 시를 기준으로 임대인이 사전에 고지하지 않은 선순위 임대차 정보가 있거나 미납·체납 국세·지방세가 ${text(fields, 'taxLimit', '_______')}원을 초과하는 것을 확인한 경우, 임대차기간이 시작하는 날까지 제5조에도 불구하고 계약금 등의 명목으로 임대인에게 교부한 금전 기타 물건을 포기하지 않고 계약을 해제할 수 있다.</p>${specialLines.map(line => `<p>• ${line}</p>`).join('')}`;

    const appendix = `
      <section class="page appendix">
        <h2>별지 1 · 법의 보호를 받기 위한 중요사항! 반드시 확인하세요</h2>
        <h3>대항력 및 우선변제권 확보</h3>
        <p>① 임차인이 주택의 인도와 주민등록을 마친 때에는 그 다음날부터 제3자에게 임차권을 주장할 수 있고, 계약서에 확정일자까지 받으면 후순위권리자나 그 밖의 채권자에 우선하여 변제받을 수 있으며, 주택의 점유와 주민등록은 임대차 기간 중 계속 유지하고 있어야 합니다.</p>
        <p>② 등기사항증명서, 미납국세·지방세, 다가구주택 확정일자 현황 등을 반드시 확인하여 선순위 권리자 및 금액을 확인하고 계약 체결 여부를 결정하여야 보증금을 지킬 수 있습니다. 계약을 체결할 때 임대인은 납세증명서 및 확정일자 부여일, 차임 및 보증금 등 정보를 임차인에게 제시하여야 합니다.</p>
        <p>※ 임차인은 임대인의 동의를 받아 미납국세·지방세는 관할 세무서에서, 확정일자 현황은 관할 주민센터·등기소에서 확인할 수 있습니다. 다만, 관계 법령의 요건을 충족하는 임차인은 임대차계약일부터 임대차기간 개시일까지 임대인의 동의 없이도 미납국세·지방세를 열람할 수 있습니다.</p>
        <h3>임대차 신고의무 및 확정일자 부여 의제</h3>
        <p>① 수도권 전역, 광역시, 세종시 및 도의 시 지역에서 보증금 6천만원 또는 월차임 30만원을 초과하여 주택임대차계약을 체결한 경우(금액 변동이 있는 재계약·갱신계약 포함), 임대인과 임차인은 계약체결일로부터 30일 이내에 시·군·구청에 해당 계약을 공동으로 신고하여야 합니다. 계약서를 제출하는 경우 단독신고가 가능합니다.</p>
        <p>② 주택임대차계약서를 제출하고 임대차 신고의 접수를 완료한 경우, 임대차 신고필증상 접수완료일에 확정일자가 부여된 것으로 간주되므로 별도로 확정일자 부여를 신청할 필요가 없습니다.</p>
        <h3>차임증액청구</h3>
        <p>계약기간 중이나 임차인의 계약갱신요구권 행사로 인한 갱신 시 차임·보증금을 증액하는 경우에는 기존 차임·보증금의 5%를 초과하여 증액하지 못하고, 계약체결 또는 약정한 차임 등의 증액이 있은 후 1년 이내에는 하지 못합니다.</p>
        <h3>묵시적 갱신 등</h3>
        <p>① 임대인은 임대차기간이 끝나기 6개월부터 2개월 전까지, 임차인은 2개월 전까지 각 상대방에게 계약을 종료하겠다거나 조건을 변경하여 재계약을 하겠다는 취지의 통지를 하지 않으면 종전 임대차와 동일한 조건으로 자동 갱신됩니다. 기존 규정은 1개월이고, 2020년 12월 10일 이후 최초로 체결되거나 갱신된 계약의 경우 2개월이 적용됩니다.</p>
        <p>② 묵시적으로 갱신된 임대차의 존속기간은 2년입니다. 이 경우 임차인은 언제든지 계약을 해지할 수 있지만, 임대인은 계약서 제7조의 사유 또는 임차인과의 합의가 있어야 계약을 해지할 수 있습니다.</p>
        <h3>계약갱신요구 등</h3>
        <p>① 임차인이 임대차기간이 만료되기 6개월 전부터 2개월 전까지 계약갱신을 요구하면 임대인은 정당한 사유 없이 거절하지 못합니다. 갱신거절 시 별지 2의 계약갱신 거절통지서 양식을 활용할 수 있습니다.</p>
        <p>② 임차인은 계약갱신요구권을 1회에 한하여 행사할 수 있고, 이 경우 갱신되는 임대차의 존속기간은 2년이며 나머지 조건은 전 임대차와 동일한 조건으로 다시 계약된 것으로 봅니다. 다만 차임과 보증금의 증액은 청구 당시의 차임 또는 보증금 액수의 100분의 5를 초과하지 않는 범위에서만 가능합니다.</p>
        <p>③ 묵시적 갱신이나 합의에 의한 재계약의 경우 임차인이 갱신요구권을 사용한 것으로 볼 수 없으므로, 임차인은 주택임대차보호법에 따라 임대기간 중 1회로 한정되어 인정되는 갱신요구권을 차후에 사용할 수 있습니다.</p>
        <h3>보증금액 증액 시 확정일자 날인</h3>
        <p>계약기간 중 보증금을 증액하거나, 재계약 또는 계약갱신 과정에서 보증금을 증액한 경우에는 증액된 보증금액에 대한 우선변제권을 확보하기 위하여 반드시 다시 확정일자를 받아야 합니다.</p>
      </section>`;

    const renewalNotice = fields.includeRenewalNotice === 'yes' ? `
      <section class="page appendix renewal-notice">
        <h2>계약갱신 거절통지서</h2>
        <table class="compact"><tr><th>임대인</th><td>성명: ${text(fields,'landlordName',blank)}　주소: ${text(fields,'landlordAddress',blank)}　연락처: ${text(fields,'landlordPhone',blank)}</td></tr><tr><th>임차인</th><td>성명: ${text(fields,'tenantName',blank)}　주소: ${text(fields,'tenantAddress',blank)}　연락처: ${text(fields,'tenantPhone',blank)}</td></tr><tr><th>임차목적물 주소</th><td>${text(fields,'propertyAddress',blank)}</td></tr><tr><th>임대차계약 기간</th><td>${text(fields,'handoverDate',blank)} ~ ${text(fields,'leaseEndDate',blank)}</td></tr></table>
        <p>임대인(${text(fields,'landlordName',blank)})은 임차인(${text(fields,'tenantName',blank)})으로부터 ${text(fields,'renewalRequestDate',blank)} 주택임대차계약의 갱신을 요구받았으나, 아래와 같은 법률상 사유로 위 임차인에게 갱신요구를 거절한다는 의사를 통지합니다.</p>
        <h3>계약갱신거절 사유 (주택임대차보호법 제6조의3 제1항 각 호)</h3>
        <p>${mark(fields,'renewalReason','1')} 1. 임차인이 2기의 차임액에 해당하는 금액에 이르도록 차임을 연체한 사실이 있는 경우</p>
        <p>${mark(fields,'renewalReason','2')} 2. 임차인이 거짓이나 그 밖의 부정한 방법으로 임차한 경우</p>
        <p>${mark(fields,'renewalReason','3')} 3. 서로 합의하여 임대인이 임차인에게 상당한 보상을 제공한 경우 (내용: ${text(fields,'renewalCompensation',blank)})</p>
        <p>${mark(fields,'renewalReason','4')} 4. 임차인이 임대인의 동의 없이 목적 주택의 전부 또는 일부를 전대한 경우</p>
        <p>${mark(fields,'renewalReason','5')} 5. 임차인이 임차한 주택의 전부 또는 일부를 고의나 중대한 과실로 파손한 경우</p>
        <p>${mark(fields,'renewalReason','6')} 6. 임차한 주택의 전부 또는 일부가 멸실되어 임대차의 목적을 달성하지 못할 경우</p>
        <p>${mark(fields,'renewalReason','7-1')} 7-1. 공사시기 및 소요기간 등을 포함한 철거 또는 재건축 계획을 구체적으로 고지하고 그 계획에 따르는 경우</p>
        <p>${mark(fields,'renewalReason','7-2')} 7-2. 건물이 노후·훼손 또는 일부 멸실되는 등 안전사고의 우려가 있는 경우</p>
        <p>${mark(fields,'renewalReason','7-3')} 7-3. 다른 법령에 따라 철거 또는 재건축이 이루어지는 경우</p>
        <p>${mark(fields,'renewalReason','8')} 8. 임대인 또는 임대인의 직계존비속이 목적 주택에 실제 거주하려는 경우 (실거주자: ${text(fields,'renewalResidentName',blank)}　관계: ${text(fields,'renewalResidentRelation',blank)})</p>
        <p>${mark(fields,'renewalReason','9')} 9. 그 밖에 임차인이 임차인으로서의 의무를 현저히 위반하거나 임대차를 계속하기 어려운 중대한 사유가 있는 경우</p>
        <p><strong>구체적 사정</strong><br>${text(fields,'renewalReasonDetails',blank)}</p>
        <p>작성일자: ${text(fields,'renewalNoticeDate',blank)}</p>
        <div class="signature-box"><strong>임대인</strong>${signature(signatures,'landlord','임대인')}</div>
        <p class="small-note">선택한 갱신거절 사유를 소명할 수 있는 문서 등 자료가 있는 경우 이 통지서에 첨부하여 임차인에게 전달하세요. 거절통지의 효력은 작성 및 발송 후 임차인에게 통지가 도달한 때 발생합니다.</p>
      </section>` : '';

    return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>주택임대차 표준계약서</title><style>
      @page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;color:#111;font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif;font-size:10.3pt;line-height:1.48}.page{width:210mm;min-height:297mm;padding:15mm 16mm 16mm;page-break-after:always;position:relative}.page:last-child{page-break-after:auto}h1{text-align:center;font-size:22pt;letter-spacing:.12em;margin:0 0 5mm}h2{font-size:15pt;text-align:center;margin:0 0 6mm}h3{font-size:11.3pt;margin:4mm 0 1.5mm}p{margin:1.5mm 0}.intro{text-align:center;margin-bottom:5mm}.section-title{font-size:12pt;font-weight:700;border-bottom:1.4px solid #222;padding:1.5mm 0;margin:4mm 0 2mm}.section-title:first-of-type{margin-top:0}table{width:100%;border-collapse:collapse;margin:2mm 0 4mm}th,td{border:1px solid #333;padding:2mm 2.2mm;vertical-align:middle}th{background:#f1f3f5;text-align:left;width:29%}.compact th,.compact td{padding:1.4mm 1.8mm}.terms p{margin:1.8mm 0}.terms{font-size:9.7pt}.callout{border:1px solid #777;background:#f7f7f7;padding:3mm}.small-note{font-size:8.5pt;color:#444;margin-top:5mm}.blank{color:#555;white-space:pre}.checks{line-height:1.7}.signature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin:4mm 0}.signature-box{border:1px solid #333;min-height:31mm;padding:2mm;text-align:center}.sign-image{height:18mm;display:flex;align-items:center;justify-content:center}.sign-image img{max-width:95%;max-height:17mm;object-fit:contain}.sign-caption{font-size:8.5pt}.signature-box strong{display:block;margin-bottom:1mm}.signatures td{height:28mm}.totals{font-size:10pt}.footer{position:absolute;bottom:8mm;left:0;right:0;text-align:center;font-size:8pt;color:#555}.appendix{font-size:9.4pt}.appendix h3{border-bottom:1px solid #aaa;padding-bottom:1mm}.signer-name{font-size:10pt;font-weight:700}
      </style></head><body>
      <section class="page">
        <h1>주택임대차 표준계약서</h1>
        <p class="intro">임대인(이름 또는 법인명 기재)과 임차인은 아래와 같이 임대차 계약을 체결한다.</p>
        <div class="section-title">임차주택의 표시</div>
        <table class="compact"><tr><th>차임 유형</th><td>${mark(fields,'rentType','depositMonthly')} 보증금 있는 월세　${mark(fields,'rentType','jeonse')} 전세　${mark(fields,'rentType','monthly')} 월세</td></tr>${propertyRows}</table>
        <table class="compact"><tr><th>계약 종류</th><td class="checks">${mark(fields,'contractType','new')} 신규 계약　${mark(fields,'contractType','renewal')} 합의에 의한 재계약　${mark(fields,'contractType','renewalRight')} 갱신요구권 행사에 의한 갱신계약<br>갱신 전 기간: ${text(fields,'previousStart',blank)} ~ ${text(fields,'previousEnd',blank)}　보증금: ${text(fields,'previousDeposit',blank)}원　차임: 월 ${text(fields,'previousRent',blank)}원</td></tr><tr><th>미납 국세·지방세</th><td>${mark(fields,'unpaidTaxes','none')} 없음　${mark(fields,'unpaidTaxes','yes')} 있음　　임대인 서명 또는 날인: ${text(fields,'taxCheckSignature',blank)}</td></tr><tr><th>선순위 확정일자 현황</th><td>${mark(fields,'priorDates','none')} 해당 없음　${mark(fields,'priorDates','yes')} 해당 있음　　임대인 서명 또는 날인: ${text(fields,'priorDateSignature',blank)}</td></tr></table>
        <div class="section-title">계약내용</div>
        <p><strong>제1조(보증금과 차임 및 관리비)</strong> 위 부동산의 임대차에 관하여 임대인과 임차인은 합의에 의하여 보증금과 차임 및 관리비를 아래와 같이 지불하기로 한다.</p>
        <table class="compact totals"><tr><th>보증금</th><td>금 ${text(fields,'deposit',blank)} 원정 (₩ ${text(fields,'deposit',blank)})</td></tr><tr><th>계약금</th><td>금 ${text(fields,'contractPayment',blank)} 원은 계약시에 지불하고 영수함. 영수자 ${text(fields,'contractPaymentRecipient',blank)}</td></tr><tr><th>중도금</th><td>금 ${text(fields,'intermediatePayment',blank)} 원은 ${text(fields,'intermediateDate',blank)}에 지불한다.</td></tr><tr><th>잔금</th><td>금 ${text(fields,'balance',blank)} 원은 ${text(fields,'balanceDate',blank)}에 지불한다.</td></tr><tr><th>차임(월세)</th><td>금 ${text(fields,'monthlyRent',blank)} 원정은 매월 ${text(fields,'rentDay',blank)}일에 지불한다. 입금계좌: ${text(fields,'bankAccount',blank)}</td></tr><tr><th>관리비</th><td>${mark(fields,'maintenanceType','fixed')} 정액 금 ${text(fields,'maintenanceFee',blank)}원　${mark(fields,'maintenanceType','variable')} 항목·산정방식: ${text(fields,'maintenanceDetails',blank)}</td></tr></table>
        <p><strong>제2조(임대차기간)</strong> 임대인은 임차주택을 임대차 목적대로 사용·수익할 수 있는 상태로 ${text(fields,'handoverDate',blank)}까지 임차인에게 인도하고, 임대차기간은 인도일로부터 ${text(fields,'leaseEndDate',blank)}까지로 한다.</p>
        <div class="footer">주택임대차 표준계약서 · 계약 세션 ${escapeHtml(fields.contractCode || '')}</div>
      </section>

      <section class="page terms">
        <h2>계약 조항</h2>
        <p><strong>제3조(입주 전 수리)</strong> 임대인과 임차인은 임차주택의 수리가 필요한 시설물 및 비용부담에 관하여 다음과 같이 합의한다.</p>
        <table class="compact"><tr><th>수리 필요 시설</th><td>${mark(fields,'repairNeeded','no')} 없음　${mark(fields,'repairNeeded','yes')} 있음: ${text(fields,'repairDetails',blank)}</td></tr><tr><th>수리 완료 시기</th><td>${text(fields,'repairDeadline',blank)}</td></tr><tr><th>미수리 시 처리</th><td>${text(fields,'repairRemedy',blank)}</td></tr></table>
        <p><strong>제4조(임차주택의 사용·관리·수선)</strong></p>
        <p>① 임차인은 임대인의 동의 없이 임차주택의 구조변경 및 전대나 임차권 양도를 할 수 없으며, 임대차 목적인 주거 이외의 용도로 사용할 수 없다.</p>
        <p>② 임대인은 계약 존속 중 임차주택을 사용·수익에 필요한 상태로 유지하여야 하고, 임차인은 임대인이 임차주택의 보존에 필요한 행위를 하는 때 이를 거절하지 못한다.</p>
        <p>③ 계약 존속 중 발생하는 임차주택의 수리 및 비용부담에 관하여 당사자는 다음과 같이 합의한다. 합의되지 아니한 기타 수선비용은 민법, 판례 및 관습에 따른다.</p>
        <table class="compact"><tr><th>임대인 부담</th><td>${text(fields,'landlordRepairs',blank)}</td></tr><tr><th>임차인 부담</th><td>${text(fields,'tenantRepairs',blank)}</td></tr></table>
        <p>④ 임차인이 임대인의 부담에 속하는 수선비용을 지출한 때에는 임대인에게 그 상환을 청구할 수 있다.</p>
        <p><strong>제5조(계약의 해제)</strong> 임차인이 임대인에게 중도금(중도금이 없을 때는 잔금)을 지급하기 전까지, 임대인은 계약금의 배액을 상환하고 임차인은 계약금을 포기하고 이 계약을 해제할 수 있다.</p>
        <p><strong>제6조(채무불이행과 손해배상)</strong> 당사자 일방이 채무를 이행하지 아니하는 때에는 상대방은 상당한 기간을 정하여 이행을 최고하고 계약을 해제할 수 있으며, 그로 인한 손해배상을 청구할 수 있다. 다만 채무자가 미리 이행하지 아니할 의사를 표시한 경우에는 최고를 요하지 아니한다.</p>
        <p><strong>제7조(계약의 해지)</strong> ① 임차인은 본인의 과실 없이 임차주택의 일부가 멸실 기타 사유로 임대차 목적대로 사용할 수 없는 경우 계약을 해지할 수 있다. ② 임대인은 임차인이 2기의 차임액에 달하도록 연체하거나 제4조 제1항을 위반한 경우 계약을 해지할 수 있다.</p>
        <p><strong>제8조(갱신요구와 거절)</strong> ① 임차인은 임대차기간이 끝나기 6개월 전부터 2개월 전까지의 기간에 계약갱신을 요구할 수 있다. 다만, 임대인은 자신 또는 그 직계존속·직계비속의 실거주 등 주택임대차보호법 제6조의3 제1항 각 호의 사유가 있는 경우에 한하여 계약갱신 요구를 거절할 수 있다. 별지 2 계약갱신 거절통지서 양식을 사용할 수 있다. ② 임대인이 주택임대차보호법 제6조의3 제1항 제8호에 따른 실거주를 사유로 갱신을 거절하였음에도 불구하고 갱신요구가 거절되지 아니하였더라면 갱신되었을 기간이 만료되기 전에 정당한 사유 없이 제3자에게 주택을 임대한 경우, 임대인은 갱신거절로 인하여 임차인이 입은 손해를 배상하여야 한다. ③ 제2항에 따른 손해배상액은 주택임대차보호법 제6조의3 제6항에 의한다.</p>
        <div class="footer">계약 조항 · 1/2</div>
      </section>

      <section class="page terms">
        <h2>계약 조항 및 특약사항</h2>
        <p><strong>제9조(계약의 종료)</strong> 임대차계약이 종료된 경우에 임차인은 임차주택을 원래의 상태로 복구하여 임대인에게 반환하고, 이와 동시에 임대인은 보증금을 임차인에게 반환하여야 한다. 다만, 시설물의 노후화나 통상 생길 수 있는 파손 등은 임차인의 원상복구의무에 포함되지 아니한다.</p>
        <p><strong>제10조(비용의 정산)</strong> ① 임차인은 계약종료 시 공과금과 관리비를 정산하여야 한다. ② 임차인은 이미 납부한 관리비 중 장기수선충당금을 임대인(소유자인 경우)에게 반환 청구할 수 있다. 다만, 관리사무소 등 관리주체가 장기수선충당금을 정산하는 경우에는 그 관리주체에게 청구할 수 있다.</p>
        <p><strong>제11조(분쟁의 해결)</strong> 임대인과 임차인은 본 임대차계약과 관련한 분쟁이 발생하는 경우, 당사자 간의 협의 또는 주택임대차분쟁조정위원회의 조정을 통해 호혜적으로 해결하기 위해 노력한다.</p>
        <p><strong>제12조(중개보수 등)</strong> 중개보수는 거래 가액의 ${text(fields,'brokerageRate',blank)}%인 ${text(fields,'brokerageFee',blank)}원( ${mark(fields,'brokerageVat','included')} 부가가치세 포함　${mark(fields,'brokerageVat','excluded')} 불포함 )으로 임대인과 임차인이 각각 부담한다. 다만, 개업공인중개사의 고의 또는 과실로 인하여 중개의뢰인간의 거래행위가 무효·취소 또는 해제된 경우에는 그러하지 아니하다.</p>
        <p><strong>제13조(중개대상물 확인·설명서 교부)</strong> 개업공인중개사는 중개대상물 확인·설명서를 작성하고 업무보증관계증서(공제증서 등) 사본을 첨부하여 ${text(fields,'brokerDocsDate',blank)} 임대인과 임차인에게 각각 교부한다.</p>
        <div class="section-title">특약사항</div>
        <div class="special">${specialText}</div>
        <p>주택 임대차 계약과 관련한 분쟁이 있는 경우 당사자는 법원에 소를 제기하기 전에 주택임대차분쟁조정위원회에 조정을 신청합니다. ${mark(fields,'mediation','agree')} 동의　${mark(fields,'mediation','disagree')} 미동의</p>
        <p>주택의 철거 또는 재건축 계획: ${mark(fields,'rebuild','no')} 없음　${mark(fields,'rebuild','yes')} 있음　공사시기 ${text(fields,'rebuildDate',blank)}　소요기간 ${text(fields,'rebuildMonths',blank)}개월</p>
        <p>상세주소가 없는 경우 임차인의 상세주소 부여 신청에 대한 소유자 동의: ${mark(fields,'addressConsent','agree')} 동의　${mark(fields,'addressConsent','disagree')} 미동의</p>
        <p><strong>기타</strong><br>${text(fields,'otherTerms',blank)}</p>
        <p>본 계약을 증명하기 위하여 계약 당사자가 이의 없음을 확인하고 각각 서명·날인 후 임대인, 임차인, 개업공인중개사는 매 장마다 간인하여 각각 1통씩 보관한다.</p>
        <p>작성일: ${text(fields,'contractDate',blank)}</p>
        <div class="footer">계약 조항 · 2/2</div>
      </section>

      <section class="page">
        <h2>계약 당사자 및 서명</h2>
        <table class="signatures"><tr><th>임대인</th><td>성명: ${text(fields,'landlordName',blank)}<br>주소: ${text(fields,'landlordAddress',blank)}<br>주민등록번호: ${text(fields,'landlordId',blank)}<br>전화: ${text(fields,'landlordPhone',blank)}<br>대리인: ${text(fields,'landlordAgent',blank)}<br>${signature(signatures,'landlord','임대인')}</td></tr>
        <tr><th>임차인</th><td>성명: ${text(fields,'tenantName',blank)}<br>주소: ${text(fields,'tenantAddress',blank)}<br>주민등록번호: ${text(fields,'tenantId',blank)}<br>전화: ${text(fields,'tenantPhone',blank)}<br>대리인: ${text(fields,'tenantAgent',blank)}<br>${signature(signatures,'tenant','임차인')}</td></tr>
        <tr><th>개업공인중개사</th><td>사무소: ${text(fields,'brokerOffice',blank)}　등록번호: ${text(fields,'brokerRegistration',blank)}<br>대표: ${text(fields,'brokerName',blank)}　전화: ${text(fields,'brokerPhone',blank)}<br>사무소 소재지: ${text(fields,'brokerAddress',blank)}<br>${signature(signatures,'broker','개업공인중개사')}</td></tr></table>
        <p class="callout">계약서 각 장의 간인과 당사자 보관용 계약서 작성 여부를 확인하세요.</p>
        <div class="footer">주택임대차 표준계약서 · 서명</div>
      </section>
      ${appendix}
      ${renewalNotice}
      </body></html>`;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { renderContractHtml };
  if (root) root.renderContractHtml = renderContractHtml;
})(typeof window !== 'undefined' ? window : globalThis);

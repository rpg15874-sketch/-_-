// ==========================================
// 1. 브이월드 API 설정 및 콜백 함수 (수정된 핵심 부분)
// ==========================================
const VWORLD_API_KEY = "C4D6B4AE-FF0F-40C3-939D-CA173A17C7BF";

window.vworldSearchCallback = function(data) {
    console.log("VWorld API 응답 데이터:", data); // F12 개발자 도구 확인용

    const targetAddress = document.querySelector('input[data-field="propertyAddress"]');
    const targetCategory = document.querySelector('input[data-field="landType"]');
    const targetArea = document.querySelector('input[data-field="landArea"]');
    const userInput = document.getElementById('searchAddress').value.trim();
    const msg = document.getElementById('searchResultMsg');

    // [경우 1] API 키/도메인 권한 에러인 경우
    if (data.response?.status === "ERROR") {
        msg.innerHTML = `API 오류: ${data.response.error?.text || '도메인 설정을 다시 확인하세요.'}`;
        msg.style.color = "red";
        return;
    }

    // [경우 2] 공공 API가 DB에서 주소를 못 찾는 경우 -> 입력한 주소 강제 적용!
    if (data.response?.status === "NOT_FOUND" || !data.response?.result) {
        msg.innerHTML = "공공 API가 해당 주소를 찾지 못해, <b>입력하신 주소를 계약서에 그대로 적용</b>했습니다.";
        msg.style.color = "#ff9800"; // 주황색 알림
        
        if (targetAddress) {
            targetAddress.value = userInput;
            targetAddress.dispatchEvent(new Event('input', { bubbles: true })); 
        }
        return; 
    }

    // [경우 3] API가 주소를 정상적으로 찾은 경우
    const parcelData = data.response.result.items[0];
    
    if (targetAddress) {
        targetAddress.value = parcelData.address.parcel || parcelData.title;
        targetAddress.dispatchEvent(new Event('input', { bubbles: true })); 
    }
    
    if (targetCategory) {
        targetCategory.value = "대"; // 임시값
        targetCategory.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (targetArea) {
        targetArea.value = "330"; // 임시값
        targetArea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    msg.textContent = "성공적으로 계약서에 정보를 채웠습니다!";
    msg.style.color = "green";
};

// ==========================================
// 2. 문서 로드 완료 후 실행되는 메인 로직
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // --- A. 브이월드 주소 검색 이벤트 (수정된 부분) ---
    const btnSearchLand = document.getElementById('btnSearchLand');
    const searchAddress = document.getElementById('searchAddress');
    const msg = document.getElementById('searchResultMsg');

    if (btnSearchLand) {
        btnSearchLand.addEventListener('click', () => {
            let address = searchAddress.value.trim();

            if (!address) {
                alert('검색할 지번 주소를 입력해주세요.');
                return;
            }

            // 융통성 없는 API를 위해 흔히 쓰는 줄임말을 정식 명칭으로 자동 변환
            address = address.replace(/^서울\s/, '서울특별시 ')
                             .replace(/^부산\s/, '부산광역시 ')
                             .replace(/^대구\s/, '대구광역시 ')
                             .replace(/^인천\s/, '인천광역시 ')
                             .replace(/^광주\s/, '광주광역시 ')
                             .replace(/^대전\s/, '대전광역시 ')
                             .replace(/^울산\s/, '울산광역시 ')
                             .replace(/^경기\s/, '경기도 ')
                             .replace(/^강원\s/, '강원특별자치도 ')
                             .replace(/^충북\s/, '충청북도 ')
                             .replace(/^충남\s/, '충청남도 ')
                             .replace(/^전북\s/, '전북특별자치도 ')
                             .replace(/^전남\s/, '전라남도 ')
                             .replace(/^경북\s/, '경상북도 ')
                             .replace(/^경남\s/, '경상남도 ')
                             .replace(/^제주\s/, '제주특별자치도 ');

            msg.textContent = "정보를 조회하고 있습니다...";
            msg.style.color = "#007bff";

            // 기존 스크립트 태그 제거 후 JSONP 방식으로 재호출
            const scriptId = 'vworld-jsonp-script';
            const existingScript = document.getElementById(scriptId);
            if (existingScript) existingScript.remove();

            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://api.vworld.kr/req/search?service=search&request=search&version=2.0&crs=EPSG:4326&size=1&page=1&query=${encodeURIComponent(address)}&type=address&category=parcel&format=jsonp&errorformat=jsonp&key=${VWORLD_API_KEY}&callback=vworldSearchCallback`;
            
            script.onerror = () => {
                msg.textContent = "API 서버와 연결할 수 없습니다. 인터넷 상태를 확인해 주세요.";
                msg.style.color = "red";
            };

            document.body.appendChild(script);
        });
    }

    if (searchAddress) {
        searchAddress.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                btnSearchLand.click(); 
            }
        });
    }

    // --- B. 기존 대표님의 QR코드, 태블릿 연결, 실시간 DB 기능 (원래 코드 유지 부분) ---
    /* 
       여기에 대표님이 원래 작성하셨던 아래 기능들의 코드를 그대로 넣어주세요.
       - Firebase 등 실시간 DB 연결 로직
       - qrcode.js 등을 이용한 QR 코드 생성 로직 (id="qrCode")
       - 태블릿 연결 상태 감지 로직 (id="tabletStatus")
       - 새 계약 버튼 동작 (id="newContract")
    */
    // const newContractBtn = document.getElementById('newContract');
    // ... 기존 로직 ...


    // --- C. 기존 대표님의 PDF 다운로드 기능 (원래 코드 유지 부분) ---
    /* 
       여기에 원래 작동하던 PDF 다운로드(jspdf, html2canvas 등) 로직을 그대로 넣어주세요.
    */
    // const downloadPdfBtn = document.getElementById('downloadPdf');
    // ... 기존 PDF 로직 ...
    
});

// 브이월드 API 인증키
const VWORLD_API_KEY = "C4D6B4AE-FF0F-40C3-939D-CA173A17C7BF";

document.addEventListener("DOMContentLoaded", () => {
    const btnSearchLand = document.getElementById('btnSearchLand');
    const searchAddress = document.getElementById('searchAddress');
    const msg = document.getElementById('searchResultMsg');

    // 1. JSONP 응답을 받을 전역 콜백 함수 설정 (CORS 에러 원천 차단)
    window.vworldSearchCallback = function(data) {
        // 검색된 결과가 없거나 공공 DB에 누락된 지번일 경우
        if (data.response?.status !== "OK" || !data.response?.result) {
            msg.innerHTML = "해당 지번을 검색 DB에서 찾을 수 없습니다.<br><span style='font-size:12px; color:#666;'>(※ 건물이 없는 산, 전, 답 등은 국가 검색 DB에 누락되어 있을 수 있으니, 아래 칸에 <b>직접 입력</b>해 주세요.)</span>";
            msg.style.color = "#d32f2f";
            return;
        }

        const parcelData = data.response.result.items[0];
        
        // HTML의 data-field 속성을 기반으로 입력칸 요소 찾기
        const targetAddress = document.querySelector('input[data-field="propertyAddress"]');
        const targetCategory = document.querySelector('input[data-field="landType"]');
        const targetArea = document.querySelector('input[data-field="landArea"]');

        // 데이터 자동 채우기 및 실시간 폼 반영
        if (targetAddress) {
            targetAddress.value = parcelData.address.parcel || parcelData.title;
            targetAddress.dispatchEvent(new Event('input', { bubbles: true })); 
        }
        
        // 지목/면적은 임시값 (추후 고도화 시 토지임야정보 API 등 연계 가능)
        if (targetCategory) {
            targetCategory.value = "대"; 
            targetCategory.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (targetArea) {
            targetArea.value = "330"; 
            targetArea.dispatchEvent(new Event('input', { bubbles: true }));
        }

        msg.textContent = "성공적으로 계약서에 정보를 채웠습니다!";
        msg.style.color = "green";
    };

    // 2. 버튼 클릭 시 스크립트 태그를 동적으로 삽입하여 API 호출 (fetch 우회)
    if (btnSearchLand) {
        btnSearchLand.addEventListener('click', () => {
            const address = searchAddress.value.trim();

            if (!address) {
                alert('검색할 지번 주소를 입력해주세요.');
                return;
            }

            msg.textContent = "정보를 조회하고 있습니다...";
            msg.style.color = "#007bff";

            // 기존에 남아있는 스크립트 태그가 있다면 제거 (중복 방지)
            const scriptId = 'vworld-jsonp-script';
            const existingScript = document.getElementById(scriptId);
            if (existingScript) {
                existingScript.remove();
            }

            // fetch 대신 script 태그 삽입 방식으로 호출하여 CORS 회피
            // format=jsonp 와 callback=vworldSearchCallback 파라미터가 핵심!
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://api.vworld.kr/req/search?service=search&request=search&version=2.0&crs=EPSG:4326&size=1&page=1&query=${encodeURIComponent(address)}&type=address&category=parcel&format=jsonp&errorformat=jsonp&key=${VWORLD_API_KEY}&callback=vworldSearchCallback`;
            
            // 네트워크 오류(와이파이 끊김 등) 시 처리
            script.onerror = () => {
                msg.textContent = "API 서버와 연결할 수 없습니다. 인터넷 상태를 확인해 주세요.";
                msg.style.color = "red";
            };

            // 스크립트 실행
            document.body.appendChild(script);
        });
    }

    // 3. 인풋창 엔터(Enter) 키보드 입력 지원
    if (searchAddress) {
        searchAddress.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                btnSearchLand.click(); 
            }
        });
    }
});

// 브이월드 API 인증키
const VWORLD_API_KEY = "C4D6B4AE-FF0F-40C3-939D-CA173A17C7BF";

document.addEventListener("DOMContentLoaded", () => {
    const btnSearchLand = document.getElementById('btnSearchLand');
    const searchAddress = document.getElementById('searchAddress');
    const msg = document.getElementById('searchResultMsg');

    // 1. JSONP 응답을 받을 전역 콜백 함수 설정 (CORS 에러 원천 차단)
    window.vworldSearchCallback = function(data) {
        if (data.response?.status !== "OK" || !data.response?.result) {
            msg.textContent = "해당 주소를 찾을 수 없습니다. 정확한 지번을 입력해주세요.";
            msg.style.color = "red";
            return;
        }

        const parcelData = data.response.result.items[0];
        
        const targetAddress = document.querySelector('input[data-field="propertyAddress"]');
        const targetCategory = document.querySelector('input[data-field="landType"]');
        const targetArea = document.querySelector('input[data-field="landArea"]');

        // 데이터 자동 채우기 및 실시간 폼 반영
        if (targetAddress) {
            targetAddress.value = parcelData.address.parcel || parcelData.title;
            targetAddress.dispatchEvent(new Event('input', { bubbles: true })); 
        }
        if (targetCategory) {
            targetCategory.value = "대"; // (임시값)
            targetCategory.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (targetArea) {
            targetArea.value = "330"; // (임시값)
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
            // format=jsonp 와 callback=vworldSearchCallback 파라미터가 핵심
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://api.vworld.kr/req/search?service=search&request=search&version=2.0&crs=EPSG:4326&size=1&page=1&query=${encodeURIComponent(address)}&type=address&category=parcel&format=jsonp&errorformat=jsonp&key=${VWORLD_API_KEY}&callback=vworldSearchCallback`;
            
            script.onerror = () => {
                msg.textContent = "API 서버와 연결할 수 없습니다. (스크립트 로드 실패)";
                msg.style.color = "red";
            };

            document.body.appendChild(script);
        });
    }

    // 3. 인풋창 엔터키 지원
    if (searchAddress) {
        searchAddress.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                btnSearchLand.click(); 
            }
        });
    }
});

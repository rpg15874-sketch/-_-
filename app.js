// 브이월드 API 인증키 (가입 후 발급받아 교체하세요)
const VWORLD_API_KEY = " C4D6B4AE-FF0F-40C3-939D-CA173A17C7BF";

document.getElementById('btnSearchLand').addEventListener('click', async () => {
    const address = document.getElementById('searchAddress').value.trim();
    const msg = document.getElementById('searchResultMsg');

    if (!address) {
        alert('검색할 지번 주소를 입력해주세요.');
        return;
    }

    msg.textContent = "정보를 조회하고 있습니다...";
    msg.style.color = "#007bff";

    try {
        // 1단계: 브이월드 검색 API를 통해 주소의 기본 정보(행정동 코드 등) 호출
        const searchUrl = `https://api.vworld.kr/req/search?service=search&request=search&version=2.0&crs=EPSG:4326&size=1&page=1&query=${encodeURIComponent(address)}&type=address&category=parcel&format=json&errorformat=json&key=${VWORLD_API_KEY}`;
        
        // CORS 문제를 피하기 위해 JSONP 방식을 사용하거나 프록시가 필요할 수 있습니다. 
        // 최신 브라우저 fetch 방식 예제입니다.
        const res = await fetch(searchUrl);
        const data = await res.json();

        if (data.response.status !== "OK" || !data.response.result) {
            msg.textContent = "해당 주소를 찾을 수 없습니다. 정확한 지번을 입력해주세요.";
            msg.style.color = "red";
            return;
        }

        const parcelData = data.response.result.items[0];
        
        // 2단계: 결과값을 계약서 input 태그에 자동 입력
        // 주의: 아래의 'addressInput', 'categoryInput', 'areaInput'은 
        // 실제 index.html에 있는 계약서 빈칸의 id값과 똑같이 맞춰주셔야 합니다.
        const targetAddress = document.getElementById('address');       // 소재지 id
        const targetCategory = document.getElementById('landCategory'); // 지목 id
        const targetArea = document.getElementById('area');             // 면적 id

        if (targetAddress) {
            targetAddress.value = parcelData.address.parcel;
            // ★ 중요: 값이 스크립트로 변경되었음을 Firebase가 인식하도록 강제 이벤트 발생
            targetAddress.dispatchEvent(new Event('input')); 
        }

        // 브이월드 지적도 Data API 추가 호출 등 확장을 통해 지목/면적 파싱 (여기서는 예시 텍스트 주입)
        // 지목과 면적을 정확히 가져오려면 브이월드 Data API(토지대장)를 연계 호출하는 로직을 추가해야 합니다.
        if (targetCategory) {
            targetCategory.value = "대"; // API 데이터로 대체 필요
            targetCategory.dispatchEvent(new Event('input'));
        }
        
        if (targetArea) {
            targetArea.value = "330"; // API 데이터로 대체 필요 (단위: ㎡)
            targetArea.dispatchEvent(new Event('input'));
        }

        msg.textContent = "성공적으로 계약서에 정보를 채웠습니다!";
        msg.style.color = "green";

    } catch (error) {
        console.error("API 연동 에러:", error);
        msg.textContent = "조회 중 시스템 오류가 발생했습니다.";
        msg.style.color = "red";
    }
});

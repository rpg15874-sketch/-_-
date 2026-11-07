// 브이월드 API 인증키
const VWORLD_API_KEY = "C4D6B4AE-FF0F-40C3-939D-CA173A17C7BF";

document.addEventListener("DOMContentLoaded", () => {
    const btnSearchLand = document.getElementById('btnSearchLand');
    const searchAddress = document.getElementById('searchAddress');
    const msg = document.getElementById('searchResultMsg');

    // 1. 버튼 클릭 시 검색 실행
    if (btnSearchLand) {
        btnSearchLand.addEventListener('click', async () => {
            const address = searchAddress.value.trim();

            if (!address) {
                alert('검색할 지번 주소를 입력해주세요.');
                return;
            }

            msg.textContent = "정보를 조회하고 있습니다...";
            msg.style.color = "#007bff";

            try {
                const searchUrl = `https://api.vworld.kr/req/search?service=search&request=search&version=2.0&crs=EPSG:4326&size=1&page=1&query=${encodeURIComponent(address)}&type=address&category=parcel&format=json&errorformat=json&key=${VWORLD_API_KEY}`;
                
                const res = await fetch(searchUrl);
                const data = await res.json();

                if (data.response?.status !== "OK" || !data.response?.result) {
                    msg.textContent = "해당 주소를 찾을 수 없습니다. 정확한 지번을 입력해주세요.";
                    msg.style.color = "red";
                    return;
                }

                const parcelData = data.response.result.items[0];
                
                // HTML의 data-field 속성으로 입력칸 찾기
                const targetAddress = document.querySelector('input[data-field="propertyAddress"]');
                const targetCategory = document.querySelector('input[data-field="landType"]');
                const targetArea = document.querySelector('input[data-field="landArea"]');

                if (targetAddress) {
                    targetAddress.value = parcelData.address.parcel || parcelData.title;
                    targetAddress.dispatchEvent(new Event('input', { bubbles: true })); 
                }

                if (targetCategory) {
                    targetCategory.value = "대"; // (추후 지적도 연계 시 동적 변경 가능)
                    targetCategory.dispatchEvent(new Event('input', { bubbles: true }));
                }
                
                if (targetArea) {
                    targetArea.value = "330"; // (추후 지적도 연계 시 동적 변경 가능)
                    targetArea.dispatchEvent(new Event('input', { bubbles: true }));
                }

                msg.textContent = "성공적으로 계약서에 정보를 채웠습니다!";
                msg.style.color = "green";

            } catch (error) {
                console.error("API 연동 에러:", error);
                msg.textContent = "조회 중 시스템 오류가 발생했습니다.";
                msg.style.color = "red";
            }
        });
    }

    // 2. 인풋창에서 엔터(Enter) 키보드 눌렀을 때도 바로 검색되도록 추가
    if (searchAddress) {
        searchAddress.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // 기본 새로고침 방지
                btnSearchLand.click(); // 버튼 클릭과 동일한 효과
            }
        });
    }
});

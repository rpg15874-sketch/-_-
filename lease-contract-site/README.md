# 주택임대차 계약서 · 반응형 웹사이트

GitHub Pages에 올려 사용하는 정적 웹사이트입니다. PC에서 계약 내용을 입력하면 Firebase Realtime Database를 통해 태블릿에 실시간으로 전달됩니다. 태블릿 서명은 PC 화면에 즉시 반영되고, 계약서 PDF와 서명 PNG는 로그인한 Google Drive에 저장할 수 있습니다.

## 파일 구성

- `index.html`: PC용 계약 입력 화면, 실시간 미리보기, QR 연결, PDF/Drive 저장
- `tablet.html`: 태블릿용 계약 확인과 터치 서명 화면
- `document.js`: 인쇄용 계약서와 별지 렌더링
- `firebase-config.js`: Firebase 웹 설정과 Google OAuth 웹 클라이언트 ID
- `database.rules.json`: Firebase Realtime Database 보안 규칙 예시
- `.github/workflows/deploy.yml`: `main`에 푸시할 때 GitHub Pages 자동 배포

## 1. GitHub Pages 배포

1. GitHub에서 저장소를 만들고 이 폴더의 **내용 전체**를 저장소 루트에 올립니다. `.github/workflows/deploy.yml`도 포함해야 합니다.
2. 저장소의 **Settings → Pages**에서 Build and deployment의 Source를 **GitHub Actions**로 선택합니다.
3. 아래 Firebase 설정을 끝내고 `firebase-config.js`를 수정한 뒤 `main` 브랜치에 커밋·푸시합니다.
4. Actions의 `Deploy GitHub Pages` 실행이 끝나면 저장소의 Pages URL을 엽니다. 일반적인 저장소 페이지 URL은 `https://<계정>.github.io/<저장소>/` 형식입니다.

GitHub Pages는 정적 파일을 서비스하므로 별도 웹 서버 실행이나 `npm install`이 필요하지 않습니다.

## 2. 실시간 동기화 설정 (Firebase)

1. Firebase 프로젝트를 만들고 **Realtime Database**를 생성합니다.
2. **Authentication → Sign-in method**에서 **Anonymous** 로그인을 켭니다.
3. 프로젝트 설정에서 웹 앱을 추가하고, 표시된 `apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`를 `firebase-config.js`의 `firebaseConfig`에 입력합니다. 웹 API 키는 공개 설정값이며, 데이터 접근은 아래 Rules로 제한합니다.
4. Realtime Database의 **Rules**에 `database.rules.json`의 내용을 적용하고 게시합니다.
5. 웹사이트를 다시 GitHub에 푸시합니다.

각 계약은 256비트 무작위 세션 ID를 사용합니다. PC와 태블릿이 같은 세션 링크로 접속하면 실시간 데이터베이스 변경 알림을 받아 계약 내용과 서명을 공유합니다. 링크를 가진 사람은 계약을 읽고 수정할 수 있으므로 QR/링크를 계약 당사자에게만 전달하세요. 이 설정은 시연 및 소규모 내부 사용용입니다. 주민등록번호·주소 등 실제 민감정보를 다루는 운영 환경에는 실명 인증과 역할별 접근 제어를 추가하세요.

## 3. Google Drive 저장 설정

1. Google Cloud 프로젝트에서 **Google Drive API**를 사용 설정합니다.
2. OAuth 동의 화면을 준비하고 OAuth 클라이언트 ID를 **웹 애플리케이션** 유형으로 만듭니다.
3. 승인된 JavaScript 원본에 배포 사이트의 origin을 입력합니다. 예: `https://<계정>.github.io` (저장소 경로 `/저장소/`는 넣지 않습니다). 사용자 도메인이 있으면 해당 HTTPS origin도 추가합니다.
4. 웹 OAuth 클라이언트 ID를 `firebase-config.js`의 `googleClientId`에 입력합니다.
5. 변경 내용을 커밋·푸시하고 PC 사이트에서 **Google Drive 연결**을 누른 뒤 Google 계정 권한을 승인합니다.
6. **PDF와 서명 PNG를 Drive에 저장**을 누르면 Drive의 `주택임대차 계약서` 폴더에 PDF와 제출된 사람별 서명 PNG가 올라갑니다.

Drive 접근 토큰은 사이트 코드에 기록하거나 브라우저 저장소에 보관하지 않습니다. Google 권한 창은 사용자가 연결/저장 버튼을 눌렀을 때 표시됩니다.

## 계약서 범위

제공된 주택임대차 표준계약서의 주요 항목과 기본 조항을 기준으로 작성·출력 화면을 구성했습니다. 원본 HWP 페이지 배치를 픽셀 단위로 복제하지는 않으며 별지 1은 핵심 안내 중심으로 정리되고, 별지 2(계약갱신 거절통지서)는 선택할 수 있습니다. 실제 계약에 쓰기 전 PDF 내용과 배치를 확인하세요.

## 데이터 위치

- 작성 중인 필드와 서명 이미지: Firebase Realtime Database
- 완료 계약서 PDF와 서명 PNG: 연결한 사용자의 Google Drive
- 웹사이트 소스와 배포 설정: GitHub 저장소

GitHub Pages에 개인 계약 자료를 올리지 않습니다. Drive API 접근에는 Google의 `drive.file` 범위를 사용하며, 브라우저에 GitHub 비밀 토큰을 넣지 않습니다.

## 공식 설정 문서

- [GitHub Pages 자동 배포](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically)
- [Firebase 웹 앱과 Realtime Database](https://firebase.google.com/docs/database/web/start)
- [Firebase 보안 규칙](https://firebase.google.com/docs/database/security)
- [Google Identity Services 웹 토큰 모델](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Google Drive 파일 업로드](https://developers.google.com/workspace/drive/api/guides/manage-uploads)

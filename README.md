# 갈피 v0.1.0

커플링 × AU로 분류하는 개인 소설 서재. 반응형 웹앱이며 APK/AAB는 아닙니다.

## 실행

`node preview.mjs` → http://127.0.0.1:4173

## Firebase 설정

사용자가 제공한 `kkyareuk` Firebase 웹 앱 공개 설정을 사용합니다. 비공개 서비스 계정 키를 포함하지 않습니다.

1. Firebase Authentication → Sign-in method에서 Google을 활성화합니다.
2. Authentication → Settings → Authorized domains에 `galpi-fiction-library.kkyareuk.chatgpt.site`를 추가합니다. 로컬 테스트를 하려면 `127.0.0.1`도 추가합니다.
3. Firestore Database가 없다면 생성합니다.
4. `firestore.rules.fragment`의 match 블록을 기존 Firestore 규칙의 `/databases/{database}/documents` 내부에 추가합니다. 기존 앱의 규칙을 통째로 교체하지 않습니다. 기존의 광범위한 허용 규칙이 이 경로를 열고 있지 않은지도 확인합니다.
5. 사이트에서 Google 로그인 → 테스트 시리즈/회차 저장 → 다른 브라우저 로그인으로 계정별 저장을 확인합니다.

Sites 호스팅의 소유자 전용 접근과 앱 안의 Firebase Google 로그인은 별개입니다. 외부 접근 제한은 소유자 전용으로 유지합니다.

## 저장 방식과 현재 범위

- 로그인 전 원고: IndexedDB에 기기별 저장.
- 로그인 후: UID별로 기기 캐시와 Firestore `users/{uid}/galpiSeries/{seriesId}/chapters/{chapterId}` 사용.
- 입력 600ms 후 기기 저장, 클라우드 전송은 1800ms 후 수행. 화면 전환은 클라우드 응답을 기다리지 않습니다.
- 각 회차 최대 180,000 UTF-16 코드 단위. 글자 수 표시는 Unicode code point 기준, 공백 제외는 모든 공백 문자 제외.
- 기기 원고와 클라우드 원고는 수정 시각으로 병합. 같은 회차의 동시 협업 편집은 지원하지 않으며 여러 기기에서 같은 회차를 동시에 수정하지 않습니다.
- 책갈피, 읽기 위치, 리더 설정은 기기별 저장.
- 미리보기 작품은 실제 사용자 원고가 아니며 클라우드에 자동 업로드하지 않습니다.
- 백업은 JSON 다운로드, 복원은 새 ID 사본으로 가져와 기존 원고를 덮어쓰지 않습니다.
- 로그인 전 원고는 게스트 영역에 남습니다. 로그인 전에 백업하고 로그인 후 가져오면 계정 서재로 옮길 수 있습니다.
- Firebase 콘솔의 제공자/도메인/보안 규칙 설정 및 실제 계정 간 격리는 아직 검증되지 않았습니다.

## 브랜치

새 기능 개발: dev. 배포할 소스: main. 이 저장소는 서랍마을 Android 저장소와 별개이며 versionCode 변경 대상이 아닙니다.

## 검증

`node --check dist/app.js`. 브라우저에서 시리즈 생성, 회차 생성, 한글/이모지 글자 수(공백 포함 6자, 제외 4자), 자동 저장, 리더 표시, 책갈피를 확인했습니다. 최종 검증 결과는 작업판을 참고하세요.

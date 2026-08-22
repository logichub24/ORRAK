# 원스토어 오르락

오르락(ORRAK)의 원스토어 출시용 Android 패키지입니다.

기존 루트 앱은 토스 인앱 런타임용이고, 이 폴더는 원스토어에 올릴 APK/AAB를 만들기 위한 별도 방입니다. 현재 구조는 루트의 Vite 웹 빌드 결과를 Android WebView asset으로 넣어 앱처럼 실행합니다.

## 현재 구성

- 패키지명: `com.logichub24.orrak.onestore`
- 앱 이름: `오르락`
- minSdk: 23
- targetSdk: 35
- 실행 방식: 로컬 `file:///android_asset/index.html` WebView
- 네트워크 권한: AI API, 원격 이미지 등 확장 가능성을 위해 `INTERNET` 포함

## 빌드 흐름

루트 오르락 프로젝트에서 웹 산출물을 먼저 만듭니다.

```powershell
cd "D:\toss-app\오르락(ORRAK)"
npm.cmd run build:web
```

그 다음 원스토어 폴더에서 WebView asset을 준비합니다.

```powershell
cd "D:\toss-app\오르락(ORRAK)\원스토어-오르락"
.\scripts\prepare-web-assets.ps1
```

Gradle/Android Studio 없이 로컬 디버그 APK를 만들려면 다음을 실행합니다.

```powershell
.\scripts\build-debug-apk.ps1
```

성공하면 `release\orrak-onestore-debug.apk`가 만들어집니다.

## 원스토어 제출 전 남은 일

- 원스토어 개발자센터 앱 등록 정보 작성
- 출시용 서명키 생성 및 release APK/AAB 서명
- 개인정보 처리방침 URL 준비
- 앱 아이콘, 스크린샷, 소개 문구 준비
- 토스 프로모션 보상/토스 광고 기능은 원스토어에서 동작하지 않으므로 제거 또는 원스토어용 수익화 SDK로 교체
- 실기기에서 WebView 화면, 저장소(localStorage), 뒤로가기, 외부 네트워크 호출 확인

## 메모

원스토어용 수익화는 다음 단계에서 `ONE store IAP` 또는 별도 광고 SDK로 붙이는 것이 좋습니다. 지금 버전은 먼저 제출 가능한 Android 앱 껍데기와 기존 오르락 경험을 분리하는 데 초점을 맞췄습니다.

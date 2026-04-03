---
url: 'https://developers-apps-in-toss.toss.im/learn-more/debugging-webview.md'
---
# 디버깅하기

## Android & Chrome 환경

::: tip 잠시만요

디바이스에서 디버깅할 때는, 디바이스 설정에서 USB 디버깅을 활성화해야 해요.\
`설정 -> 시스템 -> 휴대전화 정보 -> 개발자 옵션 -> USB 디버깅 활성화`

:::

**Chrome Devtools** 를 사용해 디버깅을 할 수 있어요.

1. Android 에뮬레이터나 실제 Android 기기에서 미니앱을 실행합니다.
2. Chrome 브라우저에서 `chrome://inspect/#devices` 페이지를 엽니다.
3. Devices 탭 Remote Target에 디버깅하고자 하는 WebView 콘텐츠 아래에 있는 **inspect** 버튼을 선택합니다.
4. 일반 웹 페이지를 디버깅하듯 WebView 콘텐츠를 디버깅할 수 있어요.

## iOS & Safari 환경

::: tip 잠시만요

* 디바이스에서 디버깅할 때는, 디바이스 설정에서 Web Inspector(웹 검사기)를 활성화해야 해요.
  * 설정 -> Safari -> 고급 -> Web Inspector 활성화
* 개발자용 메뉴에 디바이스가 표시되지 않고, Safari를 시뮬레이터보다 먼저 실행한 경우에는 Safari를 재시작해 보세요.

:::

iOS 시뮬레이터나 실제 디바이스에서 **Safari 개발자 도구(Developer Toolkit)** 를 사용하여 WebView 콘텐츠를 디버깅할 수 있습니다.

1. Safari 환경설정 -> "고급" 탭 -> "웹 개발자를 위한 기능 보기" 체크박스를 활성화해요.
2. iOS 시뮬레이터 또는 실제 iOS 디바이스에서 미니앱을 실행합니다.
3. Safari -> 상단바 개발자용 -> \[디바이스 이름] -> \[앱 이름] -> \[URL - 제목]
4. 이제 웹에서 디버깅하듯 WebView 콘텐츠를 디버깅할 수 있습니다.

# 프로젝트 개발 및 커밋 가이드 (GitHub Copilot Instructions)

이 저장소는 한국폴리텍대학 강서캠퍼스 사이버보안과 1학년 12주차 「비밀번호 보안 도구」 실습 프로젝트입니다.
학생이 `npm create vite@latest .`로 직접 구성한 React(JavaScript) 프로젝트입니다. TypeScript로 변환하지 마세요.

## 보안 코딩 원칙
- 비밀번호 생성 시 절대 `Math.random()`을 사용하지 말고 `window.crypto.getRandomValues()`를 사용하세요.
- 유출 확인은 Have I Been Pwned Pwned Passwords range API(`https://api.pwnedpasswords.com/range/{앞 5글자}`)를 사용하고, 비밀번호나 전체 해시를 외부로 전송하지 마세요. SHA-1 해시는 `crypto.subtle.digest`로 계산하고, 응답과의 대조는 브라우저에서 대문자 기준으로 수행하세요.
- 입력된 비밀번호를 `console.log`로 출력하거나 `localStorage`에 저장하지 마세요.

## Git 커밋 규칙
- 커밋 메시지는 한국어로 작성하되 기술 용어와 코드 표현은 영어 원어를 사용합니다.
- 제목은 50자 내외로 요약하고, 본문에는 주요 변경 사항을 `-` 불릿 포인트로 작성합니다.

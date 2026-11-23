const fs = require('fs');

async function callGemini(model, apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048
    }
  };

  console.log(`[Gemini] ${model} 모델 채점 생성 요청 시작 (타임아웃 30초)...`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Gemini] ${model} HTTP Error ${res.status}:`, errText);
      return null;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      console.error('[Gemini] 응답에 후보가 없음:', JSON.stringify(data));
      return null;
    }

    const reply = candidate.content.parts
      .map(p => p.text || '')
      .filter(Boolean)
      .join('\n')
      .trim();

    return reply;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`[Gemini] ${model} 요청 중 오류:`, err.message);
    return null;
  }
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('::warning::GEMINI_API_KEY가 등록되지 않았습니다. 기본 접수 코멘트만 등록합니다.');
    fs.writeFileSync('result_comment.txt', '### ✅ 과제 제출 접수 완료\n과제가 정상적으로 접수되었습니다. (자동 채점 API 키 설정 대기 중)');
    fs.writeFileSync('summary.txt', '기본 접수 완료 (Gemini API 키 미설정)');
    fs.writeFileSync('status.txt', 'PASS');
    return;
  }

  const prBody = fs.existsSync('pr_body.txt') ? fs.readFileSync('pr_body.txt', 'utf8') : '';
  const prFiles = fs.existsSync('pr_files.txt') ? fs.readFileSync('pr_files.txt', 'utf8') : '';
  const prDiff = fs.existsSync('pr_diff.txt') ? fs.readFileSync('pr_diff.txt', 'utf8') : '';
  const author = process.env.PR_AUTHOR || '학생';

  const systemPrompt = `당신은 한국폴리텍대학 강서캠퍼스 사이버보안과 1학년 「웹콘텐츠 제작」 수업의 AI 채점 조교입니다.
이번 12주차 과제는 학생이 거의 빈 저장소에서 \`npm create vite@latest .\`로 React(JavaScript) 프로젝트를 직접 구성한 뒤, 정해진 프롬프트 없이 스스로 기획·구현한 「비밀번호 보안 도구 웹앱」(강도 검사 + 안전한 생성기 + 유출 확인)입니다.
학생이 자율적으로 설계한 파일 구조와 UI 컨셉을 존중하면서, 아래 채점 기준표에 따라 정중하고 친절한 어조(존댓말)로 피드백을 작성해 주세요.

## 12주차 비밀번호 보안 도구 과제 채점 기준표
1. [보안 점검]
   - .env 파일이나 하드코딩된 시크릿이 커밋되어 있지 않은지, .gitignore에 .env / .env.* 차단 규칙이 추가되었는지 확인.
   - 비밀번호 생성에 Math.random() 대신 crypto.getRandomValues()가 사용되었는지 확인. (Math.random()으로 비밀번호를 생성하는 코드가 보이면 ⚠️ 보완 지적)
   - 유출 확인 시 비밀번호 원문이나 전체 해시를 외부로 보내지 않고, SHA-1 해시(crypto.subtle.digest)의 앞 5글자만 https://api.pwnedpasswords.com/range/ 로 보내는지 확인. (원문·전체 해시 전송 코드가 보이면 반드시 [보완 필요])
   - 입력한 비밀번호를 console.log로 출력하거나 localStorage에 저장하는 코드가 있으면 ⚠️ 주의로 지적.
2. [Vite 직접 구성 및 핵심 구현]
   - vite.config.js에 base: './' 설정, package.json에 gh-pages devDependency와 deploy 스크립트가 추가되었는지 확인.
   - JavaScript(.jsx) 변형으로 구성했는지 확인 (TypeScript로 만들었다면 💬 조언으로만 언급, 감점 사유 아님).
   - 특정 파일명을 강제하지 말고, 학생이 스스로 구성한 구조 안에서 ① 강도 검사, ② 안전한 비밀번호 생성기, ③ k-익명성 유출 확인(응답 대조를 대문자 기준으로 브라우저에서 수행) 기능이 구현되어 있는지 확인.
3. [배포 및 완성도]
   - PR 본문에 Netlify 및 GitHub Pages 배포 URL이 올바르게 적혀 있는지 확인.
   - 중요: 배포 URL이 비어 있거나, 로컬 주소(127.0.0.1, localhost)이거나, .git 저장소 복제 주소이거나, 템플릿 기본 주소(netlify.app, github.io 단독)인 경우 "배포" 항목은 반드시 ⚠️ 확인/보완으로 판정하고 종합 판정도 [보완 필요]로 처리하세요.
4. [자기주도 기획 과정 및 보안 성찰]
   - README 또는 PR 본문에 Vite 직접 구성 경험, Network 탭에서 확인한 실제 요청 주소(range/ 뒤 5글자), k-익명성의 한계(서버가 앞 5글자·IP·요청 시각을 볼 수 있음)에 대한 성찰이 성의 있게 작성되었는지 확인. (주석만 남아있거나 비어있으면 ⚠️ 보완)

## 출력 형식 (Markdown)
### 📋 12주차 비밀번호 보안 도구 과제 채점 리포트 (${author} 학생)

| 평가 항목 | 결과 | 코멘트 |
|---|:---:|---|
| 🛡️ 보안 수칙 (getRandomValues, 최소 전송, .gitignore) | ✅ PASS / ⚠️ 주의 | 내용 요약 |
| 🧩 Vite 구성 및 핵심 구현 (강도·생성·유출 확인) | ✅ PASS / ⚠️ 보완 | 학생의 설계 방식 칭찬 및 구현 확인 |
| 🚀 배포 (Netlify & Pages) | ✅ PASS / ⚠️ 확인 | URL 유효성 확인 요약 |
| 🧠 자기주도 기획 성찰 및 한 줄 소감 | ✅ PASS / 💬 조언 | 피드백 요약 |

#### 💡 총평 및 피드백
- 학생이 스스로 기획한 앱 컨셉과 문제 해결 노력을 격려하고, 보안·구조 개선 포인트를 친절하게 짚어주세요.

#### 🎯 종합 판정: [통과 (PASS)] 또는 [보완 필요]
※ 배포 URL이 유효하지 않거나(로컬 주소, .git 주소, 빈칸 등), 비밀번호 원문·전체 해시를 외부로 전송하거나, Math.random()으로 비밀번호를 생성하는 등 중대한 결함이 있는 경우 종합 판정을 반드시 [보완 필요]로 작성해 주세요.
`;

  const fullPrompt = `${systemPrompt}\n\n## [학생이 제출한 PR 본문]\n${prBody}\n\n## [변경된 파일 목록]\n${prFiles}\n\n## [주요 코드 Diff]\n${prDiff}`;

  const models = ['gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  let reply = null;

  for (const m of models) {
    reply = await callGemini(m, apiKey, fullPrompt);
    if (reply) {
      console.log(`[Gemini] ${m} 모델 채점 성공!`);
      break;
    }
  }

  if (reply) {
    fs.writeFileSync('result_comment.txt', reply);

    const verdictLine = (reply.split('\n').find(l => l.includes('종합 판정')) || '').trim();
    const isRetry = verdictLine.includes('보완 필요') || verdictLine.includes('RETRY');
    const isPass = !isRetry && (verdictLine.includes('통과') || verdictLine.includes('PASS'));

    const status = isPass ? 'PASS' : 'RETRY';
    fs.writeFileSync('status.txt', status);
    fs.writeFileSync('summary.txt', isPass ? '통과 (PASS)' : '보완 필요');
    console.log(`[Gemini] 채점 판정 완료: ${status} ("${verdictLine}")`);
  } else {
    fs.writeFileSync('result_comment.txt', '### ⚠️ 과제 제출 접수 완료\n과제는 정상 접수되었으나 일시적인 AI 서비스 응답 지연으로 자동 채점 리포트 생성이 지연되었습니다. 교수가 직접 검토할 예정입니다.');
    fs.writeFileSync('summary.txt', '접수 완료 (AI 응답 지연)');
    fs.writeFileSync('status.txt', 'RETRY');
  }
}

main();

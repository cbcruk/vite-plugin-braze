# Braze Liquid 실험 정리

Braze 이메일 템플릿(Liquid)을 로컬에서 렌더링하고 검증하려고 진행한 실험들과, 그 과정에서 확인한 내용을 정리한다. 실험 폴더들은 현재 도구(루트의 `pnpm dev` / `pnpm test`)로 통합한 뒤 삭제했다.

## 실험 이력

| 폴더                       | 방식                                                                                                              | 결과                                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `vitejs-vite-rlwztx`       | Vite 커스텀 플러그인 + brazejs. `.liquid`를 `transform`으로 HTML 문자열 모듈로 바꾸고, HMR WebSocket으로 재렌더링 | 현재 도구의 출발점. 템플릿은 hono 쪽보다 이전 버전이라 버림                                                                                   |
| `hono-brazejs`             | HonoX SSR 라우트에서 `engine.renderFile()`                                                                        | 두 템플릿(`weekly-new-positions`, `new-positions`)의 출처. 주간 템플릿은 연차 라벨, 응답률 75% 미만 숨김, `.PNG` 로고 처리가 들어간 최신 버전 |
| `hono-brazejs-wrpdux`      | HonoX + Handlebars                                                                                                | Braze가 아닌 WPoint 이벤트 상세 페이지(`product_1~3`, `is_soldout` 등) 비교용. 이관하지 않음                                                  |
| `vitest-dev-vitest-sfrfp2` | Vitest 인라인 스냅샷으로 brazejs 렌더 결과 검증                                                                   | todo 예제뿐이었지만 "스냅샷으로 템플릿 회귀 검증" 아이디어를 현재 테스트로 확장                                                               |
| `github-yxduua`            | Vituum + `@vituum/vite-plugin-liquid` (LiquidJS)                                                                  | 일반 Liquid라 Braze 전용 문법(`${}`, `abort_message`)을 못 씀. 이관하지 않음                                                                  |

## Braze 문법 ↔ 목 데이터 매핑

brazejs는 컨텍스트 객체의 최상위 키로 Braze 속성을 흉내 낸다.

| 템플릿                                               | 시나리오 JSON                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| `{{${first_name}}}`, `{{${user_id}}}`                | `"first_name"`, `"user_id"`                                         |
| `{{custom_attribute.${email_key}}}`                  | `"custom_attribute": { "email_key": ... }`                          |
| `{% assign jobs = api_trigger_properties.${jobs} %}` | `"api_trigger_properties": { "jobs": [...] }`                       |
| `{% connected_content <url> :save data %}`           | 태그는 `{% comment %}`로 감싸고, 응답 JSON을 `"data"`에 직접 넣는다 |

`connected_content`를 살려 두면 brazejs가 실제로 HTTP 요청을 보낸다. 로컬 검증에서는 응답을 목 데이터로 고정하는 편이 재현성이 좋다.

## brazejs 동작에서 확인한 것

- **`abort_message`가 정상 출력처럼 반환된다.** `renderFile()`과 `parseAndRender()`는 `AbortError`를 잡아서 메시지 문자열을 렌더 결과로 돌려준다. `"api data is null"`이 본문인지 발송 중단인지 구분할 수 없다. 그래서 현재 도구는 `engine.parse()`와 `engine.render()`를 따로 호출해 `AbortError`를 직접 받는다 (`packages/vite-plugin-braze/src/render/render.ts`).
- **`{% abort_message() %}`처럼 인자가 없으면** 메시지는 `message is aborted`가 된다.
- **객체를 그대로 출력하면 Ruby 해시 형태로 나온다.** `{{api_trigger_properties.${company}}}` → `{"name"=>"C"}`. Braze와 같은 동작이다.
- **`"now" | date`는 실행 시각에 따라 달라진다.** 스냅샷 테스트에서는 `vi.setSystemTime`과 `TZ=Asia/Seoul`로 고정한다.
- **Braze와 구현이 다른 필터가 있다.** `url_escape`, `url_param_escape`, `number_with_delimiter`, `json_escape`는 JS 내장 함수로 구현되어 결과가 미세하게 다를 수 있다. 최종 확인은 Braze 대시보드 프리뷰에서 한다.
- **brazejs는 2020-11 릴리스(1.7.1)를 마지막으로 업데이트가 없다.** 이후 LiquidJS에 추가된 태그는 없다. 예를 들어 `{% render %}`는 `tag render not found` 에러가 난다.
- **`default` 필터는 빈 문자열을 비어 있는 값으로 보지 않는다.** `{{ "" | default: "X" }}`는 빈 문자열을 그대로 출력한다. Shopify Liquid는 `""`도 기본값으로 바꾼다. 빈 문자열까지 막으려면 `== blank`로 분기한다.
- **`${attr}` 뒤에 바로 속성을 붙이면 값을 못 읽는다.** `{{ ${first_name}.size }}`는 항상 빈 값이라 `${first_name}.size != 0` 같은 조건은 늘 참이다. `{% assign first_name = ${first_name} %}`로 먼저 변수에 담은 뒤 `first_name == blank`처럼 비교한다.

## 템플릿에서 쓰던 패턴

- **데이터 검증 후 발송 중단:** `data == nil`, `data.positions.size < 3`, `job.position_name == empty` 같은 조건에서 `abort_message`로 발송을 막는다. 현재 `no-data`, `few-positions`, `empty-position-name` 시나리오가 이 분기를 검증한다.
- **트래킹 링크 조립:** `{% capture %}`로 Airbridge URL을 만들고 `term={{ "now" | date: "%Y%m%d" }}`로 발송일을 붙인다.
- **연차 라벨:** `annual_from`/`annual_to` 조합(`0/0 이하` 신입, `0/100` 신입 이상 등)을 `{% capture %}` 안의 `if/elsif`로 문자열화한다.
- **기본값:** `{{${first_name} | default: '회원'}}`. 빈 문자열이 올 수 있는 값(`data.name`, `${first_name}`)은 `assign` 후 `== blank`로 분기한다.

## 목 데이터 원칙

`templates/*/*.json`은 실제 응답을 복사한 값이 아니라 가짜 값으로 만든 목 데이터다.

- **실제 정보를 넣지 않는다.** 회사명은 가상 이름(알파랩스, 베타커머스 등), 사용자는 `홍길동`, ID는 `100001`처럼 범위를 구분한 값을 쓴다. `email_key`는 `mock-email-key`를 base64로 인코딩한 값이다. 로고는 `placehold.co` 플레이스홀더를 쓴다.
- **구조는 실제 API 응답과 같게 유지한다.** 필드명과 타입, `null` 여부를 바꾸지 않는다.
- **값은 템플릿 분기를 모두 거치도록 고른다.** `weekly-new-positions/default.json`의 12개 포지션은 연차 라벨 6개 분기(`0/-1`·`0/0` 신입, `0/100`, `0/n`, `n/100`, `n/m`, `n/n`), 응답률 구간(95%↑, 90~95%, 75~90%, 75% 미만 숨김), `due_date` 유무, `.PNG`/`.png`/`.jpg` 로고, 긴 직무명을 섞어 둔다.
- **분기 하나에 시나리오 하나를 둔다.** 예를 들면 `with-annual`, `with-annual-no-name`, `no-first-name`, `few-jobs`, `last-name-only`, `short-main-tasks`가 있다. 새 분기를 추가하면 그 분기를 검증하는 시나리오 JSON도 함께 추가한다.

## 현재 도구의 설계 결정

- **npm 패키지(`packages/vite-plugin-braze`):** 렌더링은 파일시스템이 필요해 Node에서 하고, 개발 서버와 파일 감시는 Vite 것을 쓴다. 루트 프로젝트는 이 패키지를 `workspace:*`로 설치해 배포 산출물(`dist`)을 그대로 쓴다.
- **템플릿을 모듈 그래프에 넣지 않음:** 기존 실험은 `.liquid`를 `transform`으로 모듈화했지만, 템플릿 하나를 여러 시나리오로 렌더링하고 `ok/aborted/error` 상태를 함께 넘겨야 해서 미들웨어 API(`/__braze/api/templates`, `/__braze/api/render`)로 바꿨다.
- **미리보기 UI는 미리 빌드해서 제공:** 사용하는 프로젝트에 `index.html`이나 클라이언트 코드를 요구하지 않도록 UI를 `dist/client`로 빌드해 `/__braze/`에서 정적 파일로 낸다. 빌드된 UI에서는 `import.meta.hot`을 쓸 수 없어서, 파일 변경은 Vite HMR 대신 SSE(`/__braze/api/events`)로 알린다.
- **테스트 헬퍼는 테스트 API를 주입받음:** `defineBrazeSnapshots(vitest, options)`처럼 호출하는 쪽의 `vitest`(또는 `vite-plus/test`) 네임스페이스를 받는다. 패키지가 직접 `vitest`를 import하면 다른 러너 인스턴스가 잡혀 테스트가 등록되지 않을 수 있기 때문이다.
- **렌더 코드는 Vite와 분리:** `src/render`, `src/catalog`은 Vite에 의존하지 않고 `listTemplates`, `renderScenario`로 export된다. CI용 CLI나 다른 서버가 필요하면 이 둘만 가져다 쓰면 된다.

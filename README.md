# vite-plugin-braze

[![npm](https://img.shields.io/npm/v/vite-plugin-braze)](https://www.npmjs.com/package/vite-plugin-braze)

Braze Liquid 템플릿을 Vite 개발 서버에서 미리보기하고 Vitest로 스냅샷 테스트하는 플러그인. 렌더링은 [brazejs](https://github.com/yq314/brazejs)를 사용한다. Braze, Inc.와 무관한 비공식 도구다.

- 패키지 소스와 영문 문서: [packages/vite-plugin-braze](packages/vite-plugin-braze)
- 실험 이력과 Braze Liquid 메모: [docs/braze-liquid-notes.md](docs/braze-liquid-notes.md)

## 설치

```sh
pnpm add -D vite-plugin-braze
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { brazePreview } from 'vite-plugin-braze'

export default defineConfig({
  plugins: [brazePreview({ root: 'templates' })],
})
```

```ts
// test/templates.test.ts
import * as vitest from 'vitest' // vite-plus 사용 시 'vite-plus/test'
import { defineBrazeSnapshots } from 'vite-plugin-braze/test'

await defineBrazeSnapshots(vitest, {
  root: 'templates',
  now: '2024-06-12T09:00:00+09:00',
})
```

`vite`를 띄운 뒤 `http://localhost:5173/__braze/`에서 미리보기한다. 옵션 전체는 [패키지 README](packages/vite-plugin-braze/README.md) 참고.

## 이 저장소에서 개발하기

루트는 패키지를 `workspace:*`로 설치해 실제 템플릿에 적용해 보는 프로젝트다.

## 구조

```
packages/vite-plugin-braze/   # 배포 패키지 (플러그인, 미리보기 UI, 테스트 헬퍼)
templates/                    # 템플릿과 목 데이터 시나리오
test/                         # 스냅샷 테스트 (vite-plugin-braze/test 사용)
```

### 명령어

```sh
pnpm install
pnpm dev        # 패키지 빌드 후 미리보기 서버 (http://localhost:5173/__braze/)
pnpm test       # 패키지 빌드 후 모든 시나리오 스냅샷 테스트
pnpm typecheck
pnpm check      # vp check (포맷 + 린트)
```

미리보기 UI 자체를 고칠 때는 `pnpm --filter vite-plugin-braze dev`로 소스에서 바로 띄운다 (UI HMR 동작, 템플릿은 루트 `templates/` 사용).

### 템플릿 추가

```
templates/
  <template-name>/
    template.liquid     # Braze에 붙여넣을 본문
    default.json        # 목 데이터 시나리오 (파일명 = 시나리오명)
    no-data.json        # 분기/abort_message 확인용 시나리오 등
```

시나리오 JSON의 키는 Braze 컨텍스트에 대응한다.

- `{{${first_name}}}` → `"first_name"`
- `{{custom_attribute.${key}}}` → `"custom_attribute": { "key": ... }`
- `api_trigger_properties.${key}` → `"api_trigger_properties": { "key": ... }`
- `connected_content :save data` 결과 → `"data"` 에 응답 JSON을 직접 넣고, 태그는 `{% comment %}` 처리

### 렌더 결과

| 상태     | 의미                                        | 스냅샷                                          |
| -------- | ------------------------------------------- | ----------------------------------------------- |
| Rendered | 정상 발송되는 본문                          | `test/__snapshots__/<template>/<scenario>.html` |
| Aborted  | `abort_message` 실행, Braze가 발송하지 않음 | `.../<scenario>.aborted.txt`                    |
| Error    | 파싱/렌더 실패                              | 테스트 실패                                     |

테스트는 `"now"` 날짜를 2024-06-12(Asia/Seoul)로 고정한다. 템플릿을 의도적으로 바꿨다면 `pnpm test -u`로 스냅샷을 갱신한다.

## 배포

1. `packages/vite-plugin-braze/package.json`의 `version`을 올리고 커밋한다.
2. Claude Code 밖의 터미널에서 배포한다. npm 2FA 브라우저 인증이 TTY를 요구한다.
   ```sh
   pnpm --filter vite-plugin-braze publish --access public   # prepublishOnly에서 빌드
   ```
3. 단계적 배포(staged publishing)라서 npmjs.com에서 승인해야 `latest`로 공개된다. 승인 전에는 `0.0.0-stage` 임시 버전만 보인다.
4. 배포한 커밋에 `v<version>` 태그를 붙여 push한다.

## 주의

brazejs는 Braze 구현과 완전히 같지 않다 (`url_escape`, `number_with_delimiter` 등). 최종 확인은 Braze 대시보드 프리뷰에서 한다.

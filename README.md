# braze-x

Braze Liquid 템플릿을 로컬에서 미리보기하고 스냅샷 테스트하는 도구. 실제 기능은 npm 배포용 패키지 [`vite-plugin-braze`](packages/vite-plugin-braze)에 있고, 루트는 그 패키지를 사용하는 실제 템플릿 저장소다. 실험 이력과 Braze Liquid 관련 메모는 [docs/braze-liquid-notes.md](docs/braze-liquid-notes.md) 참고.

## 구조

```
packages/vite-plugin-braze/   # 배포 패키지 (플러그인, 미리보기 UI, 테스트 헬퍼)
templates/                    # 템플릿과 목 데이터 시나리오
test/                         # 스냅샷 테스트 (vite-plugin-braze/test 사용)
```

## 사용법

```sh
pnpm install
pnpm dev        # 패키지 빌드 후 미리보기 서버 (http://localhost:5173/__braze/)
pnpm test       # 패키지 빌드 후 모든 시나리오 스냅샷 테스트
pnpm typecheck
pnpm check      # vp check (포맷 + 린트)
```

미리보기 UI 자체를 고칠 때는 `pnpm --filter vite-plugin-braze dev`로 소스에서 바로 띄운다 (UI HMR 동작, 템플릿은 루트 `templates/` 사용).

## 템플릿 추가

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

## 렌더 결과

| 상태     | 의미                                        | 스냅샷                                          |
| -------- | ------------------------------------------- | ----------------------------------------------- |
| Rendered | 정상 발송되는 본문                          | `test/__snapshots__/<template>/<scenario>.html` |
| Aborted  | `abort_message` 실행, Braze가 발송하지 않음 | `.../<scenario>.aborted.txt`                    |
| Error    | 파싱/렌더 실패                              | 테스트 실패                                     |

테스트는 `"now"` 날짜를 2024-06-12(Asia/Seoul)로 고정한다. 템플릿을 의도적으로 바꿨다면 `pnpm test -u`로 스냅샷을 갱신한다.

## 배포

```sh
cd packages/vite-plugin-braze
pnpm publish    # prepublishOnly에서 빌드
```

## 주의

brazejs는 Braze 구현과 완전히 같지 않다 (`url_escape`, `number_with_delimiter` 등). 최종 확인은 Braze 대시보드 프리뷰에서 한다.

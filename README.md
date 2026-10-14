# braze-x

Braze Liquid 템플릿을 로컬에서 미리보기하고 스냅샷 테스트하는 도구. 렌더링은 [brazejs](https://github.com/yq314/brazejs)를 사용한다. 실험 이력과 Braze Liquid 관련 메모는 [docs/braze-liquid-notes.md](docs/braze-liquid-notes.md) 참고.

## 사용법

```sh
pnpm install
pnpm dev        # 미리보기 서버 (템플릿/JSON 수정 시 자동 갱신)
pnpm test       # 모든 시나리오 스냅샷 테스트
pnpm typecheck
pnpm check      # vp check (포맷 + 린트)
```

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

## 주의

brazejs는 Braze 구현과 완전히 같지 않다 (`url_escape`, `number_with_delimiter` 등). 최종 확인은 Braze 대시보드 프리뷰에서 한다.

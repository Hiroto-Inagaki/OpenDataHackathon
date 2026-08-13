# AI development guide

## Project layout

- `frontend/`: UIとAPIクライアント
- `backend/`: Hono + Cloudflare Workers API
- `shared/contracts/`: フロントとバックの共通契約
- `docs/api.md`: API仕様
- `docs/decisions/`: 設計判断

## Rules

- 作業前に対象領域のREADMEと `docs/api.md` を確認する。
- APIの入出力を変更する場合、仕様と共通契約を同じ変更に含める。
- 担当外領域を変更する必要がある場合、その理由と影響を明記する。
- 秘密情報をコミットしない。
- 実装後は対象領域のテスト、型チェック、またはdry-runを実行する。

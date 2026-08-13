# Open Data Hackathon

フロントエンドとバックエンドを分担して開発するためのモノレポです。

## ディレクトリ

```text
.
├─ frontend/          # UI担当
│  ├─ public/         # 静的ファイル
│  └─ src/            # フロントエンドのソース
├─ backend/           # API担当（Hono + Cloudflare Workers）
│  └─ src/
├─ shared/
│  └─ contracts/      # APIの型・スキーマなど両者の共通契約
└─ docs/
   ├─ decisions/      # 設計判断（ADR）
   └─ api.md           # API仕様
```

## バックエンドの起動

```powershell
cd backend
npm install
npm run dev
```

## 開発ルール

- フロント担当は原則 `frontend/`、バック担当は原則 `backend/` を変更します。
- APIの入出力を変更するときは、実装前に `docs/api.md` と `shared/contracts/` を更新します。
- 複数領域にまたがる変更は、Pull Requestに影響範囲を記載します。
- 重要な技術判断とその理由は `docs/decisions/` に残します。


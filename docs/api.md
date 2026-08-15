# API specification

APIのエンドポイント、リクエスト、レスポンス、エラー形式を記録します。

## Health check

### `GET /`

Cloudflare Workerの動作確認用エンドポイントです。

Response: `200 text/plain`

```text
Hello Hono!
```

## 地点検索（ジオコーディング）

### `GET /api/geocode`

目的地検索画面（FR-01-01）から呼び出す。OpenStreetMap Nominatimの検索APIをサーバー側でプロキシする。

Query parameters:

| 名前 | 必須 | 説明 |
| --- | --- | --- |
| `q` | ○ | 検索キーワード（地点名・住所等） |

Response: `200 application/json`

```json
{
  "results": [
    {
      "id": "12345",
      "name": "東京タワー",
      "address": "東京タワー, 芝公園4丁目, 港区, 東京都, 105-0011, 日本",
      "latitude": 35.6585805,
      "longitude": 139.7454329
    }
  ]
}
```

Errors:

| ステータス | 条件 |
| --- | --- |
| `400` | `q` が指定されていない |
| `502` | Nominatim側への通信に失敗、またはNominatimがエラーを返した |

利用API: [Nominatim Search API](https://nominatim.org/release-docs/latest/api/Search/)（OpenStreetMapデータ、ODbLライセンス）。利用ポリシーに従い、リクエストヘッダーに識別可能な `User-Agent` を付与する。


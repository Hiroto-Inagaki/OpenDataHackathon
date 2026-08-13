# API specification

APIのエンドポイント、リクエスト、レスポンス、エラー形式を記録します。

## Health check

### `GET /`

Cloudflare Workerの動作確認用エンドポイントです。

Response: `200 text/plain`

```text
Hello Hono!
```


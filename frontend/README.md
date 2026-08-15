# Frontend

React NativeとExpoを使用したスマートフォンアプリです。

## 必要環境

- Node.js
- npm
- AndroidまたはiOS端末のExpo Go（実機確認時）

## セットアップ

```powershell
cd frontend
npm.cmd install
```

PowerShellの実行ポリシーによって `npm` が実行できない場合は、Windows用の `npm.cmd` を使用します。

## 起動

```powershell
npm.cmd start
```

表示されたQRコードをExpo Goで読み取ります。PCと端末は原則として同じネットワークに接続してください。

接続できない場合は、トンネル接続を利用できます。

```powershell
npx.cmd expo start --tunnel
```

## その他のコマンド

```powershell
npm.cmd run android
npm.cmd run ios
npm.cmd run web
npm.cmd run typecheck
```

`npm run ios` によるiOS Simulatorのローカル起動にはmacOSが必要です。WindowsではExpo GoをインストールしたiPhoneで実機確認できます。

バックエンドAPIのURLは環境変数 `EXPO_PUBLIC_API_BASE_URL` で切り替えます（未設定時は `http://localhost:8787`）。API仕様は [`../docs/api.md`](../docs/api.md) を参照してください。

## MVP実装メモ

- 画面: 目的地設定画面(`src/screens/DestinationScreen.tsx`)、案内画面(`src/screens/GuidanceScreen.tsx`)。権限確認・エラー表示は`src/screens/PermissionRationaleScreen.tsx` / `PermissionErrorScreen.tsx`。
- 地図はLeaflet + OpenStreetMapタイルをWebView(ネイティブ)/iframe(Web)で表示します（`src/components/DestinationMap.tsx` / `.web.tsx`）。
- 地点検索はバックエンドの `/api/geocode`（Nominatim経由）を呼び出します。
- 距離・方位角の計算は `src/lib/geo.ts`（Haversine formula）。
- 位置情報の取得・監視は `src/hooks/useCurrentLocation.ts`、方位センサーは `src/hooks/useHeading.ts`（Web等センサー利用不能時は地理的な北基準の表示にフォールバック）。
- 散歩開始・終了・目的地はすべてメモリ上の状態（`App.tsx`）で管理し、永続保存やサーバー同期は行いません。

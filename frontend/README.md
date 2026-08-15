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

APIのURLは今後、環境変数で切り替えます。API仕様は [`../docs/api.md`](../docs/api.md) を参照してください。

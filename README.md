# Electron MCP Server 🚀

**ElectronでModel Context Protocol (MCP) サーバを実装したアプリケーション**

ElectronアプリケーションとしてMCPサーバを起動し、Claude DesktopなどのAIアプリケーションから簡単に利用できるようにします。npxやNode.jsのインストールが不要で、エンジニアでない方でも簡単に使用できます。

## 特徴

- ✅ **簡単起動**: Electronアプリとして起動するだけでMCPサーバが開始
- ✅ **Streamable HTTP対応**: 最新のMCP仕様に準拠
- ✅ **GUI管理**: サーバー状態の監視と制御が可能
- ✅ **クロスプラットフォーム**: Windows、macOS、Linuxで動作
- ✅ **npx不要**: 実行ファイルとして配布可能

## クイックスタート

### 開発環境での実行

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **アプリケーションの起動**
   ```bash
   npm start
   ```

3. **開発モードで起動**（DevToolsが開きます）
   ```bash
   npm run dev
   ```

アプリケーションが起動すると、自動的にポート3999でMCPサーバが開始されます。

### MCPエンドポイント

- **メインエンドポイント**: `http://localhost:3999/mcp`
- **ヘルスチェック**: `http://localhost:3999/health`

## Claude Desktopでの設定

Claude Desktopの設定ファイル（`claude_desktop_config.json`）に以下を追加：

```json
{
  "mcpServers": {
    "electron-mcp-server": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-d", "{\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-01-01\",\"capabilities\":{},\"clientInfo\":{\"name\":\"claude-desktop\",\"version\":\"1.0.0\"}},\"id\":1}",
        "http://localhost:3999/mcp"
      ]
    }
  }
}
```

## 利用可能なツール

### 1. ping
サーバーの応答確認用ツール
```json
{
  "method": "tools/call",
  "params": {
    "name": "ping",
    "arguments": {
      "message": "Hello World"
    }
  }
}
```

### 2. echo
メッセージをそのまま返すツール
```json
{
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {
      "message": "返したいメッセージ"
    }
  }
}
```

### 3. get_server_info
サーバー情報を取得するツール
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_server_info",
    "arguments": {}
  }
}
```

## API使用例

### ツール一覧の取得
```bash
curl -X POST http://localhost:3999/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list", "id": 1}'
```

### pingツールの実行
```bash
curl -X POST http://localhost:3999/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "ping", "arguments": {"message": "Test"}}, "id": 2}'
```

## ビルドと配布

### 実行ファイルの作成

#### ローカルでのビルド

**環境変数を設定してビルド：**
```bash
# GitHub Personal Access Tokenを設定
export GH_TOKEN=your_github_token

# Windows向け
npm run build:win

# macOS向け
npm run build:mac

# Linux向け
npm run build:linux
```

**または.envファイルを使用：**
```bash
# .env.exampleをコピーして設定
cp .env.example .env
# .envファイルを編集してGH_TOKENを設定
npm run build:win
```

#### GitHub Actionsでの自動ビルド

1. リポジトリの**Settings** → **Secrets and variables** → **Actions**
2. `ELECTRON_GITHUB_TOKEN`をRepository Secretとして追加
3. タグをpushまたはworkflow_dispatchで自動ビルド

ビルドされたファイルは`dist/`フォルダに出力されます。

> **⚠️ セキュリティ注意**: `.env`ファイルは絶対にリポジトリにコミットしないでください。

## 開発

### プロジェクト構造

```
electron-mcp/
├── src/
│   ├── main.js          # Electronメインプロセス
│   ├── mcp-server.js    # MCPサーバー実装
│   └── preload.js       # プリロードスクリプト
├── public/
│   ├── index.html       # UI
│   ├── style.css        # スタイル
│   └── renderer.js      # レンダラープロセス
├── package.json
└── README.md
```

### カスタムツールの追加

`src/mcp-server.js`の`setupMCPHandlers()`メソッドで新しいツールを追加できます：

```javascript
// tools/listハンドラーにツールを追加
{
  name: 'my_custom_tool',
  description: 'カスタムツールの説明',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'パラメータの説明'
      }
    },
    required: ['param1']
  }
}

// tools/callハンドラーに処理を追加
case 'my_custom_tool':
  return {
    content: [{
      type: 'text',
      text: `結果: ${args.param1}`
    }]
  };
```

## トラブルシューティング

### ポート3999が使用中の場合

環境変数`MCP_PORT`でポートを変更できます：

```bash
MCP_PORT=4000 npm start
```

### WSL環境でのDBusエラー

WSL環境では以下のエラーが表示される場合がありますが、アプリケーションの動作には影響しません：

```
ERROR:object_proxy.cc(577)] Failed to call method: org.freedesktop.DBus.StartServiceByName
```

## ライセンス

MIT License

## 技術スタック

- **Electron**: ^28.0.0
- **Express**: ^4.18.2
- **@modelcontextprotocol/sdk**: ^0.5.0
- **CORS**: ^2.8.5

## 貢献

Issues、Pull Requestを歓迎します。

## リンク

- [Model Context Protocol公式サイト](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/desktop)
- [Electron公式サイト](https://www.electronjs.org/)
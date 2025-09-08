# Electron MCP Server 🚀

**Model Context Protocol (MCP) Server Application built with Electron**

Launch MCP server as an Electron application for easy use with AI applications like Claude Desktop. No npx or Node.js installation required, making it accessible to non-engineers.

## Features

- ✅ **Easy Launch**: Start MCP server simply by launching the Electron app
- ✅ **Streamable HTTP Support**: Compliant with the latest MCP specifications
- ✅ **GUI Management**: Monitor and control server status
- ✅ **Cross-platform**: Works on Windows, macOS, and Linux
- ✅ **No npx Required**: Can be distributed as an executable file

## Quick Start

### Running in Development Environment

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Launch Application**
   ```bash
   npm start
   ```

3. **Launch in Development Mode** (Opens DevTools)
   ```bash
   npm run dev
   ```

When the application launches, the MCP server automatically starts on port 3999.

### MCP Endpoints

- **Main Endpoint**: `http://localhost:3999/mcp`
- **Health Check**: `http://localhost:3999/health`

## Claude Desktop Configuration

Add the following to Claude Desktop's configuration file (`claude_desktop_config.json`):

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

## Available Tools

### 1. ping
Tool for checking server response
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
Tool that returns messages as-is
```json
{
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {
      "message": "Message to return"
    }
  }
}
```

### 3. get_server_info
Tool to get server information
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_server_info",
    "arguments": {}
  }
}
```

## API Usage Examples

### Get Tool List
```bash
curl -X POST http://localhost:3999/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list", "id": 1}'
```

### Execute ping Tool
```bash
curl -X POST http://localhost:3999/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "ping", "arguments": {"message": "Test"}}, "id": 2}'
```

## Build and Distribution

### Creating Executable Files

#### Local Build

**Build with environment variables:**
```bash
# Set GitHub Personal Access Token
export GH_TOKEN=your_github_token

# For Windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

**Or use .env file:**
```bash
# Copy .env.example and configure
cp .env.example .env
# Edit .env file to set GH_TOKEN
npm run build:win
```

#### Automatic Build with GitHub Actions

1. Repository **Settings** → **Secrets and variables** → **Actions**
2. Add `ELECTRON_GITHUB_TOKEN` as Repository Secret
3. Auto-build by pushing tag or workflow_dispatch

Built files are output to the `dist/` folder.

> **⚠️ Security Notice**: Never commit `.env` file to the repository.

## Development

### Project Structure

```
electron-mcp/
├── src/
│   ├── main.js          # Electron main process
│   ├── mcp-server.js    # MCP server implementation
│   └── preload.js       # Preload script
├── public/
│   ├── index.html       # UI
│   ├── style.css        # Styles
│   └── renderer.js      # Renderer process
├── package.json
└── README.md
```

### Adding Custom Tools

You can add new tools in the `setupMCPHandlers()` method of `src/mcp-server.js`:

```javascript
// Add tool to tools/list handler
{
  name: 'my_custom_tool',
  description: 'Custom tool description',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description'
      }
    },
    required: ['param1']
  }
}

// Add processing to tools/call handler
case 'my_custom_tool':
  return {
    content: [{
      type: 'text',
      text: `Result: ${args.param1}`
    }]
  };
```

## Troubleshooting

### When Port 3999 is in Use

You can change the port with environment variable `MCP_PORT`:

```bash
MCP_PORT=4000 npm start
```

### DBus Error in WSL Environment

In WSL environment, the following error may appear but does not affect application functionality:

```
ERROR:object_proxy.cc(577)] Failed to call method: org.freedesktop.DBus.StartServiceByName
```

## License

MIT License

## Technology Stack

- **Electron**: ^28.0.0
- **Express**: ^4.18.2
- **@modelcontextprotocol/sdk**: ^0.5.0
- **CORS**: ^2.8.5

## Contributing

Issues and Pull Requests are welcome.

## Links

- [Model Context Protocol Official Site](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/desktop)
- [Electron Official Site](https://www.electronjs.org/)
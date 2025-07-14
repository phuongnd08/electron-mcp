import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';

class ElectronMCPServer {
  constructor(port = 3999) {
    this.port = port;
    this.app = express();
    this.server = new Server(
      {
        name: 'electron-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );
    
    this.setupMiddleware();
    this.setupMCPHandlers();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.text());
  }

  setupMCPHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'ping',
          description: 'Simple ping tool that returns pong',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Message to echo back',
              },
            },
          },
        },
        {
          name: 'echo',
          description: 'Echo back the provided message',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Message to echo back',
              },
            },
            required: ['message'],
          },
        },
        {
          name: 'get_server_info',
          description: 'Get information about the Electron MCP server',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'ping':
          return {
            content: [
              {
                type: 'text',
                text: `Pong! ${args?.message || 'Hello from Electron MCP Server'}`,
              },
            ],
          };

        case 'echo':
          return {
            content: [
              {
                type: 'text',
                text: args.message,
              },
            ],
          };

        case 'get_server_info':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  name: 'Electron MCP Server',
                  version: '1.0.0',
                  port: this.port,
                  status: 'running',
                  timestamp: new Date().toISOString(),
                  capabilities: ['tools', 'ping', 'echo'],
                }, null, 2),
              },
            ],
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        server: 'Electron MCP Server',
        port: this.port,
        timestamp: new Date().toISOString(),
      });
    });

    // Streamable HTTP MCP endpoint
    this.app.post('/mcp', async (req, res) => {
      try {
        // Handle MCP Streamable HTTP transport
        const sessionId = req.headers['mcp-session-id'] || this.generateSessionId();
        
        // Set CORS headers for MCP
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id');
        
        if (sessionId) {
          res.header('Mcp-Session-Id', sessionId);
        }

        // Process MCP request manually
        const mcpRequest = req.body;
        
        // Handle different MCP request types directly
        let result;
        
        switch (mcpRequest.method) {
          case 'initialize':
            result = {
              id: mcpRequest.id,
              result: {
                protocolVersion: '2025-01-01',
                capabilities: {
                  tools: {},
                },
                serverInfo: {
                  name: 'electron-mcp-server',
                  version: '1.0.0',
                },
              },
            };
            break;
            
          case 'tools/list':
            // Manually return tools list
            result = {
              id: mcpRequest.id,
              result: {
                tools: [
                  {
                    name: 'ping',
                    description: 'Simple ping tool that returns pong',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                          description: 'Message to echo back',
                        },
                      },
                    },
                  },
                  {
                    name: 'echo',
                    description: 'Echo back the provided message',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                          description: 'Message to echo back',
                        },
                      },
                      required: ['message'],
                    },
                  },
                  {
                    name: 'get_server_info',
                    description: 'Get information about the Electron MCP server',
                    inputSchema: {
                      type: 'object',
                      properties: {},
                    },
                  },
                ],
              },
            };
            break;
            
          case 'tools/call':
            // Manually handle tool calls
            const { name, arguments: args } = mcpRequest.params;
            let toolResult;

            switch (name) {
              case 'ping':
                toolResult = {
                  content: [
                    {
                      type: 'text',
                      text: `Pong! ${args?.message || 'Hello from Electron MCP Server'}`,
                    },
                  ],
                };
                break;

              case 'echo':
                toolResult = {
                  content: [
                    {
                      type: 'text',
                      text: args.message,
                    },
                  ],
                };
                break;

              case 'get_server_info':
                toolResult = {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify({
                        name: 'Electron MCP Server',
                        version: '1.0.0',
                        port: this.port,
                        status: 'running',
                        timestamp: new Date().toISOString(),
                        capabilities: ['tools', 'ping', 'echo'],
                      }, null, 2),
                    },
                  ],
                };
                break;

              default:
                throw new Error(`Unknown tool: ${name}`);
            }
            
            result = {
              id: mcpRequest.id,
              result: toolResult,
            };
            break;
            
          default:
            throw new Error(`Unknown method: ${mcpRequest.method}`);
        }
        
        res.json(result);
      } catch (error) {
        console.error('MCP request error:', error);
        res.status(500).json({
          error: {
            code: -32603,
            message: 'Internal error',
            data: error.message,
          },
          id: req.body?.id || null,
        });
      }
    });

    // Handle GET requests to /mcp for information
    this.app.get('/mcp', (req, res) => {
      res.json({
        message: 'MCP (Model Context Protocol) Server',
        description: 'This is a Streamable HTTP MCP server endpoint. Use POST requests to interact with the server.',
        version: '1.0.0',
        endpoints: {
          health: 'GET /health',
          mcp: 'POST /mcp'
        },
        usage: {
          initialize: {
            method: 'POST',
            endpoint: '/mcp',
            body: {
              method: 'initialize',
              params: {
                protocolVersion: '2025-01-01',
                capabilities: {},
                clientInfo: {
                  name: 'your-client',
                  version: '1.0.0'
                }
              },
              id: 1
            }
          },
          listTools: {
            method: 'POST',
            endpoint: '/mcp',
            body: {
              method: 'tools/list',
              id: 2
            }
          }
        },
        timestamp: new Date().toISOString()
      });
    });

    // Handle OPTIONS requests for CORS
    this.app.options('/mcp', (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id');
      res.sendStatus(200);
    });
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer = this.app.listen(this.port, () => {
          console.log(`Electron MCP Server running on port ${this.port}`);
          console.log(`MCP endpoint: http://localhost:${this.port}/mcp`);
          console.log(`Health check: http://localhost:${this.port}/health`);
          resolve();
        });

        this.httpServer.on('error', (error) => {
          console.error('Server error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.httpServer) {
        this.httpServer.close(() => {
          console.log('Electron MCP Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getStatus() {
    return {
      running: !!this.httpServer?.listening,
      port: this.port,
      endpoint: `http://localhost:${this.port}/mcp`,
    };
  }
}

export default ElectronMCPServer;
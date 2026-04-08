# ACP SDK Reference

## Package Information

```bash
npm install @agentclientprotocol/sdk
```

**Package**: `@agentclientprotocol/sdk`
**Version**: ^0.14.1
**Repository**: https://github.com/agentclientprotocol/typescript-sdk
**Documentation**: https://agentclientprotocol.com/libraries/typescript

## AcpClient

### Constructor

```typescript
import { AcpClient } from '@agentclientprotocol/sdk';

const client = new AcpClient({
  stdin: process.stdin,      // NodeJS.ReadStream
  stdout: process.stdout,    // NodeJS.WriteStream
});
```

### Methods

#### `initialize(params: InitializeParams): Promise<void>`

Initialize the ACP session.

```typescript
interface InitializeParams {
  name: string;           // Agent name
  version: string;        // Agent version
  capabilities?: string[]; // Optional capabilities
}

// Example
await client.initialize({
  name: 'video-pipeline-agent',
  version: '1.0.0',
});
```

#### `sendMessage(message: Message): Promise<void>`

Send a message to the agent.

```typescript
interface Message {
  role: 'user' | 'assistant';
  content?: string;
  context?: Record<string, any>;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
}

// Example
await client.sendMessage({
  role: 'user',
  content: 'Generate video idea',
  context: { projectPath: './content' },
});
```

#### `onMessage(handler: (message: Message) => void): void`

Listen for incoming messages from the agent.

```typescript
client.onMessage((message: Message) => {
  console.log('Received:', message.content);
});
```

#### `shutdown(): Promise<void>`

Gracefully close the session.

```typescript
await client.shutdown();
```

## Types

### Message

```typescript
interface Message {
  role: 'user' | 'assistant';
  content?: string;
  reasoning?: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
}
```

### ToolCall

```typescript
interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}
```

### ToolResult

```typescript
interface ToolResult {
  id: string;
  result: any;
  error?: string;
}
```

## JSON-RPC Protocol

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "method/name",
  "params": {}
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {}
}
```

### Error Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  }
}
```

## Standard Methods

| Method | Description |
|--------|-------------|
| `initialize` | Initialize ACP session |
| `session/prompt` | Send prompt to agent |
| `session/update` | Update session context |
| `fs/read_text_file` | Read file content |
| `fs/write_text_file` | Write file content |
| `terminal/create` | Create terminal |
| `terminal/input` | Send input to terminal |
| `terminal/output` | Read terminal output |

## Error Codes

| Code | Meaning |
|------|---------|
| -32700 | Parse error |
| -32600 | Invalid Request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |

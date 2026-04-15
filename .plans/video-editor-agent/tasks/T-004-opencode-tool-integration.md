# T-004: OpenCode Tool Integration

## Objective
Implementar la tool `editSceneCode` que invoca OpenCode vía ACP para generar/editar código Remotion.

## Requirements
- FR-004: OpenCode Integration via Tool
- Reutilizar: `api/core/opencode/acp-client.ts`

## Implementation

### 1. Tool: editSceneCode

**File: `src/agent/video-editor/tools/editSceneCode.ts`**
```typescript
import { z } from 'zod';
import type { Tool } from 'ai';
import { AcpClient } from '../../../core/opencode/acp-client';

const editSceneCodeSchema = z.object({
  description: z.string().describe('Description of what code to generate'),
  sceneType: z.enum(['hook', 'stats', 'cta', 'transition']).optional(),
  currentCode: z.string().optional().describe('Current code if editing existing'),
  requirements: z.array(z.string()).optional().describe('Specific requirements'),
});

export type EditSceneCodeInput = z.infer<typeof editSceneCodeSchema>;

export interface EditSceneCodeResult {
  code: string;
  filename: string;
  language: 'typescript';
  explanation: string;
}

export function createEditSceneCodeTool(acpClient: AcpClient): Tool {
  return {
    description: `Generate or edit React/TypeScript code for video scenes using Remotion.
Use this tool when the user wants to:
- Create a new scene
- Modify existing scene code
- Add animations or effects
- Change layout or styling

The tool invokes OpenCode (via ACP) which is optimized for code generation.`,
    parameters: editSceneCodeSchema,
    execute: async (input: EditSceneCodeInput): Promise<EditSceneCodeResult> => {
      const sessionId = `scene-edit-${Date.now()}`;

      try {
        // Connect to OpenCode ACP
        await acpClient.connect(sessionId);

        // Build prompt for OpenCode
        const prompt = buildOpenCodePrompt(input);

        // Send prompt and get response
        const response = await acpClient.sendPrompt(prompt);

        // Extract code from response (assuming OpenCode returns markdown code blocks)
        const code = extractCodeFromResponse(response.content);
        const explanation = extractExplanationFromResponse(response.content);

        return {
          code,
          filename: 'scene.tsx',
          language: 'typescript',
          explanation,
        };
      } finally {
        // Always cleanup
        await acpClient.shutdown();
      }
    },
  };
}

function buildOpenCodePrompt(input: EditSceneCodeInput): string {
  const parts = [
    `Generate Remotion (React + TypeScript) code for an Instagram Reel scene.`,
    ``,
    `Description: ${input.description}`,
  ];

  if (input.sceneType) {
    parts.push(`Scene Type: ${input.sceneType}`);
  }

  if (input.currentCode) {
    parts.push(``,
      `Current code to modify:`,
      `\`\`\`typescript`,
      input.currentCode,
      `\`\`\``,n  }

  if (input.requirements && input.requirements.length > 0) {
    parts.push(``, `Requirements:`, ...input.requirements.map(r => `- ${r}`));
  }

  parts.push(
    ``,
    `GUIDELINES:`,
    `- Use Remotion components (AbsoluteFill, useCurrentFrame, interpolate)`,
    `- 9:16 aspect ratio (1080x1920)`,
    `- Export default component`,
    `- Include TypeScript types`,
    `- Return ONLY the code, wrapped in markdown code blocks`,
    `- Add brief explanation after the code`
  );

  return parts.join('\n');
}

function extractCodeFromResponse(content: string): string {
  // Extract code from markdown code blocks
  const codeBlockMatch = content.match(/```(?:typescript|tsx)?\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // If no code block, return everything (fallback)
  return content.trim();
}

function extractExplanationFromResponse(content: string): string {
  // Extract text after code block
  const parts = content.split(/```(?:typescript|tsx)?\n[\s\S]*?```/);
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return '';
}
```

### 2. Registro de Tools

**File: `src/agent/video-editor/tools/index.ts`**
```typescript
import { createEditSceneCodeTool } from './editSceneCode';
import { AcpClient } from '../../../core/opencode/acp-client';
import type { Tool } from 'ai';

export interface VideoEditorTools {
  editSceneCode: Tool;
  // Future tools:
  // updateSceneConfig: Tool;
  // generateVideo: Tool;
}

export function createVideoEditorTools(acpClient: AcpClient): VideoEditorTools {
  return {
    editSceneCode: createEditSceneCodeTool(acpClient),
  };
}

export * from './editSceneCode';
```

### 3. Integración con VideoEditorAgent

**Update: `src/agent/video-editor/VideoEditorAgent.ts`**

```typescript
import { createVideoEditorTools } from './tools';
import { AcpClient } from '../../core/opencode/acp-client';

export class VideoEditorAgent extends Agent {
  constructor(config: VideoEditorConfig) {
    super(config);

    // Initialize ACP client
    const acpClient = new AcpClient({
      apiKey: process.env.OPENCODE_API_KEY,
    });

    // Register tools
    const tools = createVideoEditorTools(acpClient);
    Object.entries(tools).forEach(([name, tool]) => {
      this.registerTool(name, tool);
    });
  }
}
```

## Verification

- [ ] Tool `editSceneCode` se registra correctamente en el agente
- [ ] AcpClient se inicializa con configuración correcta
- [ ] Prompt se construye con toda la información necesaria
- [ ] Código se extrae correctamente de la respuesta de OpenCode
- [ ] Shutdown de ACP siempre se ejecuta (try/finally)
- [ ] Error handling para fallos de conexión ACP

## Dependencies
- T-003: VideoEditorAgent Implementation
- T-002: Agent Core Infrastructure (para Tool type)
- `api/core/opencode/acp-client.ts` (existente)

## Estimated Effort
4-5 hours

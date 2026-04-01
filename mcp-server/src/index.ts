#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';

import { promptTools, handlePromptTool } from './tools/prompts.js';
import { folderTools, handleFolderTool } from './tools/folders.js';
import { tagTools, handleTagTool } from './tools/tags.js';

// Create server instance
const server = new Server(
  {
    name: 'prompt-repo',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// All available tools
const allTools = [...promptTools, ...folderTools, ...tagTools];

// Prompt tool names
const promptToolNames = new Set(promptTools.map(t => t.name));
const folderToolNames = new Set(folderTools.map(t => t.name));
const tagToolNames = new Set(tagTools.map(t => t.name));

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Route to appropriate handler
    if (promptToolNames.has(name)) {
      return await handlePromptTool(name, args || {});
    }

    if (folderToolNames.has(name)) {
      return await handleFolderTool(name, args || {});
    }

    if (tagToolNames.has(name)) {
      return await handleTagTool(name, args || {});
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Prompt Repository MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

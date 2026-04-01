import { z } from 'zod';
import * as db from '../db.js';

// Tool definitions for prompts
export const promptTools = [
  {
    name: 'list_prompts',
    description: 'List all prompts, optionally filtered by folder or tag',
    inputSchema: {
      type: 'object' as const,
      properties: {
        folder_id: {
          type: 'string',
          description: 'Filter prompts by folder ID',
        },
        tag: {
          type: 'string',
          description: 'Filter prompts by tag name',
        },
      },
    },
  },
  {
    name: 'get_prompt',
    description: 'Get a single prompt by ID with its full content',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'The prompt ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'search_prompts',
    description: 'Search prompts by title or content',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query to match against prompt title and content',
        },
        folder_id: {
          type: 'string',
          description: 'Optionally limit search to a specific folder',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_prompt',
    description: 'Create a new prompt in a folder',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'The prompt title',
        },
        content: {
          type: 'string',
          description: 'The prompt content/text',
        },
        folder_id: {
          type: 'string',
          description: 'The folder ID to create the prompt in',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional array of tags to add to the prompt',
        },
      },
      required: ['title', 'content', 'folder_id'],
    },
  },
  {
    name: 'update_prompt',
    description: 'Update an existing prompt',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'The prompt ID to update',
        },
        title: {
          type: 'string',
          description: 'New title (optional)',
        },
        content: {
          type: 'string',
          description: 'New content (optional)',
        },
        folder_id: {
          type: 'string',
          description: 'New folder ID to move the prompt to (optional)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags (replaces existing tags)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_prompt',
    description: 'Delete a prompt by ID',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'The prompt ID to delete',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'copy_prompt',
    description: 'Get prompt content ready to use (returns just the content)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'The prompt ID to copy',
        },
      },
      required: ['id'],
    },
  },
];

// Tool handlers
export async function handlePromptTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  switch (name) {
    case 'list_prompts': {
      let prompts;
      if (args.folder_id) {
        prompts = await db.getPromptsByFolder(args.folder_id as string);
      } else if (args.tag) {
        prompts = await db.getPromptsByTag(args.tag as string);
      } else {
        prompts = await db.getPrompts();
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              prompts.map(p => ({
                id: p.id,
                title: p.title,
                folderId: p.folderId,
                tags: p.tags,
                contentPreview: p.content.substring(0, 100) + (p.content.length > 100 ? '...' : ''),
              })),
              null,
              2
            ),
          },
        ],
      };
    }

    case 'get_prompt': {
      const prompt = await db.getPrompt(args.id as string);
      if (!prompt) {
        return {
          content: [{ type: 'text', text: `Prompt not found: ${args.id}` }],
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(prompt, null, 2) }],
      };
    }

    case 'search_prompts': {
      const prompts = await db.searchPrompts(
        args.query as string,
        args.folder_id as string | undefined
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              prompts.map(p => ({
                id: p.id,
                title: p.title,
                folderId: p.folderId,
                tags: p.tags,
                contentPreview: p.content.substring(0, 150) + (p.content.length > 150 ? '...' : ''),
              })),
              null,
              2
            ),
          },
        ],
      };
    }

    case 'create_prompt': {
      const prompt = await db.createPrompt(
        args.title as string,
        args.content as string,
        args.folder_id as string,
        (args.tags as string[]) || []
      );
      return {
        content: [
          {
            type: 'text',
            text: `Created prompt "${prompt.title}" with ID: ${prompt.id}\n\n${JSON.stringify(prompt, null, 2)}`,
          },
        ],
      };
    }

    case 'update_prompt': {
      const existing = await db.getPrompt(args.id as string);
      if (!existing) {
        return {
          content: [{ type: 'text', text: `Prompt not found: ${args.id}` }],
        };
      }

      const prompt = await db.updatePrompt(
        args.id as string,
        (args.title as string) || existing.title,
        (args.content as string) || existing.content,
        (args.folder_id as string) || existing.folderId,
        (args.tags as string[]) || existing.tags
      );
      return {
        content: [
          {
            type: 'text',
            text: `Updated prompt "${prompt.title}"\n\n${JSON.stringify(prompt, null, 2)}`,
          },
        ],
      };
    }

    case 'delete_prompt': {
      const existing = await db.getPrompt(args.id as string);
      if (!existing) {
        return {
          content: [{ type: 'text', text: `Prompt not found: ${args.id}` }],
        };
      }
      await db.deletePrompt(args.id as string);
      return {
        content: [
          {
            type: 'text',
            text: `Deleted prompt "${existing.title}" (ID: ${args.id})`,
          },
        ],
      };
    }

    case 'copy_prompt': {
      const prompt = await db.getPrompt(args.id as string);
      if (!prompt) {
        return {
          content: [{ type: 'text', text: `Prompt not found: ${args.id}` }],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: prompt.content,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown prompt tool: ${name}`);
  }
}

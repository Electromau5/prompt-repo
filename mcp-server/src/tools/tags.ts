import * as db from '../db.js';

// Tool definitions for tags
export const tagTools = [
  {
    name: 'list_tags',
    description: 'List all available tags',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'list_tag_categories',
    description: 'List all tag categories with their associated tags',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

// Tool handlers
export async function handleTagTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  switch (name) {
    case 'list_tags': {
      const tags = await db.getTags();
      return {
        content: [
          {
            type: 'text',
            text: tags.length > 0
              ? `Available tags (${tags.length}):\n\n${tags.join(', ')}`
              : 'No tags found.',
          },
        ],
      };
    }

    case 'list_tag_categories': {
      const categories = await db.getTagCategories();
      if (categories.length === 0) {
        return {
          content: [{ type: 'text', text: 'No tag categories found.' }],
        };
      }

      const formatted = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        tags: cat.tags,
        tagCount: cat.tags.length,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formatted, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tag tool: ${name}`);
  }
}

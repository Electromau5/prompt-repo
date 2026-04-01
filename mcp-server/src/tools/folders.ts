import * as db from '../db.js';
import type { FolderTreeNode } from '../types.js';

// Tool definitions for folders
export const folderTools = [
  {
    name: 'list_folders',
    description: 'List all folders in flat or tree format',
    inputSchema: {
      type: 'object' as const,
      properties: {
        format: {
          type: 'string',
          enum: ['flat', 'tree'],
          description: 'Output format: "flat" for simple list, "tree" for hierarchical view',
        },
      },
    },
  },
  {
    name: 'get_folder',
    description: 'Get folder details including its prompts',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'The folder ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_folder',
    description: 'Create a new folder',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'The folder name',
        },
        parent_id: {
          type: 'string',
          description: 'Parent folder ID (optional, null for root folder)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_folder',
    description: 'Update a folder name or parent',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'The folder ID to update',
        },
        name: {
          type: 'string',
          description: 'New folder name (optional)',
        },
        parent_id: {
          type: 'string',
          description: 'New parent folder ID (optional, null for root)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_folder',
    description: 'Delete a folder and all its contents (prompts and subfolders). WARNING: This is irreversible!',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'The folder ID to delete',
        },
      },
      required: ['id'],
    },
  },
];

// Helper to render folder tree as text
function renderTree(nodes: FolderTreeNode[], prefix: string = '', isLast: boolean = true): string {
  let result = '';

  nodes.forEach((node, index) => {
    const isLastNode = index === nodes.length - 1;
    const connector = isLastNode ? '└─' : '├─';
    const childPrefix = isLastNode ? '   ' : '│  ';

    const promptInfo = node.promptCount > 0 ? ` (${node.promptCount} prompts)` : '';
    result += `${prefix}${connector} ${node.name}${promptInfo}\n`;

    if (node.children.length > 0) {
      result += renderTree(node.children, prefix + childPrefix, isLastNode);
    }
  });

  return result;
}

// Tool handlers
export async function handleFolderTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  switch (name) {
    case 'list_folders': {
      const format = (args.format as string) || 'flat';

      if (format === 'tree') {
        const tree = await db.getFolderTree();
        const treeText = tree.length > 0
          ? renderTree(tree)
          : 'No folders found.';
        return {
          content: [{ type: 'text', text: `Folder Structure:\n\n${treeText}` }],
        };
      }

      const folders = await db.getFolders();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              folders.map(f => ({
                id: f.id,
                name: f.name,
                parentId: f.parentId,
              })),
              null,
              2
            ),
          },
        ],
      };
    }

    case 'get_folder': {
      const result = await db.getFolderWithPrompts(args.id as string);
      if (!result) {
        return {
          content: [{ type: 'text', text: `Folder not found: ${args.id}` }],
        };
      }

      const { folder, prompts } = result;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                folder: {
                  id: folder.id,
                  name: folder.name,
                  parentId: folder.parentId,
                },
                prompts: prompts.map(p => ({
                  id: p.id,
                  title: p.title,
                  tags: p.tags,
                  contentPreview: p.content.substring(0, 100) + (p.content.length > 100 ? '...' : ''),
                })),
                promptCount: prompts.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'create_folder': {
      const folder = await db.createFolder(
        args.name as string,
        (args.parent_id as string) || null
      );
      return {
        content: [
          {
            type: 'text',
            text: `Created folder "${folder.name}" with ID: ${folder.id}\n\n${JSON.stringify(folder, null, 2)}`,
          },
        ],
      };
    }

    case 'update_folder': {
      const existing = await db.getFolder(args.id as string);
      if (!existing) {
        return {
          content: [{ type: 'text', text: `Folder not found: ${args.id}` }],
        };
      }

      const folder = await db.updateFolder(
        args.id as string,
        (args.name as string) || existing.name,
        args.parent_id !== undefined ? (args.parent_id as string | null) : existing.parentId
      );
      return {
        content: [
          {
            type: 'text',
            text: `Updated folder "${folder.name}"\n\n${JSON.stringify(folder, null, 2)}`,
          },
        ],
      };
    }

    case 'delete_folder': {
      const existing = await db.getFolder(args.id as string);
      if (!existing) {
        return {
          content: [{ type: 'text', text: `Folder not found: ${args.id}` }],
        };
      }

      // Get prompt count for warning
      const folderData = await db.getFolderWithPrompts(args.id as string);
      const promptCount = folderData?.prompts.length || 0;

      await db.deleteFolder(args.id as string);

      return {
        content: [
          {
            type: 'text',
            text: `Deleted folder "${existing.name}" (ID: ${args.id})${promptCount > 0 ? `\nNote: ${promptCount} prompt(s) were also deleted.` : ''}`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown folder tool: ${name}`);
  }
}

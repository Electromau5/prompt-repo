# Prompt Repository MCP Server

An MCP (Model Context Protocol) server that allows Claude to directly access and manage your Prompt Repository.

## Features

- **Full CRUD Operations**: Create, read, update, and delete prompts and folders
- **Search**: Search prompts by title or content
- **Filtering**: Filter prompts by folder or tag
- **Tree View**: View folder hierarchy as a tree structure
- **Direct Database Access**: Connects directly to your Neon PostgreSQL database

## Available Tools

### Prompts
| Tool | Description |
|------|-------------|
| `list_prompts` | List all prompts (optionally filter by folder_id or tag) |
| `get_prompt` | Get a single prompt by ID with full content |
| `search_prompts` | Search prompts by title or content |
| `create_prompt` | Create a new prompt |
| `update_prompt` | Update an existing prompt |
| `delete_prompt` | Delete a prompt |
| `copy_prompt` | Get prompt content ready to use |

### Folders
| Tool | Description |
|------|-------------|
| `list_folders` | List all folders (format: "flat" or "tree") |
| `get_folder` | Get folder details with its prompts |
| `create_folder` | Create a new folder |
| `update_folder` | Update a folder |
| `delete_folder` | Delete a folder (cascades to contents) |

### Tags
| Tool | Description |
|------|-------------|
| `list_tags` | List all available tags |
| `list_tag_categories` | List tag categories with their tags |

## Setup

### 1. Install Dependencies

```bash
cd mcp-server
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Configure Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "prompt-repo": {
      "command": "node",
      "args": ["/absolute/path/to/prompt-repo/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://username:password@host/database?sslmode=require"
      }
    }
  }
}
```

**Important**: Replace the path and DATABASE_URL with your actual values.

### 4. Restart Claude Desktop

After updating the config, restart Claude Desktop for the changes to take effect.

## Usage Examples

Once configured, you can ask Claude:

- "List all my prompt folders"
- "Show me prompts in the Coding folder"
- "Search for prompts about React debugging"
- "Create a new prompt for API error handling in the coding-debug folder"
- "Show the folder tree structure"
- "What tags are available?"

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string to your Neon database |

## Development

```bash
# Watch mode (recompile on changes)
npm run dev

# Build once
npm run build

# Run the server
npm start
```

## Security Notes

- The DATABASE_URL contains credentials - never commit it to git
- This server runs locally with your user permissions
- Deleting folders cascades to all contained prompts
- Consider the prompts you're giving Claude access to

## Troubleshooting

### Server not appearing in Claude
- Check the config path is correct
- Ensure the path in `args` is absolute
- Restart Claude Desktop after config changes

### Database connection errors
- Verify DATABASE_URL is correct
- Check your Neon database is accessible
- Ensure the database tables exist (run the main app first to create/seed them)

### Tool errors
- Check the server logs (stderr output)
- Verify the folder/prompt IDs exist in your database

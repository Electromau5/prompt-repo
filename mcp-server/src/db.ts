import { neon } from '@neondatabase/serverless';
import type { Folder, Prompt, TagCategory, FolderTreeNode, Notebook, Note } from './types.js';

// Lazy-initialize database connection
function getSQL() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(databaseUrl);
}

// Generate a random ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// ============ FOLDERS ============

export async function getFolders(): Promise<Folder[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT id, name, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
    FROM folders
    ORDER BY name
  `;
  return rows as Folder[];
}

export async function getFolder(id: string): Promise<Folder | null> {
  const sql = getSQL();
  const rows = await sql`
    SELECT id, name, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
    FROM folders
    WHERE id = ${id}
  `;
  return rows[0] as Folder | null;
}

export async function getFolderWithPrompts(id: string): Promise<{ folder: Folder; prompts: Prompt[] } | null> {
  const folder = await getFolder(id);
  if (!folder) return null;

  const prompts = await getPromptsByFolder(id);
  return { folder, prompts };
}

export async function createFolder(name: string, parentId: string | null): Promise<Folder> {
  const sql = getSQL();
  const id = generateId();
  const rows = await sql`
    INSERT INTO folders (id, name, parent_id)
    VALUES (${id}, ${name}, ${parentId})
    RETURNING id, name, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
  `;
  return rows[0] as Folder;
}

export async function updateFolder(id: string, name: string, parentId: string | null): Promise<Folder> {
  const sql = getSQL();
  const rows = await sql`
    UPDATE folders
    SET name = ${name}, parent_id = ${parentId}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
  `;
  return rows[0] as Folder;
}

export async function deleteFolder(id: string): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM folders WHERE id = ${id}`;
}

export async function getFolderTree(): Promise<FolderTreeNode[]> {
  const folders = await getFolders();
  const prompts = await getPrompts();

  // Count prompts per folder
  const promptCounts: Record<string, number> = {};
  for (const prompt of prompts) {
    promptCounts[prompt.folderId] = (promptCounts[prompt.folderId] || 0) + 1;
  }

  // Build tree structure
  const folderMap = new Map<string, FolderTreeNode>();
  const rootFolders: FolderTreeNode[] = [];

  // Create nodes
  for (const folder of folders) {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      children: [],
      promptCount: promptCounts[folder.id] || 0,
    });
  }

  // Build hierarchy
  for (const folder of folders) {
    const node = folderMap.get(folder.id)!;
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId)!.children.push(node);
    } else {
      rootFolders.push(node);
    }
  }

  return rootFolders;
}

// ============ PROMPTS ============

export async function getPrompts(): Promise<Prompt[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT
      p.id,
      p.title,
      p.content,
      p.folder_id as "folderId",
      p.created_at as "createdAt",
      p.updated_at as "updatedAt",
      COALESCE(
        array_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
        ARRAY[]::varchar[]
      ) as tags
    FROM prompts p
    LEFT JOIN prompt_tags pt ON p.id = pt.prompt_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;
  return rows as Prompt[];
}

export async function getPrompt(id: string): Promise<Prompt | null> {
  const sql = getSQL();
  const rows = await sql`
    SELECT
      p.id,
      p.title,
      p.content,
      p.folder_id as "folderId",
      p.created_at as "createdAt",
      p.updated_at as "updatedAt",
      COALESCE(
        array_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
        ARRAY[]::varchar[]
      ) as tags
    FROM prompts p
    LEFT JOIN prompt_tags pt ON p.id = pt.prompt_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE p.id = ${id}
    GROUP BY p.id
  `;
  return rows[0] as Prompt | null;
}

export async function getPromptsByFolder(folderId: string): Promise<Prompt[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT
      p.id,
      p.title,
      p.content,
      p.folder_id as "folderId",
      p.created_at as "createdAt",
      p.updated_at as "updatedAt",
      COALESCE(
        array_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
        ARRAY[]::varchar[]
      ) as tags
    FROM prompts p
    LEFT JOIN prompt_tags pt ON p.id = pt.prompt_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE p.folder_id = ${folderId}
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;
  return rows as Prompt[];
}

export async function getPromptsByTag(tagName: string): Promise<Prompt[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT
      p.id,
      p.title,
      p.content,
      p.folder_id as "folderId",
      p.created_at as "createdAt",
      p.updated_at as "updatedAt",
      COALESCE(
        array_agg(t2.name) FILTER (WHERE t2.name IS NOT NULL),
        ARRAY[]::varchar[]
      ) as tags
    FROM prompts p
    INNER JOIN prompt_tags pt ON p.id = pt.prompt_id
    INNER JOIN tags t ON pt.tag_id = t.id AND t.name = ${tagName.toLowerCase()}
    LEFT JOIN prompt_tags pt2 ON p.id = pt2.prompt_id
    LEFT JOIN tags t2 ON pt2.tag_id = t2.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;
  return rows as Prompt[];
}

export async function searchPrompts(query: string, folderId?: string): Promise<Prompt[]> {
  const sql = getSQL();
  const searchPattern = `%${query.toLowerCase()}%`;

  if (folderId) {
    const rows = await sql`
      SELECT
        p.id,
        p.title,
        p.content,
        p.folder_id as "folderId",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        COALESCE(
          array_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
          ARRAY[]::varchar[]
        ) as tags
      FROM prompts p
      LEFT JOIN prompt_tags pt ON p.id = pt.prompt_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.folder_id = ${folderId}
        AND (LOWER(p.title) LIKE ${searchPattern} OR LOWER(p.content) LIKE ${searchPattern})
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    return rows as Prompt[];
  }

  const rows = await sql`
    SELECT
      p.id,
      p.title,
      p.content,
      p.folder_id as "folderId",
      p.created_at as "createdAt",
      p.updated_at as "updatedAt",
      COALESCE(
        array_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
        ARRAY[]::varchar[]
      ) as tags
    FROM prompts p
    LEFT JOIN prompt_tags pt ON p.id = pt.prompt_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE LOWER(p.title) LIKE ${searchPattern} OR LOWER(p.content) LIKE ${searchPattern}
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;
  return rows as Prompt[];
}

export async function createPrompt(
  title: string,
  content: string,
  folderId: string,
  tags: string[]
): Promise<Prompt> {
  const sql = getSQL();
  const id = generateId();

  // Insert the prompt
  const rows = await sql`
    INSERT INTO prompts (id, title, content, folder_id)
    VALUES (${id}, ${title}, ${content}, ${folderId})
    RETURNING id, title, content, folder_id as "folderId", created_at as "createdAt", updated_at as "updatedAt"
  `;
  const prompt = rows[0] as Prompt;
  prompt.tags = [];

  // Add tags
  for (const tagName of tags) {
    const tagId = generateId();
    await sql`
      INSERT INTO tags (id, name)
      VALUES (${tagId}, ${tagName.toLowerCase()})
      ON CONFLICT (name) DO NOTHING
    `;
    const tagRows = await sql`
      SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
    `;
    if (tagRows[0]) {
      await sql`
        INSERT INTO prompt_tags (prompt_id, tag_id)
        VALUES (${prompt.id}, ${tagRows[0].id})
        ON CONFLICT DO NOTHING
      `;
      prompt.tags.push(tagName.toLowerCase());
    }
  }

  return prompt;
}

export async function updatePrompt(
  id: string,
  title: string,
  content: string,
  folderId: string,
  tags: string[]
): Promise<Prompt> {
  const sql = getSQL();

  // Update the prompt
  const rows = await sql`
    UPDATE prompts
    SET title = ${title}, content = ${content}, folder_id = ${folderId}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, title, content, folder_id as "folderId", created_at as "createdAt", updated_at as "updatedAt"
  `;
  const prompt = rows[0] as Prompt;
  prompt.tags = [];

  // Remove existing tags
  await sql`DELETE FROM prompt_tags WHERE prompt_id = ${id}`;

  // Add new tags
  for (const tagName of tags) {
    const tagId = generateId();
    await sql`
      INSERT INTO tags (id, name)
      VALUES (${tagId}, ${tagName.toLowerCase()})
      ON CONFLICT (name) DO NOTHING
    `;
    const tagRows = await sql`
      SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
    `;
    if (tagRows[0]) {
      await sql`
        INSERT INTO prompt_tags (prompt_id, tag_id)
        VALUES (${prompt.id}, ${tagRows[0].id})
        ON CONFLICT DO NOTHING
      `;
      prompt.tags.push(tagName.toLowerCase());
    }
  }

  return prompt;
}

export async function deletePrompt(id: string): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM prompts WHERE id = ${id}`;
}

// ============ TAGS ============

export async function getTags(): Promise<string[]> {
  const sql = getSQL();
  const rows = await sql`SELECT name FROM tags ORDER BY name`;
  return rows.map(r => r.name as string);
}

// ============ TAG CATEGORIES ============

export async function getTagCategories(): Promise<TagCategory[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT
      tc.id,
      tc.name,
      COALESCE(
        array_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
        ARRAY[]::varchar[]
      ) as tags
    FROM tag_categories tc
    LEFT JOIN category_tags ct ON tc.id = ct.category_id
    LEFT JOIN tags t ON ct.tag_id = t.id
    GROUP BY tc.id
    ORDER BY tc.name
  `;
  return rows as TagCategory[];
}

// ============ NOTEBOOKS ============

export async function getNotebooks(): Promise<Notebook[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT id, name, type, created_at as "createdAt", updated_at as "updatedAt"
    FROM notebooks
    ORDER BY created_at
  `;
  return rows as Notebook[];
}

export async function getNotebook(id: string): Promise<Notebook | null> {
  const sql = getSQL();
  const rows = await sql`
    SELECT id, name, type, created_at as "createdAt", updated_at as "updatedAt"
    FROM notebooks
    WHERE id = ${id}
  `;
  return rows[0] as Notebook | null;
}

export async function createNotebook(name: string, type: string = 'notebook'): Promise<Notebook> {
  const sql = getSQL();
  const id = generateId();
  const rows = await sql`
    INSERT INTO notebooks (id, name, type)
    VALUES (${id}, ${name}, ${type})
    RETURNING id, name, type, created_at as "createdAt", updated_at as "updatedAt"
  `;
  return rows[0] as Notebook;
}

export async function updateNotebook(id: string, name: string): Promise<Notebook> {
  const sql = getSQL();
  const rows = await sql`
    UPDATE notebooks
    SET name = ${name}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, type, created_at as "createdAt", updated_at as "updatedAt"
  `;
  return rows[0] as Notebook;
}

export async function deleteNotebook(id: string): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM notebooks WHERE id = ${id}`;
}

// ============ NOTES ============

export async function getNotes(): Promise<Note[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT id, notebook_id as "notebookId", title, content, type, template, created_at as "createdAt", updated_at as "updatedAt"
    FROM notes
    ORDER BY created_at DESC
  `;
  return rows as Note[];
}

export async function getNote(id: string): Promise<Note | null> {
  const sql = getSQL();
  const rows = await sql`
    SELECT id, notebook_id as "notebookId", title, content, type, template, created_at as "createdAt", updated_at as "updatedAt"
    FROM notes
    WHERE id = ${id}
  `;
  return rows[0] as Note | null;
}

export async function getNotesByNotebook(notebookId: string): Promise<Note[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT id, notebook_id as "notebookId", title, content, type, template, created_at as "createdAt", updated_at as "updatedAt"
    FROM notes
    WHERE notebook_id = ${notebookId}
    ORDER BY created_at DESC
  `;
  return rows as Note[];
}

export async function createNote(
  notebookId: string,
  title: string,
  content: string,
  type: string = 'text',
  template: string | null = null
): Promise<Note> {
  const sql = getSQL();
  const id = generateId();
  const rows = await sql`
    INSERT INTO notes (id, notebook_id, title, content, type, template)
    VALUES (${id}, ${notebookId}, ${title}, ${content}, ${type}, ${template})
    RETURNING id, notebook_id as "notebookId", title, content, type, template, created_at as "createdAt", updated_at as "updatedAt"
  `;
  return rows[0] as Note;
}

export async function updateNote(
  id: string,
  title: string,
  content: string
): Promise<Note> {
  const sql = getSQL();
  const rows = await sql`
    UPDATE notes
    SET title = ${title}, content = ${content}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, notebook_id as "notebookId", title, content, type, template, created_at as "createdAt", updated_at as "updatedAt"
  `;
  return rows[0] as Note;
}

export async function moveNote(id: string, newNotebookId: string): Promise<Note> {
  const sql = getSQL();
  const rows = await sql`
    UPDATE notes
    SET notebook_id = ${newNotebookId}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, notebook_id as "notebookId", title, content, type, template, created_at as "createdAt", updated_at as "updatedAt"
  `;
  return rows[0] as Note;
}

export async function duplicateNote(id: string, targetNotebookId?: string): Promise<Note> {
  const sql = getSQL();
  const newId = generateId();
  const rows = await sql`
    INSERT INTO notes (id, notebook_id, title, content, type, template)
    SELECT ${newId}, COALESCE(${targetNotebookId || null}, notebook_id), title || ' (Copy)', content, type, template
    FROM notes WHERE id = ${id}
    RETURNING id, notebook_id as "notebookId", title, content, type, template, created_at as "createdAt", updated_at as "updatedAt"
  `;
  return rows[0] as Note;
}

export async function convertPromptToNote(promptId: string, notebookId: string): Promise<Note> {
  const sql = getSQL();
  const prompt = await sql`
    SELECT id, title, content FROM prompts WHERE id = ${promptId}
  `;
  if (!prompt[0]) {
    throw new Error('Prompt not found');
  }

  const noteId = generateId();
  const rows = await sql`
    INSERT INTO notes (id, notebook_id, title, content, type, template)
    VALUES (${noteId}, ${notebookId}, ${prompt[0].title}, ${prompt[0].content}, 'text', 'prompt')
    RETURNING id, notebook_id as "notebookId", title, content, type, template, created_at as "createdAt", updated_at as "updatedAt"
  `;
  return rows[0] as Note;
}

export async function deleteNote(id: string): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM notes WHERE id = ${id}`;
}

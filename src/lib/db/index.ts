import { neon } from '@neondatabase/serverless'
import type { Folder, Prompt, TagCategory, Notebook, Note } from '@/types'

// Create SQL connection lazily
function getSQL() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return neon(databaseUrl)
}

// Generate a random ID
function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

// ============ FOLDERS ============

export async function getFolders(): Promise<Folder[]> {
  const rows = await getSQL()`
    SELECT id, name, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
    FROM folders
    ORDER BY name
  `
  return rows as Folder[]
}

export async function createFolder(name: string, parentId: string | null): Promise<Folder> {
  const id = generateId()
  const rows = await getSQL()`
    INSERT INTO folders (id, name, parent_id)
    VALUES (${id}, ${name}, ${parentId})
    RETURNING id, name, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
  `
  return rows[0] as Folder
}

export async function updateFolder(id: string, name: string, parentId: string | null): Promise<Folder> {
  const rows = await getSQL()`
    UPDATE folders
    SET name = ${name}, parent_id = ${parentId}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
  `
  return rows[0] as Folder
}

export async function deleteFolder(id: string): Promise<void> {
  await getSQL()`DELETE FROM folders WHERE id = ${id}`
}

// ============ PROMPTS ============

export async function getPrompts(): Promise<Prompt[]> {
  const rows = await getSQL()`
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
  `
  return rows as Prompt[]
}

export async function createPrompt(
  title: string,
  content: string,
  folderId: string,
  tags: string[]
): Promise<Prompt> {
  const id = generateId()

  // Insert the prompt
  const rows = await getSQL()`
    INSERT INTO prompts (id, title, content, folder_id)
    VALUES (${id}, ${title}, ${content}, ${folderId})
    RETURNING id, title, content, folder_id as "folderId", created_at as "createdAt", updated_at as "updatedAt"
  `
  const prompt = rows[0] as Prompt
  prompt.tags = []

  // Add tags
  for (const tagName of tags) {
    const tagId = generateId()
    // Insert tag if not exists
    await getSQL()`
      INSERT INTO tags (id, name)
      VALUES (${tagId}, ${tagName.toLowerCase()})
      ON CONFLICT (name) DO NOTHING
    `
    // Get tag id
    const tagRows = await getSQL()`
      SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
    `
    if (tagRows[0]) {
      // Link prompt to tag
      await getSQL()`
        INSERT INTO prompt_tags (prompt_id, tag_id)
        VALUES (${prompt.id}, ${tagRows[0].id})
        ON CONFLICT DO NOTHING
      `
      prompt.tags.push(tagName.toLowerCase())
    }
  }

  return prompt
}

export async function updatePrompt(
  id: string,
  title: string,
  content: string,
  folderId: string,
  tags: string[]
): Promise<Prompt> {
  // Update the prompt
  const rows = await getSQL()`
    UPDATE prompts
    SET title = ${title}, content = ${content}, folder_id = ${folderId}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, title, content, folder_id as "folderId", created_at as "createdAt", updated_at as "updatedAt"
  `
  const prompt = rows[0] as Prompt
  prompt.tags = []

  // Remove existing tags
  await getSQL()`DELETE FROM prompt_tags WHERE prompt_id = ${id}`

  // Add new tags
  for (const tagName of tags) {
    const tagId = generateId()
    await getSQL()`
      INSERT INTO tags (id, name)
      VALUES (${tagId}, ${tagName.toLowerCase()})
      ON CONFLICT (name) DO NOTHING
    `
    const tagRows = await getSQL()`
      SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
    `
    if (tagRows[0]) {
      await getSQL()`
        INSERT INTO prompt_tags (prompt_id, tag_id)
        VALUES (${prompt.id}, ${tagRows[0].id})
        ON CONFLICT DO NOTHING
      `
      prompt.tags.push(tagName.toLowerCase())
    }
  }

  return prompt
}

export async function deletePrompt(id: string): Promise<void> {
  await getSQL()`DELETE FROM prompts WHERE id = ${id}`
}

// ============ TAGS ============

export async function getTags(): Promise<string[]> {
  const rows = await getSQL()`SELECT name FROM tags ORDER BY name`
  return rows.map(r => r.name as string)
}

export async function createTag(name: string): Promise<string> {
  const id = generateId()
  await getSQL()`
    INSERT INTO tags (id, name)
    VALUES (${id}, ${name.toLowerCase()})
    ON CONFLICT (name) DO NOTHING
  `
  return name.toLowerCase()
}

export async function deleteTag(name: string): Promise<void> {
  await getSQL()`DELETE FROM tags WHERE name = ${name.toLowerCase()}`
}

// ============ TAG CATEGORIES ============

export async function getTagCategories(): Promise<TagCategory[]> {
  const rows = await getSQL()`
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
  `
  return rows as TagCategory[]
}

export async function createTagCategory(name: string, tags: string[]): Promise<TagCategory> {
  const id = generateId()
  const rows = await getSQL()`
    INSERT INTO tag_categories (id, name)
    VALUES (${id}, ${name})
    RETURNING id, name
  `
  const category = rows[0] as TagCategory
  category.tags = []

  for (const tagName of tags) {
    const tagId = generateId()
    await getSQL()`
      INSERT INTO tags (id, name)
      VALUES (${tagId}, ${tagName.toLowerCase()})
      ON CONFLICT (name) DO NOTHING
    `
    const tagRows = await getSQL()`
      SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
    `
    if (tagRows[0]) {
      await getSQL()`
        INSERT INTO category_tags (category_id, tag_id)
        VALUES (${category.id}, ${tagRows[0].id})
        ON CONFLICT DO NOTHING
      `
      category.tags.push(tagName.toLowerCase())
    }
  }

  return category
}

export async function updateTagCategory(id: string, name: string, tags: string[]): Promise<TagCategory> {
  await getSQL()`
    UPDATE tag_categories SET name = ${name} WHERE id = ${id}
  `

  // Remove existing category-tag links
  await getSQL()`DELETE FROM category_tags WHERE category_id = ${id}`

  const category: TagCategory = { id, name, tags: [] }

  for (const tagName of tags) {
    const tagId = generateId()
    await getSQL()`
      INSERT INTO tags (id, name)
      VALUES (${tagId}, ${tagName.toLowerCase()})
      ON CONFLICT (name) DO NOTHING
    `
    const tagRows = await getSQL()`
      SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
    `
    if (tagRows[0]) {
      await getSQL()`
        INSERT INTO category_tags (category_id, tag_id)
        VALUES (${category.id}, ${tagRows[0].id})
        ON CONFLICT DO NOTHING
      `
      category.tags.push(tagName.toLowerCase())
    }
  }

  return category
}

export async function deleteTagCategory(id: string): Promise<void> {
  await getSQL()`DELETE FROM tag_categories WHERE id = ${id}`
}

// ============ BULK OPERATIONS ============

export async function getAllData() {
  const [folders, prompts, tags, tagCategories] = await Promise.all([
    getFolders(),
    getPrompts(),
    getTags(),
    getTagCategories()
  ])
  return { folders, prompts, tags, tagCategories }
}

export async function seedDefaultFolders(folders: Array<{ id: string; name: string; parentId: string | null }>) {
  for (const folder of folders) {
    await getSQL()`
      INSERT INTO folders (id, name, parent_id)
      VALUES (${folder.id}, ${folder.name}, ${folder.parentId})
      ON CONFLICT (id) DO NOTHING
    `
  }
}

// ============ NOTEBOOKS ============

export async function getNotebooks(): Promise<Notebook[]> {
  const rows = await getSQL()`
    SELECT id, name, type, created_at as "createdAt", updated_at as "updatedAt"
    FROM notebooks
    ORDER BY created_at
  `
  return rows as Notebook[]
}

export async function createNotebook(name: string, type: string = 'notebook'): Promise<Notebook> {
  const id = generateId()
  const rows = await getSQL()`
    INSERT INTO notebooks (id, name, type)
    VALUES (${id}, ${name}, ${type})
    RETURNING id, name, type, created_at as "createdAt", updated_at as "updatedAt"
  `
  return rows[0] as Notebook
}

export async function updateNotebook(id: string, name: string): Promise<Notebook> {
  const rows = await getSQL()`
    UPDATE notebooks
    SET name = ${name}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, type, created_at as "createdAt", updated_at as "updatedAt"
  `
  return rows[0] as Notebook
}

export async function deleteNotebook(id: string): Promise<void> {
  await getSQL()`DELETE FROM notebooks WHERE id = ${id}`
}

// ============ NOTES ============

export async function getNotes(): Promise<Note[]> {
  const rows = await getSQL()`
    SELECT
      n.id,
      n.notebook_id as "notebookId",
      n.title,
      n.content,
      n.type,
      n.template,
      n.position,
      n.created_at as "createdAt",
      n.updated_at as "updatedAt",
      COALESCE(
        array_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
        ARRAY[]::varchar[]
      ) as tags
    FROM notes n
    LEFT JOIN note_tags nt ON n.id = nt.note_id
    LEFT JOIN tags t ON nt.tag_id = t.id
    GROUP BY n.id
    ORDER BY n.position ASC, n.created_at DESC
  `
  return rows as Note[]
}

export async function createNote(
  notebookId: string,
  title: string,
  content: string,
  type: string = 'text',
  template: string | null = null,
  tags: string[] = []
): Promise<Note> {
  const id = generateId()
  // Get the next position for this notebook
  const maxPos = await getSQL()`
    SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM notes WHERE notebook_id = ${notebookId}
  `
  const position = maxPos[0]?.next_pos ?? 0

  const rows = await getSQL()`
    INSERT INTO notes (id, notebook_id, title, content, type, template, position)
    VALUES (${id}, ${notebookId}, ${title}, ${content}, ${type}, ${template}, ${position})
    RETURNING id, notebook_id as "notebookId", title, content, type, template, position, created_at as "createdAt", updated_at as "updatedAt"
  `
  const note = rows[0] as Note
  note.tags = []

  // Add tags
  for (const tagName of tags) {
    const tagId = generateId()
    await getSQL()`
      INSERT INTO tags (id, name)
      VALUES (${tagId}, ${tagName.toLowerCase()})
      ON CONFLICT (name) DO NOTHING
    `
    const tagRows = await getSQL()`
      SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
    `
    if (tagRows[0]) {
      await getSQL()`
        INSERT INTO note_tags (note_id, tag_id)
        VALUES (${note.id}, ${tagRows[0].id})
        ON CONFLICT DO NOTHING
      `
      note.tags.push(tagName.toLowerCase())
    }
  }

  return note
}

export async function updateNote(
  id: string,
  title: string,
  content: string,
  tags?: string[]
): Promise<Note> {
  const rows = await getSQL()`
    UPDATE notes
    SET title = ${title}, content = ${content}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, notebook_id as "notebookId", title, content, type, template, created_at as "createdAt", updated_at as "updatedAt"
  `
  const note = rows[0] as Note
  note.tags = []

  // Update tags if provided
  if (tags !== undefined) {
    // Remove existing tags
    await getSQL()`DELETE FROM note_tags WHERE note_id = ${id}`

    // Add new tags
    for (const tagName of tags) {
      const tagId = generateId()
      await getSQL()`
        INSERT INTO tags (id, name)
        VALUES (${tagId}, ${tagName.toLowerCase()})
        ON CONFLICT (name) DO NOTHING
      `
      const tagRows = await getSQL()`
        SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
      `
      if (tagRows[0]) {
        await getSQL()`
          INSERT INTO note_tags (note_id, tag_id)
          VALUES (${note.id}, ${tagRows[0].id})
          ON CONFLICT DO NOTHING
        `
        note.tags.push(tagName.toLowerCase())
      }
    }
  } else {
    // Fetch existing tags
    const tagRows = await getSQL()`
      SELECT t.name FROM tags t
      JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ${id}
    `
    note.tags = tagRows.map(r => r.name as string)
  }

  return note
}

export async function moveNote(id: string, newNotebookId: string, position?: number): Promise<Note> {
  // Get the max position in the target notebook if position not specified
  let targetPosition = position
  if (targetPosition === undefined) {
    const maxPos = await getSQL()`
      SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM notes WHERE notebook_id = ${newNotebookId}
    `
    targetPosition = maxPos[0]?.next_pos ?? 0
  }

  const rows = await getSQL()`
    UPDATE notes
    SET notebook_id = ${newNotebookId}, position = ${targetPosition}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, notebook_id as "notebookId", title, content, type, template, position, created_at as "createdAt", updated_at as "updatedAt"
  `
  const note = rows[0] as Note
  // Fetch existing tags
  const tagRows = await getSQL()`
    SELECT t.name FROM tags t
    JOIN note_tags nt ON t.id = nt.tag_id
    WHERE nt.note_id = ${id}
  `
  note.tags = tagRows.map(r => r.name as string)
  return note
}

export async function reorderNotes(notebookId: string, noteIds: string[]): Promise<void> {
  // Update positions for all notes in the specified order
  for (let i = 0; i < noteIds.length; i++) {
    await getSQL()`
      UPDATE notes
      SET position = ${i}, updated_at = NOW()
      WHERE id = ${noteIds[i]} AND notebook_id = ${notebookId}
    `
  }
}

export async function duplicateNote(id: string, targetNotebookId?: string): Promise<Note> {
  const newId = generateId()
  const rows = await getSQL()`
    INSERT INTO notes (id, notebook_id, title, content, type, template)
    SELECT ${newId}, COALESCE(${targetNotebookId}, notebook_id), title || ' (Copy)', content, type, template
    FROM notes WHERE id = ${id}
    RETURNING id, notebook_id as "notebookId", title, content, type, template, created_at as "createdAt", updated_at as "updatedAt"
  `
  const note = rows[0] as Note
  note.tags = []

  // Copy tags from original note
  const originalTags = await getSQL()`
    SELECT t.id, t.name FROM tags t
    JOIN note_tags nt ON t.id = nt.tag_id
    WHERE nt.note_id = ${id}
  `
  for (const tag of originalTags) {
    await getSQL()`
      INSERT INTO note_tags (note_id, tag_id)
      VALUES (${newId}, ${tag.id})
      ON CONFLICT DO NOTHING
    `
    note.tags.push(tag.name as string)
  }

  return note
}

export async function deleteNote(id: string): Promise<void> {
  await getSQL()`DELETE FROM notes WHERE id = ${id}`
}

// Convert a prompt to a note with Prompt template
export async function convertPromptToNote(promptId: string, notebookId: string): Promise<Note> {
  const prompt = await getSQL()`
    SELECT id, title, content, folder_id as "folderId"
    FROM prompts WHERE id = ${promptId}
  `
  if (!prompt[0]) {
    throw new Error('Prompt not found')
  }

  const noteId = generateId()
  const rows = await getSQL()`
    INSERT INTO notes (id, notebook_id, title, content, type, template)
    VALUES (${noteId}, ${notebookId}, ${prompt[0].title}, ${prompt[0].content}, 'prompt', 'prompt')
    RETURNING id, notebook_id as "notebookId", title, content, type, template, created_at as "createdAt", updated_at as "updatedAt"
  `
  const note = rows[0] as Note
  note.tags = []

  // Copy tags from the prompt
  const promptTags = await getSQL()`
    SELECT t.id, t.name FROM tags t
    JOIN prompt_tags pt ON t.id = pt.tag_id
    WHERE pt.prompt_id = ${promptId}
  `
  for (const tag of promptTags) {
    await getSQL()`
      INSERT INTO note_tags (note_id, tag_id)
      VALUES (${noteId}, ${tag.id})
      ON CONFLICT DO NOTHING
    `
    note.tags.push(tag.name as string)
  }

  return note
}

import { sql } from '@vercel/postgres'
import type { Folder, Prompt, TagCategory } from '@/types'

// ============ FOLDERS ============

export async function getFolders(): Promise<Folder[]> {
  const { rows } = await sql`
    SELECT id, name, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
    FROM folders
    ORDER BY name
  `
  return rows as Folder[]
}

export async function createFolder(name: string, parentId: string | null): Promise<Folder> {
  const { rows } = await sql`
    INSERT INTO folders (name, parent_id)
    VALUES (${name}, ${parentId})
    RETURNING id, name, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
  `
  return rows[0] as Folder
}

export async function updateFolder(id: string, name: string, parentId: string | null): Promise<Folder> {
  const { rows } = await sql`
    UPDATE folders
    SET name = ${name}, parent_id = ${parentId}, updated_at = NOW()
    WHERE id = ${id}::uuid
    RETURNING id, name, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
  `
  return rows[0] as Folder
}

export async function deleteFolder(id: string): Promise<void> {
  await sql`DELETE FROM folders WHERE id = ${id}::uuid`
}

// ============ PROMPTS ============

export async function getPrompts(): Promise<Prompt[]> {
  const { rows } = await sql`
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
  // Insert the prompt
  const { rows } = await sql`
    INSERT INTO prompts (title, content, folder_id)
    VALUES (${title}, ${content}, ${folderId}::uuid)
    RETURNING id, title, content, folder_id as "folderId", created_at as "createdAt", updated_at as "updatedAt"
  `
  const prompt = rows[0] as Prompt
  prompt.tags = []

  // Add tags
  for (const tagName of tags) {
    // Insert tag if not exists
    await sql`
      INSERT INTO tags (name)
      VALUES (${tagName.toLowerCase()})
      ON CONFLICT (name) DO NOTHING
    `
    // Get tag id
    const { rows: tagRows } = await sql`
      SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
    `
    if (tagRows[0]) {
      // Link prompt to tag
      await sql`
        INSERT INTO prompt_tags (prompt_id, tag_id)
        VALUES (${prompt.id}::uuid, ${tagRows[0].id}::uuid)
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
  const { rows } = await sql`
    UPDATE prompts
    SET title = ${title}, content = ${content}, folder_id = ${folderId}::uuid, updated_at = NOW()
    WHERE id = ${id}::uuid
    RETURNING id, title, content, folder_id as "folderId", created_at as "createdAt", updated_at as "updatedAt"
  `
  const prompt = rows[0] as Prompt
  prompt.tags = []

  // Remove existing tags
  await sql`DELETE FROM prompt_tags WHERE prompt_id = ${id}::uuid`

  // Add new tags
  for (const tagName of tags) {
    await sql`
      INSERT INTO tags (name)
      VALUES (${tagName.toLowerCase()})
      ON CONFLICT (name) DO NOTHING
    `
    const { rows: tagRows } = await sql`
      SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
    `
    if (tagRows[0]) {
      await sql`
        INSERT INTO prompt_tags (prompt_id, tag_id)
        VALUES (${prompt.id}::uuid, ${tagRows[0].id}::uuid)
        ON CONFLICT DO NOTHING
      `
      prompt.tags.push(tagName.toLowerCase())
    }
  }

  return prompt
}

export async function deletePrompt(id: string): Promise<void> {
  await sql`DELETE FROM prompts WHERE id = ${id}::uuid`
}

// ============ TAGS ============

export async function getTags(): Promise<string[]> {
  const { rows } = await sql`SELECT name FROM tags ORDER BY name`
  return rows.map(r => r.name)
}

export async function createTag(name: string): Promise<string> {
  await sql`
    INSERT INTO tags (name)
    VALUES (${name.toLowerCase()})
    ON CONFLICT (name) DO NOTHING
  `
  return name.toLowerCase()
}

export async function deleteTag(name: string): Promise<void> {
  await sql`DELETE FROM tags WHERE name = ${name.toLowerCase()}`
}

// ============ TAG CATEGORIES ============

export async function getTagCategories(): Promise<TagCategory[]> {
  const { rows } = await sql`
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
  const { rows } = await sql`
    INSERT INTO tag_categories (name)
    VALUES (${name})
    RETURNING id, name
  `
  const category = rows[0] as TagCategory
  category.tags = []

  for (const tagName of tags) {
    await sql`
      INSERT INTO tags (name)
      VALUES (${tagName.toLowerCase()})
      ON CONFLICT (name) DO NOTHING
    `
    const { rows: tagRows } = await sql`
      SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
    `
    if (tagRows[0]) {
      await sql`
        INSERT INTO category_tags (category_id, tag_id)
        VALUES (${category.id}::uuid, ${tagRows[0].id}::uuid)
        ON CONFLICT DO NOTHING
      `
      category.tags.push(tagName.toLowerCase())
    }
  }

  return category
}

export async function updateTagCategory(id: string, name: string, tags: string[]): Promise<TagCategory> {
  await sql`
    UPDATE tag_categories SET name = ${name} WHERE id = ${id}::uuid
  `

  // Remove existing category-tag links
  await sql`DELETE FROM category_tags WHERE category_id = ${id}::uuid`

  const category: TagCategory = { id, name, tags: [] }

  for (const tagName of tags) {
    await sql`
      INSERT INTO tags (name)
      VALUES (${tagName.toLowerCase()})
      ON CONFLICT (name) DO NOTHING
    `
    const { rows: tagRows } = await sql`
      SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
    `
    if (tagRows[0]) {
      await sql`
        INSERT INTO category_tags (category_id, tag_id)
        VALUES (${category.id}::uuid, ${tagRows[0].id}::uuid)
        ON CONFLICT DO NOTHING
      `
      category.tags.push(tagName.toLowerCase())
    }
  }

  return category
}

export async function deleteTagCategory(id: string): Promise<void> {
  await sql`DELETE FROM tag_categories WHERE id = ${id}::uuid`
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
    await sql`
      INSERT INTO folders (id, name, parent_id)
      VALUES (${folder.id}::uuid, ${folder.name}, ${folder.parentId}::uuid)
      ON CONFLICT (id) DO NOTHING
    `
  }
}

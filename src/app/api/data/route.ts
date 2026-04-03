import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// Default folders to seed
const defaultFolders = [
  { id: 'writing', name: 'Writing', parentId: null },
  { id: 'coding', name: 'Coding', parentId: null },
  { id: 'coding-debug', name: 'Debug', parentId: 'coding' },
  { id: 'coding-ui-magic', name: 'UI Components - Magic MCP', parentId: 'coding' },
  { id: 'coding-frontend', name: 'Frontend Code', parentId: 'coding' },
  { id: 'coding-backend', name: 'Backend Code', parentId: 'coding' },
  { id: 'project-strategy', name: 'Project Strategy', parentId: null },
  { id: 'project-mvp', name: 'MVP - Token Manager', parentId: 'project-strategy' },
  { id: 'design', name: 'Design', parentId: null },
  { id: 'design-website', name: 'Website Design', parentId: 'design' },
  { id: 'design-systems', name: 'Design Systems', parentId: 'design' },
  { id: 'design-chatbot-ds', name: 'Chatbot DS Features', parentId: 'design-systems' },
  { id: 'design-components', name: 'Components', parentId: 'design-systems' },
  { id: 'design-documentation', name: 'Documentation', parentId: 'design-systems' },
  { id: 'design-zeroheight', name: 'ZeroHeight', parentId: 'design-documentation' },
  { id: 'design-prototyping', name: 'Prototyping', parentId: 'design' },
  { id: 'design-figma', name: 'Figma', parentId: 'design-prototyping' },
  { id: 'design-user-research', name: 'User Research', parentId: 'design' },
  { id: 'design-ux-artifacts', name: 'UX Artifacts', parentId: 'design' },
  { id: 'design-journey-maps', name: 'User Journey Maps', parentId: 'design-ux-artifacts' },
  { id: 'agents', name: 'Agents', parentId: null },
  { id: 'agents-mcp', name: 'MCP', parentId: 'agents' },
  { id: 'agents-rules', name: 'Agent Rules', parentId: 'agents' },
  { id: 'financial', name: 'Financial', parentId: null },
  { id: 'events', name: 'Events', parentId: null },
  { id: 'growth-hacking', name: 'Growth Hacking', parentId: null },
  { id: 'funding', name: 'Funding', parentId: null },
  { id: 'lifestyle', name: 'Lifestyle', parentId: null },
  { id: 'databases', name: 'Databases', parentId: null },
]

async function seedDefaultFolders(databaseUrl: string) {
  const sql = neon(databaseUrl)
  // Insert root folders first
  for (const folder of defaultFolders.filter(f => f.parentId === null)) {
    await sql`
      INSERT INTO folders (id, name, parent_id)
      VALUES (${folder.id}, ${folder.name}, ${folder.parentId})
      ON CONFLICT (id) DO NOTHING
    `
  }
  // Then child folders
  for (const folder of defaultFolders.filter(f => f.parentId !== null)) {
    await sql`
      INSERT INTO folders (id, name, parent_id)
      VALUES (${folder.id}, ${folder.name}, ${folder.parentId})
      ON CONFLICT (id) DO NOTHING
    `
  }
}

async function seedDefaultNotebooks(databaseUrl: string) {
  const sql = neon(databaseUrl)
  // Create the default "Prompts" notebook
  await sql`
    INSERT INTO notebooks (id, name, type)
    VALUES ('note1', 'Prompts', 'prompts')
    ON CONFLICT (id) DO NOTHING
  `
}

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 })
    }

    const sql = neon(databaseUrl)

    // Check if we have any folders
    const folderCount = await sql`SELECT COUNT(*) as count FROM folders`

    // If no folders exist, seed the default ones
    if (parseInt(folderCount[0].count) === 0) {
      console.log('No folders found, seeding default folders...')
      await seedDefaultFolders(databaseUrl)
    }

    // Check if we have any notebooks
    const notebookCount = await sql`SELECT COUNT(*) as count FROM notebooks`

    // If no notebooks exist, seed the default ones
    if (parseInt(notebookCount[0].count) === 0) {
      console.log('No notebooks found, seeding default notebooks...')
      await seedDefaultNotebooks(databaseUrl)
    }

    // Fetch all data
    const [folders, prompts, tags, tagCategories, notebooks, notes] = await Promise.all([
      sql`
        SELECT id, name, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
        FROM folders
        ORDER BY name
      `,
      sql`
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
      `,
      sql`SELECT name FROM tags ORDER BY name`,
      sql`
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
      `,
      sql`
        SELECT id, name, type, created_at as "createdAt", updated_at as "updatedAt"
        FROM notebooks
        ORDER BY created_at
      `,
      sql`
        SELECT
          n.id,
          n.notebook_id as "notebookId",
          n.title,
          n.content,
          n.type,
          n.template,
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
        ORDER BY n.created_at DESC
      `
    ])

    return NextResponse.json({
      folders,
      prompts,
      tags: tags.map(t => t.name),
      tagCategories,
      notebooks,
      notes
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}

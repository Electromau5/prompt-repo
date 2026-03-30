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

export async function POST() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 })
    }

    const sql = neon(databaseUrl)

    // Insert folders in order (parents first, then children)
    // First pass: insert root folders (parentId = null)
    for (const folder of defaultFolders.filter(f => f.parentId === null)) {
      await sql`
        INSERT INTO folders (id, name, parent_id)
        VALUES (${folder.id}, ${folder.name}, ${folder.parentId})
        ON CONFLICT (id) DO UPDATE SET name = ${folder.name}
      `
    }

    // Second pass: insert child folders
    for (const folder of defaultFolders.filter(f => f.parentId !== null)) {
      await sql`
        INSERT INTO folders (id, name, parent_id)
        VALUES (${folder.id}, ${folder.name}, ${folder.parentId})
        ON CONFLICT (id) DO UPDATE SET name = ${folder.name}, parent_id = ${folder.parentId}
      `
    }

    return NextResponse.json({ success: true, message: `Seeded ${defaultFolders.length} folders` })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json({ error: 'Failed to seed database', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed default folders',
    folderCount: defaultFolders.length
  })
}

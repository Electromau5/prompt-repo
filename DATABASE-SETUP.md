# Database Setup Log: Neon Postgres with Vercel
# Project: Prompt Repository
# Date: March 2025

================================================================================
OVERVIEW
================================================================================

This log documents the complete process of setting up a Neon Postgres database
with Vercel for the Prompt Repository Next.js application, including all issues
encountered and their resolutions.

Final Stack:
- Next.js 15 (App Router)
- Neon Serverless Postgres
- Vercel Hosting
- @neondatabase/serverless SDK

================================================================================
PHASE 1: INITIAL MIGRATION FROM VITE TO NEXT.JS
================================================================================

1. Converted project from Vite to Next.js 15 with App Router
2. Created necessary config files:
   - next.config.js
   - tsconfig.json
   - tailwind.config.js
   - postcss.config.js

3. Created App Router structure:
   - src/app/layout.tsx
   - src/app/page.tsx
   - src/app/globals.css

4. Initially attempted to use @vercel/postgres

================================================================================
PHASE 2: VERCEL POSTGRES DEPRECATION
================================================================================

ISSUE: @vercel/postgres is deprecated
---------------------------------------
When accessing Vercel Storage, found that Vercel Postgres no longer exists.
Vercel has migrated to marketplace database providers.

Available options in Vercel Storage (March 2025):
- Edge Config (key-value)
- Blob (file storage)
- Neon (Serverless Postgres) <-- RECOMMENDED
- Supabase (Postgres backend)
- AWS (PostgreSQL and NoSQL)
- Upstash (Redis, Vector, Queue)
- Nile (Postgres for B2B)
- Prisma Postgres
- Turso (Serverless SQLite)
- MongoDB Atlas

SOLUTION: Switched to Neon Serverless Postgres
----------------------------------------------
npm uninstall @vercel/postgres
npm install @neondatabase/serverless

================================================================================
PHASE 3: DATABASE CONNECTION SETUP
================================================================================

ISSUE: Build-time database connection error
-------------------------------------------
Error: No database connection string was provided to `neon()`

The initial code tried to create the database connection at module load time:
```typescript
// BAD - runs at build time
const sql = neon(process.env.DATABASE_URL!)
```

SOLUTION: Lazy initialization
-----------------------------
```typescript
// GOOD - only connects when function is called
function getSQL() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return neon(databaseUrl)
}
```

================================================================================
PHASE 4: DATABASE SCHEMA DESIGN
================================================================================

ISSUE: UUID vs TEXT for IDs
---------------------------
Initial schema used UUID type for all IDs:
```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

Problem: The default folders in the JavaScript code used string IDs like
'writing', 'coding', 'design', etc. When trying to insert a prompt with
folder_id = 'writing', PostgreSQL failed to cast 'writing'::uuid.

Error: invalid input syntax for type uuid: "writing"

SOLUTION: Changed all ID columns to TEXT type
---------------------------------------------
```sql
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  folder_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE tag_categories (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE prompt_tags (
  prompt_id TEXT REFERENCES prompts(id) ON DELETE CASCADE,
  tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, tag_id)
);

CREATE TABLE category_tags (
  category_id TEXT REFERENCES tag_categories(id) ON DELETE CASCADE,
  tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (category_id, tag_id)
);

-- Indexes
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_prompts_folder_id ON prompts(folder_id);
CREATE INDEX idx_tags_name ON tags(name);
```

================================================================================
PHASE 5: FOREIGN KEY CONSTRAINT ISSUES
================================================================================

ISSUE: Prompts not saving - Foreign key violation
-------------------------------------------------
Symptoms:
- Folders were being saved correctly
- Sub-folders were being saved correctly
- Prompts were NOT being saved

Root Cause:
The frontend loaded default folders from a JavaScript file (defaultFolders.js)
when the database was empty. These folders had IDs like 'writing', 'coding'.
However, these folders were never actually inserted into the database.

When a user tried to create a prompt in the "Writing" folder:
1. Frontend sent: { folderId: 'writing', title: '...', content: '...' }
2. Database tried: INSERT INTO prompts (folder_id, ...) VALUES ('writing', ...)
3. Foreign key check failed: folder with id 'writing' doesn't exist
4. INSERT failed silently (error was caught but not shown to user)

SOLUTION: Auto-seed default folders on first load
-------------------------------------------------
Modified /api/data/route.ts to:
1. Check if database has any folders
2. If empty, automatically insert all 29 default folders
3. Then return the data

```typescript
// In /api/data/route.ts
const folderCount = await sql`SELECT COUNT(*) as count FROM folders`

if (parseInt(folderCount[0].count) === 0) {
  console.log('No folders found, seeding default folders...')
  await seedDefaultFolders(databaseUrl)
}
```

The seedDefaultFolders function inserts folders in correct order:
1. First: Root folders (parentId = null)
2. Then: Child folders (parentId references existing folder)

This ensures foreign key constraints are satisfied.

================================================================================
PHASE 6: FRONTEND FIXES
================================================================================

ISSUE: Silent failures with local fallbacks
-------------------------------------------
The frontend had try/catch blocks that fell back to local-only operations
when API calls failed. This masked database errors from users.

SOLUTION: Remove fallbacks, add error notifications
---------------------------------------------------
```javascript
// BEFORE - Silent fallback
const addPrompt = async (prompt) => {
  try {
    const newPrompt = await api.createPrompt(...);
    // update state
  } catch (e) {
    // Fallback - creates prompt locally only (doesn't persist!)
    const newPrompt = { ...prompt, id: generateId() };
    // update state
  }
};

// AFTER - Proper error handling
const addPrompt = async (prompt) => {
  try {
    const newPrompt = await api.createPrompt(...);
    // update state
    showNotif('Prompt created');
  } catch (e) {
    console.error('Failed to create prompt:', e);
    showNotif('Failed to create prompt');
    // Don't update state - operation failed
  }
};
```

================================================================================
PHASE 7: FINAL CONFIGURATION
================================================================================

Environment Variables Required:
------------------------------
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

This is automatically set by Vercel when you link a Neon database.

File Structure:
--------------
src/
├── app/
│   ├── api/
│   │   ├── data/route.ts        # GET all data, auto-seeds if empty
│   │   ├── folders/
│   │   │   ├── route.ts         # GET/POST folders
│   │   │   └── [id]/route.ts    # PUT/DELETE folder
│   │   ├── prompts/
│   │   │   ├── route.ts         # GET/POST prompts
│   │   │   └── [id]/route.ts    # PUT/DELETE prompt
│   │   ├── tags/route.ts        # GET/POST/DELETE tags
│   │   ├── tag-categories/
│   │   │   ├── route.ts         # GET/POST tag categories
│   │   │   └── [id]/route.ts    # PUT/DELETE tag category
│   │   └── seed/route.ts        # POST to manually seed folders
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   └── db/
│       ├── index.ts             # Database utility functions
│       └── schema.sql           # SQL schema for reference
├── components/
│   └── PromptRepository.jsx     # Main component with API calls
└── types/
    └── index.ts                 # TypeScript types

================================================================================
SETUP CHECKLIST FOR FUTURE PROJECTS
================================================================================

1. CREATE NEXT.JS PROJECT
   npx create-next-app@latest my-app --typescript --tailwind --app --src-dir

2. INSTALL NEON SDK
   npm install @neondatabase/serverless

3. CREATE DATABASE ON VERCEL
   - Go to Vercel Dashboard > Storage > Browse Storage
   - Select "Neon" (Serverless Postgres)
   - Create database and link to project
   - Vercel automatically adds DATABASE_URL to environment variables

4. CREATE SCHEMA
   - Open Neon SQL Editor (from Vercel Storage > your DB > Open in Neon)
   - Run your CREATE TABLE statements
   - Use TEXT for IDs if you need string IDs (not auto-generated UUIDs)

5. CREATE DATABASE UTILITY (src/lib/db/index.ts)
   ```typescript
   import { neon } from '@neondatabase/serverless'

   function getSQL() {
     const databaseUrl = process.env.DATABASE_URL
     if (!databaseUrl) {
       throw new Error('DATABASE_URL not set')
     }
     return neon(databaseUrl)
   }

   export async function getItems() {
     const rows = await getSQL()`SELECT * FROM items`
     return rows
   }
   ```

6. CREATE API ROUTES
   - Use Next.js App Router: src/app/api/[resource]/route.ts
   - Export async functions: GET, POST, PUT, DELETE
   - Handle errors and return proper status codes

7. HANDLE SEEDING
   - If your app has default data, seed it on first load
   - Check if tables are empty before seeding
   - Insert parent records before children (foreign keys)

8. TEST LOCALLY
   - Pull env vars: vercel env pull .env.local
   - Run: npm run dev
   - Test all CRUD operations

9. DEPLOY
   - Push to GitHub
   - Vercel auto-deploys
   - Test on production

================================================================================
COMMON ISSUES AND SOLUTIONS
================================================================================

Issue: "No database connection string was provided to neon()"
Solution: Use lazy initialization, don't create connection at module level

Issue: "invalid input syntax for type uuid"
Solution: Use TEXT type for IDs if you need custom string IDs

Issue: "Foreign key constraint violation"
Solution: Ensure parent records exist before inserting children

Issue: "Data not persisting"
Solution: Check if API calls are succeeding, remove silent fallbacks

Issue: "Build fails with database error"
Solution: Database connection must be lazy (inside functions, not at top level)

================================================================================
USEFUL COMMANDS
================================================================================

# Pull environment variables from Vercel
vercel env pull .env.local

# Seed database manually (POST request)
curl -X POST https://your-app.vercel.app/api/seed

# Check data in database
curl https://your-app.vercel.app/api/data

# Run locally with production database
npm run dev

================================================================================
END OF LOG
================================================================================

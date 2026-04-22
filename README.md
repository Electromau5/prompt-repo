# Prompt Repository

A versatile productivity and note-taking application built with Next.js, React, and Tailwind CSS. Organize prompts, create spreadsheets, write books, and plan trips — all in one place.

## Features

### Notebooks
Create multiple notebooks to organize your content. Each notebook can contain various types of notes.

### Note Types

#### Text Note
Simple text notes for quick writing and general note-taking.

#### Spreadsheet
Powerful table-based notes with:
- Multiple tables per note
- Resizable columns
- Column types: Text, Date picker, Dropdown
- Pre-built templates:
  - **Health**: Workout Tracker, Meal & Diet Log
  - **Financial**: Expense Tracker, Budget Planner
  - **Productivity**: Task Tracker, Weekly Habit Tracker
  - **Business**: Competitive Analysis (with Feature Matrix)

#### Repository
Structured data storage with two sub-types:
- **Prompt**: Store AI prompts with tag organization
- **Filepath**: Manage file and folder paths for quick access

#### Book
Organize long-form content into sections and chapters:
- Hierarchical structure with sections containing chapters
- Drag-and-drop chapter reordering
- Auto-numbering toggle for chapters
- **Version Control**: Save named snapshots of chapter content and restore any previous version

#### Travel Itinerary
Plan trips with a card-based interface:
- **Trip Overview**: Destination, dates, accommodation, check-in/out times
- **Travelers Management**: Add travelers with age, interests, dietary restrictions, mobility needs
- **Day-by-Day Planning**: Activities organized by day with:
  - Category filters (Dining, Nightlife, Culture, Shopping, Adventure, Transport)
  - Drag-and-drop reordering
  - Editable time slots
  - Mark as done/undone
  - Activity descriptions and durations

### Additional Features
- Hierarchical folder organization for prompts
- Search and filter by tags
- Tag categories for organization
- Bulk import from JSON, CSV, Markdown, or plain text
- Backup and restore functionality
- Copy content to clipboard with one click
- Move notes between folders
- Context menu for quick actions

## Tech Stack

- **Framework**: Next.js 15
- **Frontend**: React 19
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (via Neon serverless)
- **Icons**: Lucide React
- **Spreadsheet Export**: XLSX

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon account)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database connection string

# Set up the database
# See DATABASE-SETUP.md for detailed instructions

# Start development server
npm run dev
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Setup

See [DATABASE-SETUP.md](./DATABASE-SETUP.md) for detailed database configuration instructions.

## License

MIT

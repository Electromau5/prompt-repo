import { NextResponse } from 'next/server'
import { getNotes, createNote } from '@/lib/db'

export async function GET() {
  try {
    const notes = await getNotes()
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { notebookId, title, content, type, template, tags } = await request.json()

    if (!notebookId || !title) {
      return NextResponse.json(
        { error: 'notebookId and title are required' },
        { status: 400 }
      )
    }

    const note = await createNote(notebookId, title, content || '', type || 'text', template || null, tags || [])
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}

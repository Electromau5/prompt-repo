import { NextResponse } from 'next/server'
import { reorderNotes } from '@/lib/db'

export async function PUT(request: Request) {
  try {
    const { notebookId, noteIds } = await request.json()

    if (!notebookId || !noteIds || !Array.isArray(noteIds)) {
      return NextResponse.json(
        { error: 'notebookId and noteIds array are required' },
        { status: 400 }
      )
    }

    await reorderNotes(notebookId, noteIds)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering notes:', error)
    return NextResponse.json(
      { error: 'Failed to reorder notes' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { duplicateNote } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { notebookId } = body

    const note = await duplicateNote(id, notebookId || undefined)
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error duplicating note:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate note' },
      { status: 500 }
    )
  }
}

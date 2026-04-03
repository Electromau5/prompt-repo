import { NextResponse } from 'next/server'
import { convertPromptToNote } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { notebookId } = await request.json()

    if (!notebookId) {
      return NextResponse.json(
        { error: 'notebookId is required' },
        { status: 400 }
      )
    }

    const note = await convertPromptToNote(id, notebookId)
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error converting prompt to note:', error)
    return NextResponse.json(
      { error: 'Failed to convert prompt to note' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { updateNotebook, deleteNotebook } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const notebook = await updateNotebook(id, name)
    return NextResponse.json(notebook)
  } catch (error) {
    console.error('Error updating notebook:', error)
    return NextResponse.json(
      { error: 'Failed to update notebook' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteNotebook(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notebook:', error)
    return NextResponse.json(
      { error: 'Failed to delete notebook' },
      { status: 500 }
    )
  }
}

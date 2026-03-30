import { NextResponse } from 'next/server'
import { updateTagCategory, deleteTagCategory } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, tags } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const category = await updateTagCategory(id, name, tags || [])
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating tag category:', error)
    return NextResponse.json(
      { error: 'Failed to update tag category' },
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
    await deleteTagCategory(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tag category:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag category' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { getNotebooks, createNotebook } from '@/lib/db'

export async function GET() {
  try {
    const notebooks = await getNotebooks()
    return NextResponse.json(notebooks)
  } catch (error) {
    console.error('Error fetching notebooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notebooks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, type } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const notebook = await createNotebook(name, type || 'notebook')
    return NextResponse.json(notebook, { status: 201 })
  } catch (error) {
    console.error('Error creating notebook:', error)
    return NextResponse.json(
      { error: 'Failed to create notebook' },
      { status: 500 }
    )
  }
}

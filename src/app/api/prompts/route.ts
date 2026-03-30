import { NextResponse } from 'next/server'
import { getPrompts, createPrompt } from '@/lib/db'

export async function GET() {
  try {
    const prompts = await getPrompts()
    return NextResponse.json(prompts)
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { title, content, folderId, tags } = await request.json()

    if (!title || !content || !folderId) {
      return NextResponse.json(
        { error: 'Title, content, and folderId are required' },
        { status: 400 }
      )
    }

    const prompt = await createPrompt(title, content, folderId, tags || [])
    return NextResponse.json(prompt, { status: 201 })
  } catch (error) {
    console.error('Error creating prompt:', error)
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    )
  }
}

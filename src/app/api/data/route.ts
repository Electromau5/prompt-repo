import { NextResponse } from 'next/server'
import { getAllData } from '@/lib/db'

export async function GET() {
  try {
    const data = await getAllData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

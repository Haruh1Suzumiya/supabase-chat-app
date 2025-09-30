import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parent_id')

    let query = supabaseServer
      .from('messages')
      .select(`
        *,
        profiles (*),
        reactions (
          *,
          profiles (*)
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (parentId) {
      query = query.eq('parent_id', parentId)
    } else {
      query = query.is('parent_id', null)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, user_id, parent_id, thread_id } = body

    if (!content || !user_id) {
      return NextResponse.json(
        { error: 'Content and user_id are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('messages')
      .insert({
        content,
        user_id,
        parent_id: parent_id || null,
        thread_id: thread_id || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
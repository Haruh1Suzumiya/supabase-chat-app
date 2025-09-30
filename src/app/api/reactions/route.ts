import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message_id, user_id, emoji } = body

    if (!message_id || !user_id || !emoji) {
      return NextResponse.json(
        { error: 'Message ID, user ID, and emoji are required' },
        { status: 400 }
      )
    }

    // Check if reaction already exists
    const { data: existing } = await supabaseServer
      .from('reactions')
      .select('id')
      .eq('message_id', message_id)
      .eq('user_id', user_id)
      .eq('emoji', emoji)
      .single()

    if (existing) {
      // Remove reaction
      const { error } = await supabaseServer
        .from('reactions')
        .delete()
        .eq('id', existing.id)

      if (error) throw error

      return NextResponse.json({ removed: true })
    } else {
      // Add reaction
      const { data, error } = await supabaseServer
        .from('reactions')
        .insert({
          message_id,
          user_id,
          emoji,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(data, { status: 201 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
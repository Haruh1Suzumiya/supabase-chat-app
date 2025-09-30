import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('message_id')

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    // Get reply count
    const { count, error: countError } = await supabaseServer
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', messageId)
      .is('deleted_at', null)

    if (countError) throw countError

    // Get replies
    const { data: replies, error: repliesError } = await supabaseServer
      .from('messages')
      .select(`
        *,
        profiles (*),
        reactions (
          *,
          profiles (*)
        )
      `)
      .eq('parent_id', messageId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (repliesError) throw repliesError

    return NextResponse.json({
      count: count || 0,
      replies: replies || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
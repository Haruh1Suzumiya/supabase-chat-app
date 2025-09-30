import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { Database } from '@/types/database.types'

async function getUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}

export default async function ChatPage() {
  const data = await getUser()

  if (!data) {
    redirect('/login')
  }

  return (
    <ChatContainer
      userId={data.user.id}
      username={data.profile?.username || 'ユーザー'}
    />
  )
}
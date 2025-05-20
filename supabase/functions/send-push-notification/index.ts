import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string
  title: string
  body: string
  data?: any
  sound?: string
  badge?: number
}

serve(async (req) => {
  try {
    const { reminder_id, user_id } = await req.json()
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the reminder details
    const { data: reminder, error: reminderError } = await supabaseClient
      .from('reminders')
      .select('*')
      .eq('id', reminder_id)
      .eq('user_id', user_id)
      .single()

    if (reminderError || !reminder) {
      return new Response(
        JSON.stringify({ error: 'Reminder not found' }),
        { status: 404 }
      )
    }

    // Get the user's push tokens
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('push_tokens')
      .select('push_token')
      .eq('user_id', user_id)

    if (tokensError || !tokens?.length) {
      return new Response(
        JSON.stringify({ error: 'No push tokens found' }),
        { status: 404 }
      )
    }

    // Prepare the push notification message
    const message: PushMessage = {
      to: tokens[0].push_token, // Using the first token for now
      title: 'Reminder',
      body: reminder.title,
      sound: 'default',
      data: {
        reminder_id: reminder.id,
        time: reminder.time,
        date: reminder.date
      }
    }

    // Send the push notification via Expo's Push API
    const pushResponse = await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    })

    const pushResult = await pushResponse.json()

    return new Response(
      JSON.stringify(pushResult),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
}) 
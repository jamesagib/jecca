import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DateTime } from 'https://esm.sh/luxon@3.4.3'

serve(async (req) => {
  try {
    const { user_id, timezone = 'UTC' } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )

    // Get the current date in user's timezone
    const userNow = DateTime.now().setZone(timezone)
    const userDate = userNow.toFormat('yyyy-MM-dd')
    
    // Delete completed reminders and reminders from previous dates
    const { error } = await supabaseClient
      .from('reminders')
      .delete()
      .eq('user_id', user_id)
      .or(`date.lt.${userDate},and(completed.eq.true,date.eq.${userDate})`)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error cleaning up reminders:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to clean up reminders' }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 
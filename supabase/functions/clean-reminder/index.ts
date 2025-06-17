import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const chat = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `Convert this voice transcription into a clear, structured reminder. Follow these rules:
              1. Keep it concise and actionable
              2. Fix any transcription errors
              3. Structure dates and times consistently
              4. Remove filler words and repetition
              5. Preserve the core meaning and intent
              Example input: "um yeah remind me to uh pick up the dry cleaning tomorrow at like 3 pm or something"
              Example output: "pick up dry cleaning tomorrow at 3:00 PM"` 
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 100 // Limit response length
      })
    })

    const completion = await chat.json()
    const cleanedText = completion.choices[0].message.content.trim()

    return new Response(
      JSON.stringify({ cleanedText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error cleaning text:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to clean text',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 
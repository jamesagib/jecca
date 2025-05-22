import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const ASSEMBLYAI_API_KEY = Deno.env.get('ASSEMBLYAI_API_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No authorization token provided' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Convert to buffer for AssemblyAI
    const audioBuffer = await audioFile.arrayBuffer()
    
    // Upload to AssemblyAI Nano API
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ASSEMBLYAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_data: Array.from(new Uint8Array(audioBuffer)),
        nano: true // Use Nano model for speed
      })
    })

    const result = await response.json()
    
    if (!result.text) {
      throw new Error('Transcription failed: ' + JSON.stringify(result))
    }

    // Optional: Clean text with GPT-4o-mini
    const cleanedText = await cleanTextWithGPT(result.text)
    
    // Add "(voice)" tag
    const finalText = `${cleanedText || result.text} (voice)`

    return new Response(
      JSON.stringify({ 
        transcription: finalText,
        confidence: result.confidence 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Transcription failed',
        details: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function cleanTextWithGPT(text: string): Promise<string | null> {
  try {
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
            content: 'Convert this sentence into a structured and clear reminder. Keep it concise and actionable.' 
          },
          { role: 'user', content: text }
        ]
      })
    })

    const completion = await chat.json()
    return completion.choices[0].message.content
  } catch (error) {
    console.error('Error cleaning text with GPT:', error)
    return null // Return null to fall back to original text
  }
} 
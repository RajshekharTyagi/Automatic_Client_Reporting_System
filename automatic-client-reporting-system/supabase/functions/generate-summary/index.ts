import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content, projectId, fileId } = await req.json()
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional report summarizer. Create a concise, structured summary of the provided content. Focus on key points, findings, and actionable insights. Format your response with clear sections and bullet points where appropriate.'
          },
          {
            role: 'user',
            content: `Please summarize the following content:\n\n${content}`
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    })

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`)
    }

    const openAIData = await openAIResponse.json()
    const summary = openAIData.choices[0]?.message?.content || 'No summary generated'

    // Save report to database
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .insert({
        project_id: projectId,
        file_id: fileId,
        summary: summary,
        generated_by: user.id,
      })
      .select()
      .single()

    if (reportError) {
      console.error('Database error:', reportError)
      throw new Error(`Database error: ${reportError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        summary, 
        reportId: report.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
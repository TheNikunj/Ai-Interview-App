import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { fileName } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')??'', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'');
    const { data: fileData } = await supabase.storage.from('resumes').download(fileName);
    const base64PDF = btoa(String.fromCharCode(...new Uint8Array(await fileData.arrayBuffer())));

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    // BACK TO 1.5-FLASH
    // Find the fetch line and change the URL to:
const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Extract text from this resume." },
            { inline_data: { mime_type: "application/pdf", data: base64PDF } }
          ]
        }]
      })
    });

    const result = await response.json();
    const resumeText = result.candidates[0].content.parts[0].text;
    return new Response(JSON.stringify({ resumeText }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
});
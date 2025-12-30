/* global Deno */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { questions, answers, jobRole } = await req.json();

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY not set');

    const prompt = `You are an expert technical interviewer. Grade the candidate's answers for the position of ${jobRole}.
    Questions: ${JSON.stringify(questions)}
    Answers: ${JSON.stringify(answers)}

    Provide a JSON response with:
    1. "score": A number from 0-100
    2. "feedback": A brief summary of strengths and weaknesses
    3. "suggestions": 3 tips for improvement

    Return ONLY a valid JSON object.`;

    // UPDATED TO gemini-2.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const result = JSON.parse(text.replace(/```json|```/g, "").trim());

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
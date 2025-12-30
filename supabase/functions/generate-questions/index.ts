/* global Deno */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json();
    const { jobRole, skillRating } = body;

    // Better validation with detailed error messages
    if (!jobRole || jobRole.trim() === '') {
      throw new Error('Job role is required and cannot be empty');
    }
    
    if (skillRating === undefined || skillRating === null) {
      throw new Error('Skill rating is required');
    }

    // Convert skillRating to number if it's a string
    const rating = typeof skillRating === 'string' ? parseInt(skillRating, 10) : Number(skillRating);
    
    if (isNaN(rating) || rating < 1 || rating > 10) {
      throw new Error('Skill rating must be a number between 1 and 10');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not set in Supabase. Please set it in Supabase Dashboard > Edge Functions > Settings > Secrets');
    }

    const prompt = `You are an expert interviewer. Generate exactly 5 technical interview questions for a ${jobRole} role with a skill level of ${rating}/10.
Return ONLY a valid JSON array of strings. No other text or formatting.
Example: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

    // Use gemini-2.5-flash model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const text = data.candidates[0].content.parts[0].text;
    
    // Clean up markdown formatting and extract JSON
    let cleanJson = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanJson.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    let questions;
    try {
      questions = JSON.parse(cleanJson);
    } catch {
      // Fallback to default questions if parsing fails
      console.error('Failed to parse JSON from Gemini response:', cleanJson);
      questions = [
        `Explain the key technical skills required for a ${jobRole} role.`,
        `Describe a challenging project scenario for a ${jobRole} and how you would approach it.`,
        `What are the most important technical concepts a ${jobRole} should understand?`,
        `How do you stay updated with the latest technologies relevant to ${jobRole}?`,
        `Explain a technical decision you would make as a ${jobRole} and why.`,
      ];
    }

    if (!Array.isArray(questions) || questions.length !== 5) {
      // Ensure we always return exactly 5 questions
      console.warn('Questions array invalid, using fallback:', questions);
      questions = [
        `Explain the key technical skills required for a ${jobRole} role.`,
        `Describe a challenging project scenario for a ${jobRole} and how you would approach it.`,
        `What are the most important technical concepts a ${jobRole} should understand?`,
        `How do you stay updated with the latest technologies relevant to ${jobRole}?`,
        `Explain a technical decision you would make as a ${jobRole} and why.`,
      ];
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-questions:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { type, params } = await req.json();

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "keywords") {
      systemPrompt = "You are an expert SEO keyword researcher. Generate highly relevant, high-value keywords with difficulty and search volume estimates.";
      userPrompt = `Generate SEO-optimized keywords for:
Industry: ${params.industry}
Geography: ${params.geography || "Global"}
Target: ${params.target || "General"}

Provide 20-30 keywords in JSON format with: {keyword, difficulty (1-100), estimatedVolume, intent (informational/commercial/transactional), reasoning}`;
    } else if (type === "press_release") {
      systemPrompt = "You are a professional press release writer. Create compelling, newsworthy press releases in AP style.";
      userPrompt = `Write a professional press release:
Company: ${params.company}
Announcement: ${params.announcement}
Style: ${params.style || "Professional"}
Additional Info: ${params.additionalInfo || ""}

Include: headline, dateline, lead paragraph, body, boilerplate, and contact information.`;
    } else if (type === "article") {
      systemPrompt = "You are an expert content writer specializing in SEO-optimized long-form articles.";
      userPrompt = `Write an SEO-optimized article:
Topic: ${params.topic}
Keywords: ${params.keywords || ""}
Tone: ${params.tone || "Professional"}
Length: ${params.length || "1500"} words

Include: compelling headline, meta description, introduction, H2/H3 structure, conclusion, and naturally integrated keywords.`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ content }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

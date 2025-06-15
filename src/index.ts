export default {
  async fetch(request: Request, env: any) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { title = "", description = "", tags = "" } = await request.json();

    const systemPrompt = `
You are an Etsy Listing Optimizer.
When given a raw product title, description and tags, output a complete, optimized listing in this exact format:

TITLE:
<optimized title, 120–140 chars, front-loaded with keywords>

DESCRIPTION:
<optimized description with recommended headers and bullet points>

TAGS:
<13 unique, lowercase, comma-separated tags, each under 20 characters>

Rules:
• Do not invent any details not supplied.
• Do not include prohibited items.
• Follow the character and formatting requirements strictly.
`;

    const openaiBody = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Raw title: ${title}\nDescription: ${description}\nTags: ${tags}`
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    };

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(openaiBody)
    });

    if (!openaiResp.ok) {
      const err = await openaiResp.text();
      return new Response(`OpenAI Error: ${err}`, { status: 500 });
    }

    const data = await openaiResp.json();
    const result = data.choices?.[0]?.message?.content || "No response.";

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};

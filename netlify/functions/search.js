const fetch = require("node-fetch");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { query } = JSON.parse(event.body);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "user",
            content: `
Your task: Generate a **FAKE / AI-SIMULATED** Twitter/X discussion summary about this query:

"${query}"

You are NOT allowed to use real tweets. Invent realistic crypto chatter.

Return ONLY valid JSON:
{
  "summary": "string",
  "keyAccounts": ["@example1", "@example2"],
  "sentiment": "bullish | bearish | neutral | mixed",
  "keyPoints": ["string", "string"],
  "searchTerms": ["string", "string"]
}
Respond only with JSON — no explanations, no markdown.
            `,
          },
        ],
        temperature: 0.2,
        max_tokens: 700,
      }),
    });

    const data = await response.json();

    // If Groq failed
    if (!data?.choices?.[0]?.message?.content) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Groq did not return content",
          raw: data,
        }),
      };
    }

    const raw = data.choices[0].message.content;

    // Clean output (remove ``` blocks)
    const clean = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Invalid JSON returned from Groq",
          raw: clean,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

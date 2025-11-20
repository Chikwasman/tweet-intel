const fetch = require("node-fetch");

// Extract JSON even if surrounded by text
function extractJSON(str) {
  const jsonMatch = str.match(/\{[\s\S]*\}/); 
  return jsonMatch ? jsonMatch[0] : null;
}

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
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "user",
            content: `
IMPORTANT:
Respond ONLY with JSON.
Do NOT include markdown.
Do NOT include explanation.

Your response MUST exactly match:

{
  "summary": "...",
  "keyAccounts": ["@user1"],
  "sentiment": "bullish" | "bearish" | "neutral" | "mixed",
  "keyPoints": ["point 1", "point 2"],
  "searchTerms": ["term1", "term2"]
}

Topic to search: "${query}"
`
          }
        ],
        temperature: 0.1,
        max_tokens: 700
      })
    });

    const data = await response.json();

    let raw = data?.choices?.[0]?.message?.content || "";

    // remove code fences and whitespace
    raw = raw.replace(/```json|```/g, "").trim();

    // extract clean JSON from messy output
    const jsonOnly = extractJSON(raw);

    if (!jsonOnly) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Groq output contained no valid JSON object",
          rawResponse: raw
        })
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonOnly);
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Groq returned invalid JSON",
          rawJSON: jsonOnly
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(parsed)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

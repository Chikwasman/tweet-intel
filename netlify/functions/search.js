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
Return ONLY valid JSON.
NO markdown. NO explanation. NO \`\`\` blocks.

Search Twitter/X discussions about: "${query}"

Return EXACT format:

{
  "summary": "...",
  "keyAccounts": ["@user1"],
  "sentiment": "bullish" | "bearish" | "neutral" | "mixed",
  "keyPoints": ["point 1", "point 2"],
  "searchTerms": ["term1", "term2"]
}
`
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    });

    const data = await response.json();

    // GROQ returns: data.choices[0].message.content
    let raw = data?.choices?.[0]?.message?.content || "";

    // CLEAN accidental markdown formatting
    raw = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Groq returned invalid JSON",
          rawResponse: raw
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

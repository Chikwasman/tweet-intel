const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
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
        model: "llama-3.3-70b-versatile",  // ← UPDATED MODEL
        messages: [
          {
            role: "user",
            content: `
You are an AI system summarizing crypto discussion trends.

Topic: "${query}"

Return STRICT JSON ONLY:

{
  "summary": "string",
  "sentiment": "bullish | bearish | mixed | neutral",
  "keyAccounts": ["@account1", "@account2"],
  "keyPoints": ["point1", "point2"],
  "searchTerms": ["term1", "term2"]
}

No extra text.
`
          }
        ],
        temperature: 0.2,
        max_tokens: 700
      })
    });

    const data = await response.json();

    const raw = data?.choices?.[0]?.message?.content;

    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Groq returned invalid JSON", raw })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(json)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

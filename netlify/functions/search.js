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
        model: "llama3-70b-8192",
        messages: [
          {
            role: "user",
            content: `
Search for recent Twitter/X discussions about: "${query}"

Provide a JSON response with:
{
  "summary": "...",
  "keyAccounts": ["@user1"],
  "sentiment": "bullish/bearish/neutral/mixed",
  "keyPoints": ["point 1", "point 2"],
  "searchTerms": ["term1", "term2"]
}

Respond ONLY with valid JSON.
`
          }
        ],
        temperature: 0.2,
        max_tokens: 800
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ content: data.choices[0].message.content })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

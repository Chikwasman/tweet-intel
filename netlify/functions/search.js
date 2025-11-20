// netlify/functions/search.js

import Anthropic from "@anthropic-ai/sdk";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  try {
    const { query } = JSON.parse(event.body);

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `
Search Twitter/X crypto discussions about: "${query}"

Return ONLY JSON:

{
  "summary": "...",
  "keyAccounts": ["@...", "@..."],
  "sentiment": "bullish | bearish | neutral | mixed",
  "keyPoints": ["...", "..."],
  "searchTerms": ["...", "..."]
}
`
        }
      ]
    });

    // Return Claude object directly to frontend
    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

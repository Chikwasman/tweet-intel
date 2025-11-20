const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { query } = JSON.parse(event.body);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Search for recent Twitter/X discussions about this crypto event or story: "${query}". 

Find relevant tweets, trending discussions, and key voices talking about this. Provide:
1. A brief summary of what happened
2. Key Twitter accounts discussing it
3. Main sentiment (bullish/bearish/neutral)
4. Important points being made
5. Suggested search terms for Twitter/X

Format your response as JSON with this structure:
{
  "summary": "brief summary",
  "keyAccounts": ["@account1", "@account2"],
  "sentiment": "bullish/bearish/neutral/mixed",
  "keyPoints": ["point 1", "point 2"],
  "searchTerms": ["term1", "term2"]
}

Respond ONLY with valid JSON, no other text.`
          }
        ],
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search"
          }
        ]
      })
    });

    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
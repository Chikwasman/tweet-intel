const fetch = require("node-fetch");
const cheerio = require("cheerio");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { query } = JSON.parse(event.body);
    if (!query) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing query" }) };
    }

    // ------------------------------------------------------------
    // 🟣 STEP 1 — SCRAPE TWITTER SEARCH LIVE (no API required)
    // ------------------------------------------------------------
    const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(
      query
    )}&f=live`;

    const html = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
      },
    }).then((r) => r.text());

    const $ = cheerio.load(html);

    // Extract top tweets
    const tweets = [];
    $('div[data-testid="tweet"]').each((i, el) => {
      const text = $(el).find('div[data-testid="tweetText"]').text().trim();
      const user = $(el).find("a[role='link'] span").first().text().trim();
      const link = "https://twitter.com" + $(el).find("a[role='link']").attr("href");

      if (text && user) {
        tweets.push({ text, user, link });
      }
    });

    if (tweets.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  summary: "No active tweets found for this topic.",
                  sentiment: "neutral",
                  keyAccounts: [],
                  keyPoints: [],
                  searchTerms: [query],
                  discussionLinks: [searchUrl],
                },
                null,
                2
              ),
            },
          ],
        }),
      };
    }

    // ------------------------------------------------------------
    // 🟣 STEP 2 — Extract key data from tweets
    // ------------------------------------------------------------
    const keyAccounts = [...new Set(tweets.map((t) => "@" + t.user).slice(0, 10))];

    const keyPoints = tweets
      .map((t) => t.text)
      .slice(0, 8)
      .map((t) => t.replace(/\n+/g, " ").trim());

    const discussionLinks = tweets.slice(0, 10).map((t) => t.link);

    // Basic sentiment estimation
    const sentimentLexicon = {
      bullish: ["pump", "moon", "bull", "surge", "up"],
      bearish: ["dump", "crash", "bear", "down", "rekt"],
    };

    let score = 0;
    tweets.forEach((t) => {
      const lower = t.text.toLowerCase();
      sentimentLexicon.bullish.forEach((w) => lower.includes(w) && score++);
      sentimentLexicon.bearish.forEach((w) => lower.includes(w) && score--);
    });

    let sentiment = "neutral";
    if (score > 2) sentiment = "bullish";
    if (score < -2) sentiment = "bearish";
    if (score >= -2 && score <= 2 && score !== 0) sentiment = "mixed";

    // ------------------------------------------------------------
    // 🟣 STEP 3 — AI Clean Summary (Groq)
    // ------------------------------------------------------------
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-groq-70b-8192-tool-use-preview",
          messages: [
            {
              role: "user",
              content: `
Summarize these tweets accurately. No hallucination. Only summarize what exists.

Tweets:
${tweets
  .slice(0, 10)
  .map((t) => `${t.user}: ${t.text}`)
  .join("\n")}

Return ONLY a short paragraph summary.
`,
            },
          ],
          temperature: 0.2,
        }),
      }
    );

    const aiData = await groqResponse.json();
    const aiSummary =
      aiData?.choices?.[0]?.message?.content ||
      "Summary unavailable, but real data extracted.";

    // ------------------------------------------------------------
    // 🟣 STEP 4 — Final JSON for your UI
    // ------------------------------------------------------------
    const finalJSON = {
      summary: aiSummary,
      sentiment,
      keyAccounts,
      keyPoints,
      searchTerms: [query, ...query.split(" ")],
      discussionLinks,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        content: [
          {
            type: "text",
            text: JSON.stringify(finalJSON, null, 2),
          },
        ],
      }),
    };

  } catch (err) {
    console.error("ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

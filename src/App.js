import React, { useState } from "react";
import {
  Search,
  Loader2,
  ExternalLink,
  MessageCircle,
  TrendingUp,
} from "lucide-react";

function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return "text-purple-200";
    switch (sentiment.toLowerCase()) {
      case "bullish":
        return "text-green-400";
      case "bearish":
        return "text-red-400";
      case "mixed":
        return "text-yellow-300";
      default:
        return "text-purple-200";
    }
  };

  const searchTwitter = async () => {
    if (!query.trim()) {
      setError("Please enter something to search");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("/.netlify/functions/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("Backend error:", data);
        setError("Invalid response from Groq.");
        return;
      }

      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") searchTwitter();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrendingUp className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Crypto Twitter Search</h1>
          </div>
          <p className="text-purple-200">AI-generated Twitter-style crypto summaries</p>
        </div>

        {/* Search Box */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-purple-500/30">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Bitcoin ETF approval, Solana outage..."
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none"
              />
            </div>

            <button
              onClick={searchTwitter}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>

          {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">

            {/* Summary */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-400" />
                Summary
              </h2>
              <p className="text-purple-100">{results.summary}</p>
            </div>

            {/* Sentiment */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-3">Market Sentiment</h2>
              <div className={`text-2xl font-bold ${getSentimentColor(results.sentiment)}`}>
                {results.sentiment}
              </div>
            </div>

            {/* Key Accounts */}
            {results.keyAccounts?.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-xl font-bold text-white mb-4">Key Voices</h2>
                <div className="flex flex-wrap gap-3">
                  {results.keyAccounts.map((acc, idx) => (
                    <a
                      key={idx}
                      href={`https://twitter.com/${acc.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/30 rounded-lg text-purple-200 flex items-center gap-2"
                    >
                      {acc}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Key Points */}
            {results.keyPoints?.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-xl font-bold text-white mb-4">Key Points</h2>
                <ul className="list-disc ml-6 text-purple-100 space-y-2">
                  {results.keyPoints.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Search Terms */}
            {results.searchTerms?.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-xl font-bold text-white mb-4">Suggested Search Terms</h2>
                <div className="flex flex-wrap gap-3">
                  {results.searchTerms.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-500/30 rounded-lg text-purple-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default App;

// src/App.js
import React, { useEffect, useState } from "react";
import {
  Search,
  TrendingUp,
  MessageCircle,
  Loader2,
  ExternalLink,
  Heart,
  Clock,
  FileText,
  Zap,
} from "lucide-react";

/*
  Full React (CRA) App.js - Dashboard redesign
  - Uses /.netlify/functions/search (Groq) as backend
  - Local search history (localStorage)
  - Sentiment gauge SVG
  - Loading skeletons
  - Simulated timeline (AI-generated "mentions")
*/

const STORAGE_KEY = "crypto-search-history-v1";
const SUGGESTED = [
  "Bitcoin ETF",
  "Ethereum Shanghai upgrade",
  "Solana outage",
  "Dogecoin pump",
  "NFT market crash",
];

function SentimentBadge({ sentiment }) {
  const s = (sentiment || "neutral").toLowerCase();
  const map = {
    bullish: ["Bullish", "bg-green-500/20 text-green-300", "✅"],
    bearish: ["Bearish", "bg-red-500/20 text-red-300", "⚠️"],
    mixed: ["Mixed", "bg-yellow-500/20 text-yellow-300", "➖"],
    neutral: ["Neutral", "bg-gray-700/20 text-gray-300", "➖"],
  };
  const [label, cls] = map[s] || map["neutral"];
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-2xl text-sm font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

function SentimentGauge({ sentiment }) {
  // Map sentiment string to angle (0 = very bear, 100 = very bull)
  const valueMap = {
    bullish: 85,
    bearish: 15,
    mixed: 55,
    neutral: 50,
  };
  const val = valueMap[(sentiment || "neutral").toLowerCase()] ?? 50;
  const angle = (val / 100) * 180;
  const stroke = val > 66 ? "#34D399" : val > 33 ? "#FBBF24" : "#F87171";

  return (
    <div className="w-48 h-28">
      <svg viewBox="0 0 200 100" className="w-full h-full">
        {/* background arc */}
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke="#2d2d2d"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* colored arc by using strokeDasharray */}
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke={stroke}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 253} 253`}
          transform="rotate(0,100,50)"
        />
        {/* needle */}
        <g transform={`translate(100,100) rotate(${angle - 90})`}>
          <rect x="-1.5" y="-70" width="3" height="70" rx="1.5" fill={stroke} />
        </g>
        {/* center cap */}
        <circle cx="100" cy="100" r="6" fill="#111827" stroke="#666" />
        {/* label */}
        <text x="100" y="35" textAnchor="middle" fill="#c7b8ff" fontSize="12">
          Sentiment
        </text>
        <text
          x="100"
          y="55"
          textAnchor="middle"
          fill={stroke}
          fontWeight="700"
          fontSize="18"
        >
          {Math.round(val)}%
        </text>
      </svg>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white/5 rounded-2xl p-4 space-y-3">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/8 rounded w-full" />
      <div className="h-3 bg-white/8 rounded w-5/6" />
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showExamples, setShowExamples] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setHistory(JSON.parse(raw));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const pushHistory = (term) => {
    if (!term) return;
    const next = [term, ...history.filter((h) => h !== term)].slice(0, 12);
    setHistory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Core search function (compatible with your Groq Netlify function)
  const searchTwitter = async (term = null) => {
    const q = term ?? query;
    if (!q || !q.trim()) {
      setError("Please enter a query");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch("/.netlify/functions/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();

      if (data?.error) {
        console.error("Backend:", data);
        setError(data.error || "Invalid response from backend");
        setLoading(false);
        return;
      }

      // Ensure safe structure
      const safe = {
        summary: data.summary || "No summary available.",
        sentiment: (data.sentiment || "neutral").toLowerCase(),
        keyAccounts: Array.isArray(data.keyAccounts) ? data.keyAccounts : [],
        keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
        searchTerms: Array.isArray(data.searchTerms) ? data.searchTerms : [],
      };

      setResults(safe);
      pushHistory(q);
      setShowExamples(false);
    } catch (err) {
      console.error(err);
      setError("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Create a simulated "mentions" timeline from keyPoints / keyAccounts
  const simulatedTimeline = (res) => {
    if (!res) return [];
    const { keyPoints = [], keyAccounts = [] } = res;
    const items = [];

    // Turn each keyPoint into an item, attach random account if available
    for (let i = 0; i < keyPoints.length; i++) {
      const acc = keyAccounts[i % (keyAccounts.length || 1)] || "@crypto_user";
      items.push({
        account: acc,
        text: keyPoints[i],
        time: `${Math.floor(Math.random() * 12) + 1}h`,
      });
    }

    // Add a couple of extra AI-synthesized quick mentions
    items.push({
      account: keyAccounts[0] || "@onchainanalyst",
      text: `Community is reacting — quick take: ${res.summary?.slice(0, 80) || ""}`,
      time: "2h",
    });

    return items.slice(0, 6);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <aside className="col-span-3 bg-white/3 rounded-2xl p-4 sticky top-6 h-fit">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold">Crypto Twitter Search</div>
              <div className="text-xs text-white/60">AI-powered summaries</div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm text-white/80 font-semibold mb-2">Search History</h3>
            <div className="flex flex-col gap-2">
              {history.length === 0 && (
                <div className="text-sm text-white/50">No history yet</div>
              )}
              {history.map((h, i) => (
                <button
                  key={h + i}
                  onClick={() => searchTwitter(h)}
                  className="text-left px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/6"
                >
                  {h}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setQuery(history[0] || "")}
                className="text-xs px-3 py-2 bg-white/6 rounded-md"
              >
                Use latest
              </button>
              <button
                onClick={clearHistory}
                className="text-xs px-3 py-2 bg-red-600/20 text-red-300 rounded-md"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm text-white/80 font-semibold mb-2">Suggested</h3>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                    searchTwitter(s);
                  }}
                  className="px-3 py-1.5 bg-white/5 rounded-full text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-xs text-white/60 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <div>Simulated tweets (AI-generated)</div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <div>No real Twitter data — AI summary only</div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setQuery("");
                setResults(null);
                setError("");
                setShowExamples(true);
              }}
              className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-semibold"
            >
              New Search
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-6">
          {/* Search */}
          <div className="bg-white/5 backdrop-blur-lg p-5 rounded-2xl mb-6 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300 w-5 h-5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchTwitter();
                  }}
                  placeholder="Search events, e.g. 'Bitcoin ETF approval'"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent border border-transparent focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => searchTwitter()}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Searching
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" /> Search
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setQuery("");
                    setResults(null);
                    setError("");
                  }}
                  title="Clear"
                  className="px-3 py-2 rounded-md bg-white/5"
                >
                  Clear
                </button>
              </div>
            </div>

            {error && <div className="mt-3 text-red-400 text-sm">{error}</div>}

            {showExamples && (
              <div className="mt-4 text-sm text-white/60">
                Try:{" "}
                {SUGGESTED.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQuery(s);
                      searchTwitter(s);
                    }}
                    className="ml-2 underline"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results area */}
          <div>
            {loading && (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}

            {!loading && !results && (
              <div className="text-white/50 text-sm">
                Start a search to see AI-generated Twitter-style summaries.
              </div>
            )}

            {results && (
              <div className="space-y-4">
                {/* Summary card */}
                <div className="bg-white/5 rounded-2xl p-6 border border-purple-500/20">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="text-lg font-bold">Summary</h3>
                      <p className="text-white/80 mt-2">{results.summary}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <SentimentBadge sentiment={results.sentiment} />
                        <span className="text-xs text-white/60">AI estimate</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <SentimentGauge sentiment={results.sentiment} />
                    </div>
                  </div>
                </div>

                {/* Key accounts */}
                <div className="bg-white/5 rounded-2xl p-6 border border-purple-500/20">
                  <h4 className="font-semibold mb-3">Key Voices</h4>
                  <div className="flex flex-wrap gap-2">
                    {(results.keyAccounts.length > 0 ? results.keyAccounts : ["@onchainanalyst"]).map(
                      (a, idx) => (
                        <a
                          key={a + idx}
                          href={`https://twitter.com/${a.replace("@", "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-md bg-purple-600/10 hover:bg-purple-600/20"
                        >
                          {a}
                        </a>
                      )
                    )}
                  </div>
                </div>

                {/* Key points + search terms */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-6 border border-purple-500/20">
                    <h4 className="font-semibold mb-3">Key Discussion Points</h4>
                    <ul className="list-decimal ml-5 text-white/80 space-y-2">
                      {(results.keyPoints.length > 0 ? results.keyPoints : ["No key points found"]).map(
                        (kp, i) => (
                          <li key={i}>{kp}</li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-6 border border-purple-500/20">
                    <h4 className="font-semibold mb-3">Suggested Search Terms</h4>
                    <div className="flex flex-wrap gap-2">
                      {(results.searchTerms.length > 0 ? results.searchTerms : ["no-term"]).map((t, i) => (
                        <button
                          key={t + i}
                          onClick={() => {
                            setQuery(t);
                            searchTwitter(t);
                          }}
                          className="px-3 py-1 rounded-full bg-white/6"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simulated timeline */}
                <div className="bg-white/5 rounded-2xl p-6 border border-purple-500/20">
                  <h4 className="font-semibold mb-3">Mentions (simulated)</h4>
                  <div className="space-y-3">
                    {simulatedTimeline(results).map((it, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-sm">
                          {it.account.replace("@", "").slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{it.account}</div>
                            <div className="text-xs text-white/50">{it.time}</div>
                          </div>
                          <div className="text-white/80">{it.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="col-span-3 bg-white/3 rounded-2xl p-4 sticky top-6 h-fit">
          <div className="mb-4">
            <h3 className="font-semibold">Quick Actions</h3>
            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={() => {
                  if (history[0]) {
                    setQuery(history[0]);
                    searchTwitter(history[0]);
                  }
                }}
                className="px-3 py-2 bg-white/5 rounded-md"
              >
                Use latest search
              </button>

              <button
                onClick={() => {
                  if (results) {
                    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                  }
                }}
                className="px-3 py-2 bg-white/5 rounded-md"
              >
                Export result
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Help</h3>
            <div className="text-sm mt-2 text-white/60">
              This app generates AI-simulated Twitter/X summaries — not live tweets.
              Use suggested searches for quick demos.
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-semibold"
              onClick={() => alert("Thanks for supporting!")}
            >
              <div className="flex items-center gap-2 justify-center">
                <Heart className="w-4 h-4" />
                Support
              </div>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

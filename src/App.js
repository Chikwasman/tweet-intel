import React, { useState } from 'react';
import {
  Search,
  TrendingUp,
  MessageCircle,
  Loader2,
  ExternalLink,
  Heart,
  Copy,
  Check,
} from 'lucide-react';

export default function CryptoTwitterSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [showDonation, setShowDonation] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState('');

  // ----------------------------------------------------
  // ✅ FIXED FOR GROQ BACKEND (NOT ANTHROPIC)
  // ----------------------------------------------------
  const searchTwitter = async () => {
    if (!query.trim()) {
      setError('Please enter a crypto event or story to search');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/.netlify/functions/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      // ----------------------------------------------------
      // ✔️ GROQ RETURNS: { content: "JSON STRING" }
      // ----------------------------------------------------
      let textContent = '';

      if (typeof data?.content === 'string') {
        textContent = data.content;
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Invalid API response from server.');
      }

      // ----------------------------------------------------
      // ✔️ CLEAN JSON (removes ```json ``` etc.)
      // ----------------------------------------------------
      const cleanText = textContent
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      // ----------------------------------------------------
      // ✔️ PARSE JSON SAFELY
      // ----------------------------------------------------
      let parsed;
      try {
        parsed = JSON.parse(cleanText);
      } catch (err) {
        console.error('JSON Parse Error: RAW OUTPUT ↓↓');
        console.log(cleanText);
        throw new Error('Received invalid JSON from AI.');
      }

      setResults(parsed);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key?.toLowerCase() === 'enter') {
      searchTwitter();
    }
  };

  const getSentimentColor = (sentiment) => {
    const s = sentiment?.toLowerCase() || '';
    if (s.includes('bullish')) return 'text-green-500';
    if (s.includes('bearish')) return 'text-red-500';
    if (s.includes('mixed')) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const openTwitterSearch = (term) => {
    window.open(
      `https://twitter.com/search?q=${encodeURIComponent(term)}&f=live`,
      '_blank'
    );
  };

  const donationAddresses = {
    evm: '0x9025f5d4Ca5Ac5Ae4fD0ef8324500d7818cd5861',
    solana: 'ARpRNUMsa9v6tZZcqrvR13CHdJDUGLoNApuXnzaPbFGx',
    bitcoin: 'bc1q32rkhgrfh7kd9n9ey7aaar0n856354xlgvm4tn',
  };

  const copyToClipboard = (address, type) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(type);
    setTimeout(() => setCopiedAddress(''), 2000);
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
          <p className="text-purple-200">
            AI-powered search for crypto events & Twitter discussions
          </p>
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
                placeholder="e.g., Bitcoin ETF approval, Ethereum merge, FTX collapse..."
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
              />
            </div>

            <button
              onClick={searchTwitter}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              <p className="text-purple-100 leading-relaxed">{results.summary}</p>
            </div>

            {/* Sentiment */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-3">Market Sentiment</h2>
              <div
                className={`text-2xl font-bold ${getSentimentColor(
                  results.sentiment
                )} capitalize`}
              >
                {results.sentiment}
              </div>
            </div>

            {/* Key Accounts */}
            {results.keyAccounts?.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-xl font-bold text-white mb-4">Key Voices</h2>
                <div className="flex flex-wrap gap-3">
                  {results.keyAccounts.map((account, idx) => (
                    <a
                      key={idx}
                      href={`https://twitter.com/${account.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/30 rounded-lg text-purple-200 hover:text-white transition-all flex items-center gap-2"
                    >
                      {account}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Key Points */}
            {results.keyPoints?.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-xl font-bold text-white mb-4">Key Discussion Points</h2>
                <ul className="space-y-3">
                  {results.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 text-sm flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-purple-100">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Search Terms */}
            {results.searchTerms?.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-xl font-bold text-white mb-4">
                  Search Twitter/X Directly
                </h2>
                <div className="flex flex-wrap gap-3">
                  {results.searchTerms.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => openTwitterSearch(term)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all flex items-center gap-2"
                    >
                      {term}
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Examples */}
        {!results && !loading && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-semibold text-white mb-3">
              Try searching for:
            </h3>

            <div className="flex flex-wrap gap-2">
              {[
                'Bitcoin ETF',
                'Ethereum Shanghai upgrade',
                'Solana outage',
                'Dogecoin pump',
                'NFT market crash',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg text-purple-200 text-sm transition-all"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Donation Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setShowDonation(!showDonation)}
          className="group relative px-6 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-full font-bold shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 hover:scale-110 flex items-center gap-3 animate-pulse hover:animate-none"
        >
          <Heart className="w-6 h-6 fill-current" />
          <span className="text-lg">Support This Tool</span>
        </button>

        {showDonation && (
          <div className="absolute bottom-20 right-0 w-96 bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 border-2 border-purple-500/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500 fill-current" />
                Donate Crypto
              </h3>
              <button
                onClick={() => setShowDonation(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-purple-200 text-sm mb-6">
              Support development with crypto donations. Click to copy address!
            </p>

            <div className="space-y-3">
              <button
                onClick={() => copyToClipboard(donationAddresses.evm, 'evm')}
                className="w-full group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 p-4 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-lg">
                    EVM (ETH/BSC/Polygon)
                  </span>
                  {copiedAddress === 'evm' ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-purple-200 group-hover:text-white" />
                  )}
                </div>

                <div className="text-purple-100 text-xs font-mono break-all bg-black/20 p-2 rounded">
                  {donationAddresses.evm}
                </div>
              </button>

              <button
                onClick={() => copyToClipboard(donationAddresses.solana, 'solana')}
                className="w-full group bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 p-4 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-lg">Solana</span>
                  {copiedAddress === 'solana' ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-cyan-200 group-hover:text-white" />
                  )}
                </div>

                <div className="text-cyan-100 text-xs font-mono break-all bg-black/20 p-2 rounded">
                  {donationAddresses.solana}
                </div>
              </button>

              <button
                onClick={() => copyToClipboard(donationAddresses.bitcoin, 'bitcoin')}
                className="w-full group bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 p-4 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-lg">Bitcoin</span>
                  {copiedAddress === 'bitcoin' ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-orange-200 group-hover:text-white" />
                  )}
                </div>

                <div className="text-orange-100 text-xs font-mono break-all bg-black/20 p-2 rounded">
                  {donationAddresses.bitcoin}
                </div>
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              Thank you for your support! 🙏
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

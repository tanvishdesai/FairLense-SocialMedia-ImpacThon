"use client";

import { useState } from "react";

interface AuditResult {
  is_biased: boolean;
  bias_score: number;
  explanation: string;
  suggestion: string;
  category?: string;
  trigger_words?: string[];
  policy_violation?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [extractedImageUrl, setExtractedImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");

  // New States for Settings
  const [language, setLanguage] = useState("English");
  const [mode, setMode] = useState("Standard");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setExtractedImageUrl(""); // Clear extracted image if file is selected
    }
  };

  const handleFetchUrl = async () => {
    if (!url) return;
    setFetching(true);
    setError("");
    setResult(null);
    setFile(null); // Clear file if URL is fetched

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (res.ok) {
        setExtractedImageUrl(data.imageUrl);
        setCaption(data.caption);
      } else {
        setError(data.error || "Failed to fetch content");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setFetching(false);
    }
  };

  const handleAudit = async () => {
    if (!file && !caption && !extractedImageUrl) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    if (file) {
        formData.append("file", file);
    } else if (extractedImageUrl) {
        formData.append("imageUrl", extractedImageUrl);
    }
    formData.append("caption", caption);
    formData.append("language", language);
    formData.append("sensitivity", mode);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <main className="max-w-2xl mx-auto bg-gray-800 rounded-xl shadow-2xl overflow-hidden p-8 border border-gray-700">
        <h1 className="text-3xl font-bold text-center text-purple-400 mb-2">
          FairLens 👁️
        </h1>
        <p className="text-center text-gray-400 mb-8">
          AI-Powered Social Media Bias Auditor
        </p>

        <div className="space-y-6">
           {/* Settings: Language & Sensitivity */}
           <div className="flex flex-col sm:flex-row gap-4 mb-4 bg-gray-700/50 p-4 rounded-lg border border-gray-600">
             <div className="flex-1">
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Context Language</label>
               <select
                 value={language}
                 onChange={(e) => setLanguage(e.target.value)}
                 className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 focus:border-purple-500 outline-none text-sm"
               >
                 <option value="English">Global (English)</option>
                 <option value="Hindi + English">Indian Context (Hinglish)</option>
                 <option value="Gujarati">Gujarati (Regional)</option>
               </select>
             </div>

             <div className="flex-1">
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Sensitivity Mode</label>
               <select
                 value={mode}
                 onChange={(e) => setMode(e.target.value)}
                 className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 focus:border-purple-500 outline-none text-sm"
               >
                 <option value="Standard">Standard Moderation</option>
                 <option value="Strict">Strict (Family Friendly)</option>
                 <option value="Loose">Loose (Free Speech)</option>
               </select>
             </div>
           </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Image (Meme/Post)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-900 file:text-purple-300
                  hover:file:bg-purple-800 cursor-pointer"
              />
            </div>

            <div className="text-center text-gray-500 text-sm">- OR -</div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Paste Social Media Post URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={fetching || !url}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {fetching ? "..." : "Fetch"}
                </button>
              </div>
            </div>

            {/* Extracted Image Preview */}
            {extractedImageUrl && (
              <div className="mt-4">
                 <p className="text-sm text-gray-400 mb-2">Extracted Image:</p>
                 <img src={extractedImageUrl} alt="Extracted" className="w-full max-h-64 object-contain rounded-lg border border-gray-600" />
              </div>
            )}
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Caption / Text
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Enter the caption or text content here..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleAudit}
            disabled={(!file && !caption && !extractedImageUrl) || loading}
            className={`w-full py-3 px-4 rounded-lg font-bold transition-all ${
              (!file && !caption && !extractedImageUrl) || loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg"
            }`}
          >
            {loading ? "Auditing Content..." : "Audit for Bias"}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg text-center">
            {error}
          </div>
        )}

        {result && (
          <div className={`mt-8 p-6 rounded-lg border ${result.is_biased ? "bg-red-900/20 border-red-500" : "bg-green-900/20 border-green-500"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-2xl font-bold ${result.is_biased ? "text-red-400" : "text-green-400"}`}>
                {result.is_biased ? "⚠️ Bias Detected" : "✅ Content looks Safe"}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                result.bias_score > 50 ? "bg-red-500 text-white" : "bg-green-500 text-white"
              }`}>
                Score: {result.bias_score}/100
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Explanation</h3>
                <p className="text-gray-200 mt-1">{result.explanation}</p>
              </div>

              {result.is_biased && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Suggested Fix</h3>
                  <div className="mt-1 p-3 bg-gray-700 rounded-lg border-l-4 border-green-500">
                    <p className="text-green-300 italic">"{result.suggestion}"</p>
                  </div>
                </div>
              )}

              {/* Advanced Evidence / Details */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                  <details className="group">
                      <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-purple-400 hover:text-purple-300 transition-colors">
                          <span>🔍 View Detailed Analysis</span>
                          <span className="transition group-open:rotate-180">
                              <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                          </span>
                      </summary>
                      <div className="text-gray-300 mt-3 bg-gray-900/50 p-4 rounded-lg space-y-3 text-sm">

                          {/* Trigger Words */}
                          {result.trigger_words && result.trigger_words.length > 0 && (
                            <div>
                                <strong className="block text-red-400 mb-1">Trigger Words Detected:</strong>
                                <div className="flex flex-wrap gap-2">
                                    {result.trigger_words.map((word, i) => (
                                        <span key={i} className="bg-red-900/40 text-red-200 px-2 py-1 rounded border border-red-800 text-xs">
                                            {word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                          )}

                          {/* Category */}
                          {result.category && (
                              <p><strong className="text-gray-400">Category:</strong> {result.category}</p>
                          )}

                          {/* Policy Check */}
                          <div>
                              <strong className="block text-gray-400 mb-1">Compliance Check:</strong>
                              <ul className="space-y-1 pl-1">
                                  <li className="flex items-center gap-2">
                                      {result.is_biased ? '❌' : '✅'} Twitter Safety Policy
                                  </li>
                                  <li className="flex items-center gap-2">
                                      {result.policy_violation === "Yes" ? '❌' : '✅'} Indian IT Act (Section 66A)
                                  </li>
                              </ul>
                          </div>

                      </div>
                  </details>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

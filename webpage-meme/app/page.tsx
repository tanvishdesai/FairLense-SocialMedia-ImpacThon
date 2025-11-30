"use client";

import { useState } from "react";

interface AuditResult {
  is_biased: boolean;
  bias_score: number;
  explanation: string;
  suggestion: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleAudit = async () => {
    if (!file && !caption) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("caption", caption);

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
          {/* Image Upload */}
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
            disabled={(!file && !caption) || loading}
            className={`w-full py-3 px-4 rounded-lg font-bold transition-all ${
              (!file && !caption) || loading
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Send, Code2, Eye, HelpCircle } from "lucide-react";

export default function EmbedBuilderPage() {
  const [jsonInput, setJsonInput] = useState(`{
  "content": "Hello! This is a live preview.",
  "embeds": [
    {
      "title": "Welcome to RNG Embed Builder",
      "description": "You can edit this JSON to instantly see how it will look in Discord.",
      "color": 15009940,
      "author": {
        "name": "Admin System"
      }
    }
  ]
}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsed, setParsed] = useState<any>(null);
  const [error, setError] = useState("");

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setJsonInput(value);
    try {
      setParsed(JSON.parse(value));
      setError("");
    } catch {
      setError("Invalid JSON format");
    }
  };

  // Initialize parsed state
  if (!parsed && !error) {
    try { setParsed(JSON.parse(jsonInput)); } catch {}
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Embed Builder</h1>
          <p className="text-white/60 text-sm mt-1">Visually design Discord embeds with JSON.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dim text-white rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(229,9,20,0.4)]">
          <Send className="w-4 h-4" />
          Send to Channel
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Editor Panel */}
        <div className="flex flex-col bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-black/20">
            <div className="flex items-center gap-2 text-white/80 font-medium text-sm">
              <Code2 className="w-4 h-4 text-primary" />
              JSON Configuration
            </div>
            {error && <span className="text-xs text-red-400 font-medium bg-red-500/10 px-2 py-1 rounded">{error}</span>}
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={jsonInput}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "var(--font-mono)",
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
              }}
            />
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="flex flex-col bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-black/20 text-white/80 font-medium text-sm">
            <Eye className="w-4 h-4 text-blue-400" />
            Live Discord Preview
          </div>
          <div className="flex-1 p-6 overflow-y-auto bg-[#313338]">
            {parsed ? (
              <div className="flex gap-4 max-w-2xl">
                <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center font-bold shadow-lg">
                  R
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">RNG Bot</span>
                    <span className="text-xs bg-[#5865F2] text-white px-1 rounded font-medium tracking-wide">BOT</span>
                    <span className="text-xs text-[#949BA4]">Today at 12:00 PM</span>
                  </div>
                  
                  {parsed.content && (
                    <div className="text-[#DBDEE1] whitespace-pre-wrap mb-2 text-[15px] leading-relaxed">
                      {parsed.content}
                    </div>
                  )}

                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {parsed.embeds?.map((embed: any, i: number) => (
                    <div 
                      key={i} 
                      className="bg-[#2B2D31] rounded flex overflow-hidden mt-2 max-w-[520px]"
                    >
                      <div 
                        className="w-1 flex-shrink-0" 
                        style={{ backgroundColor: embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#202225' }} 
                      />
                      <div className="p-4 flex-1">
                        {embed.author?.name && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-white">{embed.author.name}</span>
                          </div>
                        )}
                        {embed.title && (
                          <div className="font-bold text-[#00A8FC] mb-1 hover:underline cursor-pointer">
                            {embed.title}
                          </div>
                        )}
                        {embed.description && (
                          <div className="text-sm text-[#DBDEE1] whitespace-pre-wrap leading-relaxed">
                            {embed.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/40">
                <HelpCircle className="w-8 h-8 mb-2 opacity-50" />
                <p>Fix JSON errors to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

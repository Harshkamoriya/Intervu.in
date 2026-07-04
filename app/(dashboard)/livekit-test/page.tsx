"use client";

import { useState } from "react";
import { LiveKitRoom, AudioConference } from "@livekit/components-react";

export default function InterviewPage() {
  const [token, setToken] = useState<string | null>(null);
  const [lkUrl, setLkUrl] = useState<string | null>(null);

  const startInterview = async () => {
    const res = await fetch("/api/livekit/token");
    const data = await res.json();
    setToken(data.token);
    setLkUrl(data.url);
  };

  if (!token || !lkUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Ready for your AI Interview?</h1>
        <button onClick={startInterview} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
          Start Interview
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={lkUrl}
      data-lk-theme="default"
    >
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl mb-4 text-green-500 animate-pulse">Interview in Progress...</h2>
        <AudioConference />
      </div>
    </LiveKitRoom>
  );
}
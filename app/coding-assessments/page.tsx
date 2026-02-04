"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Clock,
  Eye,
  Code2,
  ShieldAlert,
  Play,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import AppHeader from "../(dashboard)/_components/AppHeader";

type Difficulty = "easy" | "medium" | "hard";

export default function CodingAssessmentPage() {
  const router = useRouter();

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [loading, setLoading] = useState(false);

  const handleStartAssessment = async () => {
    try {
      setLoading(true);

      const res = await axios.post("/api/coding-assessments", {
        difficulty,
        duration: 90,
        language: "cpp", // default for now
      });

      const assessmentId = res.data.assessmentId;
      router.push(`/coding-assessments/${assessmentId}`);
    } catch (err) {
      toast.error("Failed to start assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200">
      {/* <AppHeader /> */}

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* HERO / OVERVIEW */}
        <div className="rounded-xl border border-gray-800 bg-[#141414] p-8">
          <h1 className="text-3xl font-bold">Coding Assessment</h1>
          <p className="mt-2 text-gray-400">
            Simulates real interview coding tests used by MNCs & startups.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
            <InfoItem icon={<Clock />} label="Duration" value="90 mins" />
            <InfoItem icon={<Code2 />} label="Questions" value="3" />
            <InfoItem icon={<Eye />} label="Proctored" value="Yes" />
            <InfoItem
              icon={<ShieldAlert />}
              label="Difficulty"
              value="Selectable"
            />
          </div>
        </div>

        {/* DIFFICULTY SELECTION */}
        <div className="mt-10 rounded-xl border border-gray-800 bg-[#141414] p-6">
          <h2 className="text-xl font-semibold">Select Difficulty</h2>

          <div className="mt-4 flex gap-4">
            {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`rounded-lg px-6 py-3 text-sm font-medium transition ${
                  difficulty === level
                    ? "bg-blue-600 text-white"
                    : "border border-gray-700 text-gray-400 hover:bg-gray-800"
                }`}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Difficulty controls question complexity and scoring distribution.
          </p>
        </div>

        {/* RULES */}
        <div className="mt-10 rounded-xl border border-gray-800 bg-[#141414] p-6">
          <h2 className="text-xl font-semibold">Assessment Rules</h2>
          <ul className="mt-4 space-y-2 text-sm text-gray-400">
            <li>• Full screen mode is mandatory</li>
            <li>• Tab switching is monitored</li>
            <li>• Copy–paste is disabled</li>
            <li>• Camera & mic may be required</li>
            <li>• Violations may auto-submit your test</li>
          </ul>
        </div>

        {/* PREVIOUS ATTEMPTS */}
        <div className="mt-10 rounded-xl border border-gray-800 bg-[#141414] p-6">
          <h2 className="text-xl font-semibold">Previous Attempts</h2>
          <p className="mt-2 text-sm text-gray-500">
            You haven’t attempted any coding assessments yet.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 flex justify-end">
          <Button
            onClick={handleStartAssessment}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 px-8 py-4 text-lg hover:bg-blue-700"
          >
            <Play className="h-5 w-5" />
            {loading ? "Creating Assessment..." : "Start Assessment"}
          </Button>
        </div>
      </div>
    </div>
  );
}


function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-blue-500">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

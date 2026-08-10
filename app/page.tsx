import type { Metadata } from "next";
import { LeanScribe } from "./components/LeanScribe";

export const metadata: Metadata = {
  title: "LeanScribe — Trusted Semantic Publishing for Lean",
  description:
    "Publish elaborated Lean 4 declarations as readable, traceable mathematical literature with semantic coverage ledgers.",
};

export default function Home() {
  const expertEnabled =
    process.env.EXPERT_MODE_ENABLED === "true" &&
    Boolean(process.env.OPENAI_API_KEY);

  return <LeanScribe expertEnabled={expertEnabled} />;
}

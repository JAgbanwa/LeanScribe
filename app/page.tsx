import type { Metadata } from "next";
import { LeanScribe } from "./components/LeanScribe";

export const metadata: Metadata = {
  title: "LeanScribe — Proof-aware Lean to PDF, TeX & CSV",
  description:
    "Reverse-formalize Lean 4 source into rigorous natural-language PDF, TeX, and CSV documentation with whole-file context.",
};

export default function Home() {
  return <LeanScribe />;
}

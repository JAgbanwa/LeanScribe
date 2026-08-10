import type { Metadata } from "next";
import { LeanScribe } from "./components/LeanScribe";

export const metadata: Metadata = {
  title: "LeanScribe — Lean to Plain English, PDF, TeX & CSV",
  description:
    "Paste Lean source and instantly turn it into plain-English PDF, TeX, and CSV documents in your browser.",
};

export default function Home() {
  return <LeanScribe />;
}

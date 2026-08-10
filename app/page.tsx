import type { Metadata } from "next";
import { LeanScribe } from "./components/LeanScribe";

export const metadata: Metadata = {
  title: "LeanScribe — Lean to LaTeX & PDF",
  description:
    "Turn Lean theorem files into polished LaTeX and readable PDF documents, entirely in your browser.",
};

export default function Home() {
  return <LeanScribe />;
}

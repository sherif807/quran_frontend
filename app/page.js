"use client";
import { redirect } from "next/navigation";

export default function Home() {
  // Redirect root to the first sura.
  redirect("/1");
}

"use client";

import dynamic from "next/dynamic";
import { BoardProvider } from "@/lib/board-context";
import { ChatWidget } from "@/components/ChatWidget";

const Board = dynamic(() => import("@/components/Board").then((mod) => mod.Board), {
  ssr: false,
});

export default function Home() {
  return (
    <BoardProvider>
      <header className="sparkle relative flex items-center gap-4 bg-gradient-to-r from-black via-dark-navy to-black px-6 py-4 border-b-4 border-accent-yellow shadow-[0_2px_20px_rgba(236,173,10,0.45)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/swagger.avif"
          alt="Ric Flair, styling and profiling"
          className="h-14 w-14 rounded-full object-cover border-4 border-accent-yellow shadow-[0_0_14px_rgba(236,173,10,0.8)]"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-wide bg-gradient-to-r from-accent-yellow via-yellow-100 to-accent-yellow bg-clip-text text-transparent">
            Space Mountain Task Tracker
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 font-semibold">
            Woooo! To be the champ, you gotta ship the tasks
          </p>
        </div>
      </header>
      <Board />
      <ChatWidget />
    </BoardProvider>
  );
}

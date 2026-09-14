"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LogOut } from "lucide-react";
import { BoardProvider } from "@/lib/board-context";
import { ChatWidget } from "@/components/ChatWidget";
import { LoginForm } from "@/components/LoginForm";
import { me, logout, type AuthUser } from "@/lib/auth-api";

const Board = dynamic(() => import("@/components/Board").then((mod) => mod.Board), {
  ssr: false,
});

export default function Home() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    me().then(setUser);
  }, []);

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  if (user === undefined) {
    return <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Loading…</div>;
  }

  if (user === null) {
    return <LoginForm onSuccess={setUser} />;
  }

  return (
    <BoardProvider>
      <header className="sparkle relative flex items-center gap-4 bg-gradient-to-r from-black via-dark-navy to-black px-6 py-4 border-b-4 border-accent-yellow shadow-[0_2px_20px_rgba(236,173,10,0.45)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/swagger.avif"
          alt="Ric Flair, styling and profiling"
          className="h-14 w-14 rounded-full object-cover border-4 border-accent-yellow shadow-[0_0_14px_rgba(236,173,10,0.8)]"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-wide bg-gradient-to-r from-accent-yellow via-yellow-100 to-accent-yellow bg-clip-text text-transparent">
            Space Mountain Task Tracker
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 font-semibold">
            Woooo! To be the champ, you gotta ship the tasks
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className="flex items-center gap-1 text-sm text-gray-300 hover:text-accent-yellow transition-colors"
        >
          <LogOut size={16} />
          Log out
        </button>
      </header>
      <Board />
      <ChatWidget />
    </BoardProvider>
  );
}

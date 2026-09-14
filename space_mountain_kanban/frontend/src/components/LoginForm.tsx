"use client";

import { useState, type FormEvent } from "react";
import { login, type AuthUser } from "@/lib/auth-api";

export function LoginForm({ onSuccess }: { onSuccess: (user: AuthUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(username, password);
      onSuccess(user);
    } catch {
      setError("Invalid username or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-4 rounded-2xl border-2 border-accent-yellow bg-black/80 backdrop-blur-md shadow-[0_0_30px_rgba(236,173,10,0.35)] p-6"
      >
        <h1 className="text-xl font-bold uppercase tracking-wide text-accent-yellow text-center">
          Space Mountain Task Tracker
        </h1>
        <p className="text-xs text-purple-300 text-center uppercase tracking-[0.2em]">
          Sign in to see your board
        </p>
        <label className="flex flex-col gap-1 text-sm text-gray-300">
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            className="text-sm text-dark-navy bg-white rounded-md border border-gray-200 px-2 py-1 outline-none focus:border-blue-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-300">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-sm text-dark-navy bg-white rounded-md border border-gray-200 px-2 py-1 outline-none focus:border-blue-primary"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={!username || !password || isSubmitting}
          className="text-sm bg-purple-secondary text-white rounded-lg px-3 py-2 ring-1 ring-accent-yellow/50 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

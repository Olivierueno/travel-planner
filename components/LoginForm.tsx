'use client';

import { useState, useEffect, FormEvent } from 'react';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) window.location.href = '/trip';
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) window.location.href = '/trip';
      else {
        setError(data.error || 'Authentication failed');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-300" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-[10px] p-6 w-full max-w-[340px]">
      <div className="text-center mb-5">
        <p className="text-[10px] uppercase tracking-[1.5px] text-neutral-400 mb-1">
          UENO Systems
        </p>
        <h1 className="text-[22px] font-semibold text-neutral-900">
          Travel Planner
        </h1>
        <p className="text-[12px] text-neutral-500 mt-2">
          Enter the shared password to continue
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-[border-color] duration-150"
        />

        {error && (
          <p className="text-red-500 text-[12px] mt-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full mt-3 py-2 bg-neutral-900 text-white rounded-lg text-[12px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity duration-150"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

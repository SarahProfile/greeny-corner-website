'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function PlantSearch({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }
    params.delete('page');
    startTransition(() => {
      router.push(`/plants?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-2xl">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search plants by name or scientific name..."
        className="flex-1 border-2 border-emerald-200 rounded-2xl px-5 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white shadow-sm text-base"
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-2xl shadow-md transition-all disabled:opacity-60 whitespace-nowrap"
      >
        {isPending ? '...' : '🔍 Search'}
      </button>
    </form>
  );
}

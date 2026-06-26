import { useState, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative group">
        {/* Search icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] group-focus-within:text-red-500 transition-colors duration-200">
          {loading
            ? <Loader2 size={18} className="animate-spin text-red-500" />
            : <Search size={18} />
          }
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search artists, albums, labels..."
          className="
            w-full bg-[#111] border border-[#2a2a2a] text-white placeholder-[#3a3a3a]
            rounded-lg pl-11 pr-24 py-4 text-base font-body outline-none
            focus:border-red-600 focus:ring-2 focus:ring-red-600/20
            transition-all duration-200
          "
          disabled={loading}
        />

        {/* Right side controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[#555] hover:text-white transition-colors p-1 rounded hover:bg-[#1a1a1a]"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="
              bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed
              text-white text-sm font-body font-medium px-4 py-2 rounded
              transition-all duration-200 active:scale-95 tracking-wide
            "
          >
            Search
          </button>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-xs text-[#333] mt-2 ml-1">
        Press <kbd className="bg-[#1a1a1a] border border-[#2a2a2a] rounded px-1.5 py-0.5 text-[#555] font-mono">Enter</kbd> to search
      </p>
    </form>
  );
}

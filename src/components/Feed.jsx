import { useState, useEffect, useCallback } from 'react';
import { Clock, Star, ChevronLeft, ChevronRight, Music, Loader2 } from 'lucide-react';

// Proxied image helper
const proxyImg = (url) =>
  url ? `/api/proxy-image?url=${encodeURIComponent(url)}` : '';

function StarDisplay({ score }) {
  return (
    <span className="flex gap-px">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={s <= score ? 'text-red-500' : 'text-[#2a2a2a]'}>★</span>
      ))}
    </span>
  );
}

function FeedItem({ item, onUserClick }) {
  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const scoreLabel = ['', 'Terrible', 'Meh', 'Decent', 'Great', 'Masterpiece'][item.score];

  return (
    <div className="vinyl-card animate-slide-up hover:border-[#333] transition-all duration-300">
      <div className="flex gap-4 p-4">
        {/* Album thumb */}
        <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-[#0d0d0d] border border-[#1a1a1a]">
          {item.album_thumb ? (
            <img
              src={proxyImg(item.album_thumb)}
              alt={item.album_title}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display='none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music size={20} className="text-[#2a2a2a]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Activity line */}
          <p className="text-sm text-[#888] mb-1.5 leading-snug">
            <button
              onClick={() => onUserClick(item.username)}
              className="text-red-500 hover:text-red-400 font-medium transition-colors"
            >
              {item.username}
            </button>
            {' '}rated{' '}
            <span className="text-white font-medium">{item.album_title}</span>
            {item.album_artist !== 'Unknown Artist' && (
              <span className="text-[#666]"> by {item.album_artist}</span>
            )}
          </p>

          {/* Stars + label */}
          <div className="flex items-center gap-2 mb-1.5">
            <StarDisplay score={item.score} />
            <span className="text-xs font-mono text-red-400">{item.score}/5</span>
            <span className="text-xs text-[#444]">— {scoreLabel}</span>
          </div>

          {/* Review snippet */}
          {item.review && (
            <p className="text-xs text-[#666] italic line-clamp-2 mt-1">
              "{item.review}"
            </p>
          )}
        </div>

        {/* Timestamp */}
        <div className="flex-shrink-0 text-right">
          <span className="text-xs text-[#333] font-mono flex items-center gap-1 whitespace-nowrap">
            <Clock size={10} />
            {timeAgo(item.created_at)}
          </span>
          {item.album_year && (
            <span className="text-xs text-[#2a2a2a] font-mono block mt-1">
              {item.album_year}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Feed({ onUserClick }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchFeed = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/feed?page=${p}&per_page=20`);
      const data = await res.json();
      setItems(data.items || []);
      setPagination({ total: data.total, pages: data.pages });
      setPage(data.page);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeed(1); }, [fetchFeed]);

  const changePage = (p) => {
    fetchFeed(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="font-display text-4xl sm:text-5xl text-white mb-1">
            COMMUNITY <span className="text-red-600">FEED</span>
          </h2>
          <p className="text-[#555] text-sm">Latest ratings from all members</p>
        </div>
        {pagination.total > 0 && (
          <p className="text-sm text-[#444] font-mono hidden sm:block">
            {pagination.total} total ratings
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-red-600 animate-spin" />
            <p className="text-[#444] font-mono text-sm">Loading feed...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-[#111] border border-[#2a2a2a] flex items-center justify-center">
            <Star size={32} className="text-[#2a2a2a]" />
          </div>
          <h3 className="font-display text-3xl text-[#2a2a2a]">No Activity Yet</h3>
          <p className="text-[#333] text-sm text-center max-w-xs">
            Be the first to rate an album. Search for something and add it to your vault.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map(item => (
              <FeedItem key={item.id} item={item} onUserClick={onUserClick} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => changePage(page - 1)}
                disabled={page <= 1 || loading}
                className="vinyl-btn-ghost flex items-center gap-2 disabled:opacity-30"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="text-sm text-[#555] font-mono px-4">
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => changePage(page + 1)}
                disabled={page >= pagination.pages || loading}
                className="vinyl-btn-ghost flex items-center gap-2 disabled:opacity-30"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

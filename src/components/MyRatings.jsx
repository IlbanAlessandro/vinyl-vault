import { useState } from 'react';
import { Trash2, Edit3, Music, Calendar, ChevronDown, ChevronUp, AlertTriangle, Users } from 'lucide-react';
import StarRating from './StarRating';
import RatingModal from './RatingModal';

const proxyImg = (url) =>
  url ? `/api/proxy-image?url=${encodeURIComponent(url)}` : '';

function DeleteConfirm({ album, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
         onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm vinyl-card border-red-900/50 animate-slide-up">
        <div className="h-0.5 bg-gradient-to-r from-red-800 via-red-600 to-transparent" />
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-900/50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <h3 className="font-display text-xl text-white mb-2">Remove from Vault?</h3>
          <p className="text-sm text-[#888] mb-1">{album.album_artist}</p>
          <p className="text-sm text-[#666] mb-6 font-mono">"{album.album_title}"</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="vinyl-btn-ghost flex-1">Cancel</button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 bg-red-700 hover:bg-red-600 text-white font-body font-medium px-4 py-2 rounded transition-all duration-200 disabled:opacity-50 text-sm"
            >
              {deleting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RatedAlbumRow({ rating, onEdit, onDelete }) {
  const [expanded, setExpanded]       = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [showEdit, setShowEdit]       = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [communityStats, setCommunityStats] = useState(null);

  // Lazy-load community stats when expanded
  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !communityStats) {
      fetch(`/api/albums/${rating.album_id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => data && setCommunityStats(data))
        .catch(() => {});
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(rating.id); }
    finally { setDeleting(false); setShowDelete(false); }
  };

  const handleEdit = async (data) => {
    await onEdit(rating.id, data);
    setShowEdit(false);
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <div className="vinyl-card animate-slide-up">
        <div className="flex items-center gap-4 p-4">
          {/* Thumb */}
          <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-[#0d0d0d] border border-[#2a2a2a]">
            {rating.album_thumb ? (
              <img
                src={proxyImg(rating.album_thumb)}
                alt={rating.album_title}
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display='none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music size={20} className="text-[#2a2a2a]" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-lg text-white leading-tight truncate">
                  {rating.album_title}
                </h3>
                <p className="text-sm text-[#888] truncate">{rating.album_artist}</p>
              </div>
              <div className="hidden sm:block flex-shrink-0">
                <StarRating value={rating.score} readonly size="sm" />
              </div>
            </div>
            <div className="sm:hidden mt-1">
              <StarRating value={rating.score} readonly size="sm" />
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {rating.album_year && (
                <span className="text-xs text-[#555] flex items-center gap-1">
                  <Calendar size={10} /> {rating.album_year}
                </span>
              )}
              <span className="text-xs text-[#444] font-mono">
                {formatDate(rating.created_at)}
              </span>
              <button
                onClick={handleExpand}
                className="text-xs text-red-600 hover:text-red-400 flex items-center gap-0.5 transition-colors"
              >
                {rating.review ? 'Review' : 'Community'}
                {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="p-2 text-[#555] hover:text-blue-400 hover:bg-[#1a1a1a] rounded transition-all"
              title="Edit"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="p-2 text-[#555] hover:text-red-500 hover:bg-red-950/30 rounded transition-all"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Expanded: review + community stats */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-[#1a1a1a] pt-3 animate-fade-in space-y-3">
            {rating.review && (
              <p className="text-sm text-[#aaa] leading-relaxed italic">"{rating.review}"</p>
            )}
            {communityStats && communityStats.total_ratings > 0 && (
              <div className="flex items-center gap-3 p-3 bg-[#0d0d0d] rounded-lg border border-[#1a1a1a]">
                <Users size={14} className="text-red-500 flex-shrink-0" />
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[#555]">Community:</span>
                  <span className="text-white font-mono font-medium">
                    ★ {communityStats.avg_rating}
                  </span>
                  <span className="text-[#444]">
                    ({communityStats.total_ratings} rating{communityStats.total_ratings !== 1 ? 's' : ''})
                  </span>
                  <span className="text-[#444]">vs</span>
                  <span className="text-red-400 font-mono">your {rating.score}/5</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showDelete && (
        <DeleteConfirm
          album={rating}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          deleting={deleting}
        />
      )}
      {showEdit && (
        <RatingModal
          album={{ title: rating.album_title, artist: rating.album_artist, thumb_url: rating.album_thumb }}
          existingData={{ rating: rating.score, review: rating.review }}
          onSave={handleEdit}
          onClose={() => setShowEdit(false)}
          isEditing
        />
      )}
    </>
  );
}

export default function MyRatings({ ratings, onEdit, onDelete, loading }) {
  const [sortBy, setSortBy] = useState('newest');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#2a2a2a] border-t-red-600 animate-spin" />
        <p className="text-[#555] font-mono text-sm">Loading vault...</p>
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-[#111] border border-[#2a2a2a] flex items-center justify-center mb-2">
          <Music size={36} className="text-[#2a2a2a]" />
        </div>
        <h3 className="font-display text-3xl text-white">Vault is Empty</h3>
        <p className="text-[#555] text-sm text-center max-w-xs">
          Search for albums and start building your personal record collection.
        </p>
      </div>
    );
  }

  const sorted = [...ratings].sort((a, b) => {
    if (sortBy === 'newest')  return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest')  return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'highest') return b.score - a.score;
    if (sortBy === 'lowest')  return a.score - b.score;
    if (sortBy === 'artist')  return (a.album_artist || '').localeCompare(b.album_artist || '');
    return 0;
  });

  const avg = (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1);

  return (
    <div>
      {/* Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-[#111] border border-[#2a2a2a] rounded-lg">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-2xl font-display text-white">{ratings.length}</p>
            <p className="text-xs text-[#555] uppercase tracking-widest">Records</p>
          </div>
          <div className="h-8 w-px bg-[#2a2a2a]" />
          <div>
            <p className="text-2xl font-display text-red-500">{avg}</p>
            <p className="text-xs text-[#555] uppercase tracking-widest">Avg Rating</p>
          </div>
          <div className="h-8 w-px bg-[#2a2a2a]" />
          <div>
            <p className="text-2xl font-display text-white">
              {ratings.filter(r => r.score === 5).length}
            </p>
            <p className="text-xs text-[#555] uppercase tracking-widest">Masterpieces</p>
          </div>
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-[#161616] border border-[#2a2a2a] text-[#c8c8c8] text-sm rounded px-3 py-1.5 outline-none focus:border-red-600 cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
          <option value="artist">By Artist</option>
        </select>
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map(r => (
          <RatedAlbumRow key={r.id} rating={r} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

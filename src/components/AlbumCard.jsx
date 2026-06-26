import { useState, useEffect } from 'react';
import { Plus, Check, Music, Calendar, Tag, Users } from 'lucide-react';
import RatingModal from './RatingModal';
import { useAuth } from '../context/AuthContext';

// Proxy Discogs images through our backend to avoid 403
const proxyImg = (url) =>
  url ? `/api/proxy-image?url=${encodeURIComponent(url)}` : '';

function CommunityBadge({ discogs_id }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`/api/albums/${discogs_id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.total_ratings > 0) setStats(data);
      })
      .catch(() => {});
  }, [discogs_id]);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-1 vinyl-tag">
      <Users size={9} />
      <span className="text-red-400">{stats.avg_rating}</span>
      <span className="text-[#444]">({stats.total_ratings})</span>
    </div>
  );
}

export default function AlbumCard({ album, savedIds, onAdd }) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const isSaved = savedIds.has(album.discogs_id);

  const handleSave = async ({ rating, review }) => {
    await onAdd({ ...album, rating, review });
    setShowModal(false);
  };

  return (
    <>
      <div className="vinyl-card animate-slide-up flex flex-col">
        {/* Cover image */}
        <div className="relative aspect-square overflow-hidden bg-[#0d0d0d] group">
          {album.thumb_url ? (
            <img
              src={proxyImg(album.thumb_url)}
              alt={`${album.title} cover`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={e => { e.target.style.display='none'; }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Music size={36} className="text-[#2a2a2a]" />
              <span className="text-xs text-[#2a2a2a] font-mono">No Cover</span>
            </div>
          )}

          {isSaved && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-mono px-2 py-1 rounded flex items-center gap-1">
              <Check size={10} /> In Vault
            </div>
          )}

          {!isSaved && user && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <button
                onClick={() => setShowModal(true)}
                className="vinyl-btn-primary flex items-center gap-2"
              >
                <Plus size={15} /> Rate & Add
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-display text-lg text-white leading-tight mb-0.5 line-clamp-2">
            {album.title}
          </h3>
          <p className="text-sm text-[#888] mb-3 line-clamp-1">{album.artist}</p>

          <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
            {album.year && (
              <span className="vinyl-tag flex items-center gap-1">
                <Calendar size={9} /> {album.year}
              </span>
            )}
            {album.genre?.[0] && (
              <span className="vinyl-tag flex items-center gap-1">
                <Tag size={9} /> {album.genre[0]}
              </span>
            )}
            <CommunityBadge discogs_id={album.discogs_id} />
          </div>

          <button
            onClick={() => !isSaved && user && setShowModal(true)}
            disabled={isSaved || !user}
            className={`
              w-full py-2 rounded text-sm font-body font-medium transition-all duration-200 flex items-center justify-center gap-2
              ${isSaved
                ? 'bg-[#1a1a1a] text-green-500 border border-green-900/50 cursor-default'
                : !user
                  ? 'bg-[#1a1a1a] text-[#444] border border-[#222] cursor-not-allowed'
                  : 'vinyl-btn-primary'
              }
            `}
          >
            {isSaved ? (
              <><Check size={14} /> Added to Vault</>
            ) : !user ? (
              'Login to Rate'
            ) : (
              <><Plus size={14} /> Add to Vault</>
            )}
          </button>
        </div>
      </div>

      {showModal && !isSaved && user && (
        <RatingModal
          album={album}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

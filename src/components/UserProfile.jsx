import { useState, useEffect } from 'react';
import { ArrowLeft, Music, Star, Calendar, Trophy, Loader2, User } from 'lucide-react';

const proxyImg = (url) =>
  url ? `/api/proxy-image?url=${encodeURIComponent(url)}` : '';

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 text-center">
      <p className={`text-3xl font-display ${accent ? 'text-red-500' : 'text-white'}`}>
        {value ?? '—'}
      </p>
      <p className="text-xs text-[#444] uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function StarDisplay({ score }) {
  return (
    <span className="flex gap-px text-sm">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={s <= score ? 'text-red-500' : 'text-[#222]'}>★</span>
      ))}
    </span>
  );
}

export default function UserProfile({ username, onBack, currentUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then(r => r.ok ? r.json() : Promise.reject('User not found'))
      .then(data => { setProfile(data); setLoading(false); })
      .catch(e => { setError(typeof e === 'string' ? e : 'Failed to load profile'); setLoading(false); });
  }, [username]);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={32} className="text-red-600 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <p className="text-red-400">{error}</p>
      <button onClick={onBack} className="vinyl-btn-ghost flex items-center gap-2">
        <ArrowLeft size={16} /> Go back
      </button>
    </div>
  );

  const scoreLabel = ['','Terrible','Meh','Decent','Great','Masterpiece'];
  const isOwn = currentUser?.username === username;

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#555] hover:text-white text-sm transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back to feed
      </button>

      {/* Profile header */}
      <div className="vinyl-card border-[#222] mb-6 overflow-visible">
        <div className="h-0.5 bg-gradient-to-r from-red-700 via-red-500 to-transparent" />
        <div className="p-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
              <User size={28} className="text-[#333]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-3xl text-white">{profile.username}</h2>
                {isOwn && (
                  <span className="text-xs bg-red-900/30 border border-red-900/50 text-red-400 px-2 py-0.5 rounded font-mono">
                    you
                  </span>
                )}
              </div>
              <p className="text-sm text-[#444] flex items-center gap-1 mt-1">
                <Calendar size={12} />
                Member since {formatDate(profile.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Records Rated" value={profile.total_ratings} />
        <StatCard label="Avg Score Given" value={profile.avg_given} accent />
        <StatCard label="Masterpieces" value={profile.masterpieces} />
      </div>

      {/* Ratings list */}
      <h3 className="font-display text-2xl text-white mb-4">
        {isOwn ? 'Your' : `${profile.username}'s`} Ratings
      </h3>

      {profile.ratings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Music size={36} className="text-[#2a2a2a]" />
          <p className="text-[#333] text-sm">No ratings yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {profile.ratings.map(r => (
            <div key={r.id} className="vinyl-card hover:border-[#333] transition-all duration-200">
              <div className="flex gap-4 p-4 items-center">
                {/* Cover */}
                <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-[#0d0d0d] border border-[#1a1a1a]">
                  {r.album_thumb ? (
                    <img
                      src={proxyImg(r.album_thumb)}
                      alt={r.album_title}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display='none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music size={18} className="text-[#2a2a2a]" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{r.album_title}</p>
                  <p className="text-[#666] text-sm truncate">{r.album_artist}</p>
                  {r.review && (
                    <p className="text-xs text-[#555] italic mt-1 line-clamp-1">"{r.review}"</p>
                  )}
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  <StarDisplay score={r.score} />
                  <p className="text-xs text-red-400 font-mono mt-0.5">{scoreLabel[r.score]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

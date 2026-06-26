import { useState, useEffect, useCallback } from 'react';
import {
  Search, Disc3, BookMarked, Rss, AlertCircle,
  ChevronLeft, ChevronRight, LogOut, User, Loader2
} from 'lucide-react';

import { useAuth } from './context/AuthContext';
import AuthPage    from './components/AuthPage';
import SearchBar   from './components/SearchBar';
import AlbumCard   from './components/AlbumCard';
import MyRatings   from './components/MyRatings';
import Feed        from './components/Feed';
import UserProfile from './components/UserProfile';

// Toast notification
function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`
      fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-lg shadow-2xl animate-slide-up max-w-sm
      ${type === 'error'
        ? 'bg-red-950 border border-red-800 text-red-200'
        : 'bg-[#161616] border border-green-900/60 text-green-300'
      }
    `}>
      <span className="text-sm font-body">{message}</span>
      <button onClick={onDismiss} className="text-current opacity-50 hover:opacity-100 text-lg leading-none ml-1">×</button>
    </div>
  );
}

// ── Main app (after login) ────────────────────────────────────────────────────

function MainApp() {
  const { user, logout, authFetch } = useAuth();

  // Tab navigation
  const [tab, setTab]               = useState('search');
  const [profileUser, setProfileUser] = useState(null); // username string

  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError]     = useState('');
  const [pagination, setPagination]       = useState({ page: 1, pages: 1, total: 0 });

  // My ratings state
  const [myRatings, setMyRatings]         = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') =>
    setToast({ message, type, id: Date.now() });

  // Fetch my ratings
  const fetchMyRatings = useCallback(async () => {
    setRatingsLoading(true);
    try {
      const res  = await authFetch('/api/my-ratings');
      const data = await res.json();
      setMyRatings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setRatingsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchMyRatings(); }, [fetchMyRatings]);

  // Set of saved discogs IDs for quick lookup in search results
  const savedIds = new Set(myRatings.map(r => r.album_id));

  // Search
  const handleSearch = async (query, page = 1) => {
    if (!query) { setSearchResults([]); setSearchQuery(''); return; }
    setSearchQuery(query);
    setSearchLoading(true);
    setSearchError('');
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}&per_page=20`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setSearchResults(data.results || []);
      setPagination({ page: data.page || 1, pages: data.pages || 1, total: data.total || 0 });
    } catch (err) {
      setSearchError(err.message);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePageChange = (p) => {
    handleSearch(searchQuery, p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add rating (via POST /api/ratings)
  const handleAddAlbum = async (albumData) => {
    const res  = await authFetch('/api/ratings', {
      method: 'POST',
      body: JSON.stringify({
        discogs_id: albumData.discogs_id,
        title:      albumData.title,
        artist:     albumData.artist,
        year:       albumData.year,
        thumb_url:  albumData.thumb_url,
        score:      albumData.rating,
        review:     albumData.review || '',
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409) { showToast('Already in your vault!', 'error'); return; }
      throw new Error(data.error || 'Failed to add');
    }
    setMyRatings(prev => [data, ...prev]);
    showToast(`"${data.album_title}" added to your vault! 🎵`);
  };

  // Edit rating
  const handleEditRating = async (ratingId, { rating, review }) => {
    const res  = await authFetch(`/api/ratings/${ratingId}`, {
      method: 'PUT',
      body: JSON.stringify({ score: rating, review }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update');
    setMyRatings(prev => prev.map(r => r.id === ratingId ? data : r));
    showToast('Rating updated ✓');
  };

  // Delete rating
  const handleDeleteRating = async (ratingId) => {
    const rating = myRatings.find(r => r.id === ratingId);
    const res    = await authFetch(`/api/ratings/${ratingId}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    setMyRatings(prev => prev.filter(r => r.id !== ratingId));
    showToast(`"${rating?.album_title}" removed.`);
  };

  // Navigate to user profile
  const goToProfile = (username) => {
    setProfileUser(username);
    setTab('profile');
  };

  const tabs = [
    { id: 'search',  label: 'Search',     icon: Search,     count: null },
    { id: 'feed',    label: 'Feed',        icon: Rss,        count: null },
    { id: 'vault',   label: 'My Ratings', icon: BookMarked, count: myRatings.length || null },
  ];

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => setTab('search')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="relative">
                <Disc3 size={28} className="text-red-600" />
                <Disc3 size={28} className="text-red-600 absolute inset-0 blur-md opacity-40" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-2xl text-white tracking-wider leading-none">VINYL VAULT</h1>
                <p className="text-[10px] text-[#444] font-mono uppercase tracking-widest">Rate Your Records</p>
              </div>
            </button>

            {/* Tabs */}
            <nav className="flex items-center gap-1">
              {tabs.map(({ id, label, icon: Icon, count }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded text-sm font-body font-medium transition-all duration-200
                    ${tab === id && tab !== 'profile'
                      ? 'bg-red-600 text-white'
                      : 'text-[#666] hover:text-white hover:bg-[#161616]'
                    }
                  `}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{label}</span>
                  {count > 0 && (
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none
                      ${tab === id ? 'bg-white/20' : 'bg-red-600/20 text-red-400'}`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToProfile(user.username)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded text-sm transition-all duration-200
                  ${tab === 'profile' && profileUser === user.username
                    ? 'bg-[#1a1a1a] text-white border border-red-800'
                    : 'text-[#666] hover:text-white hover:bg-[#161616]'
                  }
                `}
              >
                <User size={15} />
                <span className="hidden sm:inline text-xs font-mono">{user.username}</span>
              </button>
              <button
                onClick={logout}
                className="p-2 text-[#555] hover:text-red-500 hover:bg-red-950/20 rounded transition-all"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* SEARCH */}
        {tab === 'search' && (
          <div>
            <div className="mb-8">
              <h2 className="font-display text-4xl sm:text-5xl text-white mb-2">
                FIND YOUR <span className="text-red-600">RECORDS</span>
              </h2>
              <p className="text-[#555] text-sm mb-6">Search the Discogs database of millions of releases.</p>
              <SearchBar onSearch={handleSearch} loading={searchLoading} />
            </div>

            {searchError && (
              <div className="flex items-start gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-lg mb-6 animate-fade-in">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 text-sm font-medium">Search failed</p>
                  <p className="text-red-600/70 text-xs mt-0.5">{searchError}</p>
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[#555]">
                    <span className="text-white font-medium">{pagination.total.toLocaleString()}</span>
                    {' '}results for <span className="text-red-400 font-mono">"{searchQuery}"</span>
                  </p>
                  <p className="text-xs text-[#444] font-mono">Page {pagination.page}/{pagination.pages}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {searchResults.map(album => (
                    <AlbumCard
                      key={album.discogs_id}
                      album={album}
                      savedIds={savedIds}
                      onAdd={handleAddAlbum}
                    />
                  ))}
                </div>
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1 || searchLoading}
                      className="vinyl-btn-ghost flex items-center gap-2 disabled:opacity-30"
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <span className="text-sm text-[#555] font-mono px-4">
                      {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages || searchLoading}
                      className="vinyl-btn-ghost flex items-center gap-2 disabled:opacity-30"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}

            {!searchLoading && !searchError && searchResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-[#111] border border-[#1a1a1a] flex items-center justify-center">
                    <Disc3 size={40} className="text-[#2a2a2a]" />
                  </div>
                  <div className="absolute inset-0 rounded-full border border-red-900/20 animate-ping" />
                </div>
                <h3 className="font-display text-3xl text-[#2a2a2a]">
                  {searchQuery ? 'No Results Found' : 'Start Searching'}
                </h3>
                <p className="text-[#333] text-sm text-center max-w-xs">
                  {searchQuery
                    ? `No albums found for "${searchQuery}".`
                    : 'Type an artist name, album title, or label.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* FEED */}
        {tab === 'feed' && (
          <Feed onUserClick={goToProfile} />
        )}

        {/* MY VAULT */}
        {tab === 'vault' && (
          <div>
            <div className="mb-8">
              <h2 className="font-display text-4xl sm:text-5xl text-white mb-2">
                MY <span className="text-red-600">VAULT</span>
              </h2>
              <p className="text-[#555] text-sm">Your personal ratings and reviews.</p>
            </div>
            <MyRatings
              ratings={myRatings}
              onEdit={handleEditRating}
              onDelete={handleDeleteRating}
              loading={ratingsLoading}
            />
          </div>
        )}

        {/* USER PROFILE */}
        {tab === 'profile' && profileUser && (
          <UserProfile
            username={profileUser}
            currentUser={user}
            onBack={() => setTab('feed')}
          />
        )}
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      <footer className="border-t border-[#111] mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <p className="text-[#2a2a2a] text-xs font-mono">VINYL VAULT © {new Date().getFullYear()}</p>
          <p className="text-[#1a1a1a] text-xs font-mono">Powered by Discogs API</p>
        </div>
      </footer>
    </div>
  );
}

// ── Root with auth gate ───────────────────────────────────────────────────────

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Disc3 size={40} className="text-red-600 animate-spin" />
          <p className="text-[#333] font-mono text-sm">Loading Vinyl Vault...</p>
        </div>
      </div>
    );
  }

  return user ? <MainApp /> : <AuthPage />;
}

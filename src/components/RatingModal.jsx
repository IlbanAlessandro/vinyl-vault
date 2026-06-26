import { useState, useEffect } from 'react';
import { X, Music } from 'lucide-react';
import StarRating from './StarRating';

export default function RatingModal({ album, existingData, onSave, onClose, isEditing = false }) {
  const [rating, setRating] = useState(existingData?.rating || 3);
  const [review, setReview] = useState(existingData?.review || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!rating) {
      setError('Please select a star rating.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ rating, review });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const ratingLabels = { 1: 'Terrible', 2: 'Meh', 3: 'Decent', 4: 'Great', 5: 'Masterpiece' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md vinyl-card border-[#333] animate-slide-up">
        {/* Red accent line top */}
        <div className="h-0.5 w-full bg-gradient-to-r from-red-700 via-red-500 to-transparent" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-3">
              {album.thumb_url ? (
                <img
                  src={album.thumb_url}
                  alt={album.title}
                  className="w-14 h-14 object-cover rounded border border-[#2a2a2a] flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-[#1a1a1a] rounded border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                  <Music size={20} className="text-[#333]" />
                </div>
              )}
              <div>
                <p className="text-xs text-red-500 font-mono uppercase tracking-widest mb-0.5">
                  {isEditing ? 'Edit Rating' : 'Rate Album'}
                </p>
                <h3 className="font-display text-lg text-white leading-tight">{album.title}</h3>
                <p className="text-sm text-[#888]">{album.artist}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#555] hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded hover:bg-[#1a1a1a]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Rating */}
          <div className="mb-5">
            <label className="block text-xs text-[#666] uppercase tracking-widest mb-3">
              Your Rating
            </label>
            <div className="flex items-center gap-4">
              <StarRating value={rating} onChange={setRating} size="lg" />
              {rating > 0 && (
                <span className="text-sm text-red-400 font-mono">
                  {ratingLabels[rating]}
                </span>
              )}
            </div>
          </div>

          {/* Review */}
          <div className="mb-6">
            <label className="block text-xs text-[#666] uppercase tracking-widest mb-2">
              Review <span className="text-[#444] normal-case">(optional)</span>
            </label>
            <textarea
              className="vinyl-input resize-none text-sm"
              rows={4}
              placeholder="What makes this record special? Drop your honest take..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={1000}
            />
            <p className="text-right text-xs text-[#444] mt-1">{review.length}/1000</p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm mb-4 bg-red-950/30 border border-red-900/50 rounded px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="vinyl-btn-ghost flex-1">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !rating}
              className="vinyl-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                isEditing ? 'Update Rating' : 'Add to Vault'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

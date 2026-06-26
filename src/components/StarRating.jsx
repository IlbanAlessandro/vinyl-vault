import { useState } from 'react';

export default function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);

  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className="flex gap-0.5" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange && onChange(star)}
            className={`
              ${sizeClass} transition-all duration-100 leading-none
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}
              ${filled
                ? 'text-red-500 drop-shadow-[0_0_6px_rgba(220,38,38,0.7)]'
                : 'text-[#333]'
              }
            `}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

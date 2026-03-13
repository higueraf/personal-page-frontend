import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  fallback,
  className = '',
}) => {
  const sizeStyles = {
    xs: { width: 24, height: 24, fontSize: 10 },
    sm: { width: 32, height: 32, fontSize: 12 },
    md: { width: 48, height: 48, fontSize: 16 },
    lg: { width: 64, height: 64, fontSize: 20 },
    xl: { width: 96, height: 96, fontSize: 24 },
  };

  const currentSize = sizeStyles[size];

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent && fallback) {
      parent.innerHTML = `
        <div style="
          width: ${currentSize.width}px;
          height: ${currentSize.height}px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: ${currentSize.fontSize}px;
        ">
          ${fallback.charAt(0).toUpperCase()}
        </div>
      `;
    }
  };

  return (
    <div
      className={`avatar-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <img
        src={src}
        alt={alt}
        onError={handleError}
        style={{
          width: currentSize.width,
          height: currentSize.height,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid var(--color-border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      />
    </div>
  );
};

export default Avatar;

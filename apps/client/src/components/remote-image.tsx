import React from "react";

interface RemoteImageProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

export const RemoteImage: React.FC<RemoteImageProps> = ({ src, alt, className, onClick, onLoad }) => {
    // For relative paths, prepend origin; for absolute URLs, use as-is to preserve query params
    const resolvedSrc = src.startsWith('http') ? src : new URL(src, window.location.origin).toString();
  return <img src={resolvedSrc} alt={alt} className={className} onClick={onClick} onLoad={onLoad} />;
};

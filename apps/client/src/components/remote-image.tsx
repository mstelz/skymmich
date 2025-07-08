import React from "react";

interface RemoteImageProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

export const RemoteImage: React.FC<RemoteImageProps> = ({ src, alt, className, onClick, onLoad }) => {
    const url = new URL(src, window.location.origin);
    // Use the current window location as the base to ensure it works from any host
    const newUrl = new URL(url.pathname, window.location.origin);
  return <img src={newUrl.toString()} alt={alt} className={className} onClick={onClick} onLoad={onLoad} />;
};

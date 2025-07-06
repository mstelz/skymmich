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
    const newUrl = new URL(url.pathname, 'http://localhost:5000'); // Ensure the URL is absolute and points to your server
  return <img src={newUrl.toString()} alt={alt} className={className} onClick={onClick} onLoad={onLoad} />;
};

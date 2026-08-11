import React from 'react';

export default function Skeleton({ className = "", type = "rectangular", width, height }) {
  const baseClass = "animate-pulse bg-surface-container-highest";

  let typeClass = "";
  if (type === "circular") typeClass = "rounded-full";
  else if (type === "rectangular") typeClass = "rounded-xl";
  else if (type === "text") typeClass = "rounded-md h-4 mb-2 last:mb-0";

  const style = {
    width: width || (type === "text" ? "100%" : undefined),
    height: height || (type === "text" ? undefined : undefined),
  };

  return (
    <div
      className={`${baseClass} ${typeClass} ${className}`}
      style={style}
    />
  );
}

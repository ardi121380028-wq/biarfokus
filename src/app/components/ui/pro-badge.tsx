import React, { useId } from "react";

type ProBadgeProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  showStar?: boolean;
};

export function ProBadge({
  size = "sm",
  className = "",
  showStar = true,
}: ProBadgeProps) {
  const id = useId();
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  const starGradId = `proStarGradSvg-${safeId}`;
  const highlightGradId = `proStarHighlightSvg-${safeId}`;
  const starShadowId = `proStarShadowSvg-${safeId}`;

  const starSize = size === "sm" ? 11 : size === "md" ? 13 : 15;

  return (
    <span
      className={`pro-vip-badge badge-${size} ${className}`}
      title="BiarFokus Pro Member"
      aria-label="Akun Pro"
    >
      <span className="pro-vip-text">PRO</span>
      {showStar && (
        <svg
          className="pro-vip-star"
          viewBox="0 0 24 24"
          width={starSize}
          height={starSize}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={starGradId} x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#fff9c4" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#facc15" />
              <stop offset="85%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id={highlightGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
            <filter id={starShadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.2" stdDeviation="0.8" floodColor="#78350f" floodOpacity="0.5" />
            </filter>
          </defs>
          {/* Main 3D Golden Star with smooth beveled points */}
          <path
            d="M12 2.2l2.85 6.13 6.65.61c.64.06.9 0.86.42 1.3l-4.97 4.54 1.45 6.55c.14.63-.54 1.12-1.09.79L12 18.78l-5.31 3.34c-.55.33-1.23-.16-1.09-.79l1.45-6.55-4.97-4.54c-.48-.44-.22-1.24.42-1.3l6.65-.61L12 2.2z"
            fill={`url(#${starGradId})`}
            filter={`url(#${starShadowId})`}
          />
          {/* 3D Specular Highlight for glossy volume */}
          <path
            d="M12 3.8l1.8 3.8 4.1.38-3 2.7.9 4-3.8-2.2-3.8 2.2.9-4-3-2.7 4.1-.38L12 3.8z"
            fill={`url(#${highlightGradId})`}
            opacity="0.5"
          />
        </svg>
      )}
    </span>
  );
}
